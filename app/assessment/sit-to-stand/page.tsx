"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CircleHelp, Pause, Play, ShieldCheck, Square } from "lucide-react";
import type { PoseLandmarker } from "@mediapipe/tasks-vision";
import MobileShell from "@/components/layout/MobileShell";
import Header from "@/components/layout/Header";
import CameraPreview from "@/components/camera/CameraPreview";
import CameraSwitcher from "@/components/camera/CameraSwitcher";
import PoseOverlay, {
  drawPoseFrame,
  syncCanvasSize,
} from "@/components/camera/PoseOverlay";
import CameraGuide, {
  RecognitionBadge,
  RecognitionStatus,
} from "@/components/camera/CameraGuide";
import CameraPermissionState from "@/components/camera/CameraPermissionState";
import SitStandTimer from "@/components/assessment/SitStandTimer";
import RepCounter from "@/components/assessment/RepCounter";
import SafetyNotice from "@/components/assessment/SafetyNotice";
import { useCamera } from "@/lib/camera/useCamera";
import { loadPoseLandmarker, detectPose } from "@/lib/mediapipe/poseLandmarker";
import {
  SitToStandAnalyzer,
  extractFrameMetrics,
} from "@/lib/analyzers/sitToStandAnalyzer";
import { buildReportCopy } from "@/lib/scoring/reportCopy";
import { saveAssessmentRecord } from "@/lib/data/records";
import { AssessmentSummary } from "@/types/assessment";

const MEASURE_DURATION_SEC = 30;
const POSITION_COUNTDOWN_SEC = 5;
/** 캘리브레이션 진행 정체 시 안내 표시까지 대기 (ms) */
const CALIBRATION_STALL_MS = 3000;
/** 추론 throttle: 모바일 성능을 위해 ~15fps */
const INFER_INTERVAL_MS = 66;

type Phase =
  | "setup"
  | "calibration"
  | "countdown"
  | "measuring"
  | "paused"
  | "saving";

export default function SitToStandPage() {
  const router = useRouter();
  const {
    videoRef,
    status: cameraStatus,
    facing,
    errorType,
    start: startCamera,
    switchFacing,
    stop: stopCamera,
  } = useCamera("user");

  const [phase, setPhase] = useState<Phase>("setup");
  const [modelReady, setModelReady] = useState(false);
  const [modelError, setModelError] = useState(false);
  const [recognition, setRecognition] =
    useState<RecognitionStatus>("loading-model");
  const [repCount, setRepCount] = useState(0);
  const [remainingSec, setRemainingSec] = useState(MEASURE_DURATION_SEC);
  const [countdown, setCountdown] = useState(POSITION_COUNTDOWN_SEC);
  const [calibrationProgress, setCalibrationProgress] = useState(0);
  const [calibrationStallHint, setCalibrationStallHint] = useState(false);
  const [saveError, setSaveError] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const landmarkerRef = useRef<PoseLandmarker | null>(null);
  const analyzerRef = useRef<SitToStandAnalyzer | null>(null);
  const phaseRef = useRef<Phase>("setup");
  const lastInferAtRef = useRef(0);
  const measureStartRef = useRef(0);
  const pausedAccumRef = useRef(0);
  const pauseStartedRef = useRef(0);
  const startedAtIsoRef = useRef("");
  const finishingRef = useRef(false);
  const rafRef = useRef(0);
  const calibrationProgressAtRef = useRef(0);
  const lastCalibrationProgressRef = useRef(0);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  // 카메라 시작
  useEffect(() => {
    startCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // MediaPipe 모델 로딩
  useEffect(() => {
    let cancelled = false;
    loadPoseLandmarker()
      .then((lm) => {
        if (cancelled) return;
        landmarkerRef.current = lm;
        setModelReady(true);
      })
      .catch(() => {
        if (!cancelled) setModelError(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const mirrored = facing === "user";
  const mirroredRef = useRef(mirrored);
  useEffect(() => {
    mirroredRef.current = mirrored;
  }, [mirrored]);

  const finishMeasurement = useCallback(async () => {
    if (finishingRef.current) return;
    finishingRef.current = true;
    setPhase("saving");
    stopCamera();

    const analyzer = analyzerRef.current;
    if (!analyzer) return;

    const result = analyzer.buildResult(MEASURE_DURATION_SEC);
    const copy = buildReportCopy(result);
    const summary: AssessmentSummary = {
      id: crypto.randomUUID(),
      assessmentType: "sit_to_stand_30s",
      completedAt: new Date().toISOString(),
      cameraFacing: facing,
      result: {
        durationSec: result.durationSec,
        repCount: result.repCount,
        avgRepTimeSec: result.avgRepTimeSec,
        validFrameRatio: result.validFrameRatio,
        avgFps: result.avgFps,
        trackingLostCount: result.trackingLostCount,
        qualityScore: result.qualityScore,
        qualityLevel: result.qualityLevel,
        resultLevel: result.resultLevel,
        stabilityScore: result.stabilityScore,
        resultSummary: copy.summary,
      },
    };

    try {
      await saveAssessmentRecord(summary, startedAtIsoRef.current);
      router.replace(`/report/${summary.id}`);
    } catch {
      setSaveError(true);
      finishingRef.current = false;
    }
  }, [stopCamera, facing, router]);

  const finishRef = useRef(finishMeasurement);
  useEffect(() => {
    finishRef.current = finishMeasurement;
  }, [finishMeasurement]);

  // 메인 분석 루프 (requestAnimationFrame + 추론 throttle)
  useEffect(() => {
    const loop = () => {
      rafRef.current = requestAnimationFrame(loop);

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const landmarker = landmarkerRef.current;
      const now = performance.now();
      const currentPhase = phaseRef.current;

      if (!video || !landmarker || video.readyState < 2) return;
      if (now - lastInferAtRef.current < INFER_INTERVAL_MS) return;
      lastInferAtRef.current = now;

      const result = detectPose(landmarker, video, now);
      const landmarks = result?.landmarks?.[0] ?? null;

      // skeleton overlay
      if (canvas) {
        syncCanvasSize(canvas, video);
        drawPoseFrame(canvas, video, landmarks, mirroredRef.current);
      }

      if (currentPhase === "setup") {
        if (!landmarks) {
          setRecognition("detecting");
        } else {
          const m = extractFrameMetrics(landmarks);
          if (!m) setRecognition("detecting");
          else if (!m.fullBodyVisible) setRecognition("not-full-body");
          else if (m.visibility < 0.5) setRecognition("detecting");
          else setRecognition("good");
        }
        return;
      }

      if (currentPhase === "calibration" && landmarks) {
        const analyzer = analyzerRef.current;
        if (!analyzer) return;
        const progress = analyzer.addCalibrationFrame(landmarks);
        setCalibrationProgress(progress);
        if (analyzer.isCalibrated) {
          analyzer.finishCalibration();
          measureStartRef.current = performance.now();
          pausedAccumRef.current = 0;
          startedAtIsoRef.current = new Date().toISOString();
          setPhase("measuring");
        }
        return;
      }

      if (currentPhase === "measuring") {
        const analyzer = analyzerRef.current;
        if (!analyzer) return;
        const { repCount: count } = analyzer.addFrame(landmarks, now);
        setRepCount(count);

        const elapsed = (now - measureStartRef.current - pausedAccumRef.current) / 1000;
        const remaining = Math.max(0, Math.ceil(MEASURE_DURATION_SEC - elapsed));
        setRemainingSec(remaining);
        if (elapsed >= MEASURE_DURATION_SEC) {
          finishRef.current();
        }
      }
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [videoRef]);

  // 위치 잡기 카운트다운 (1초마다 감소, 0 도달 시 캘리브레이션 시작)
  useEffect(() => {
    if (phase !== "countdown") return;
    const t = setTimeout(() => {
      if (countdown <= 1) {
        setCalibrationProgress(0);
        setCalibrationStallHint(false);
        calibrationProgressAtRef.current = performance.now();
        lastCalibrationProgressRef.current = 0;
        setPhase("calibration");
      } else {
        setCountdown((c) => c - 1);
      }
    }, 1000);
    return () => clearTimeout(t);
  }, [phase, countdown]);

  // 캘리브레이션 진행 정체 시 안내
  useEffect(() => {
    if (phase !== "calibration") return;

    if (calibrationProgress !== lastCalibrationProgressRef.current) {
      lastCalibrationProgressRef.current = calibrationProgress;
      calibrationProgressAtRef.current = performance.now();
      setCalibrationStallHint(false);
      return;
    }

    if (calibrationProgress >= 1) return;

    const t = setTimeout(() => {
      if (
        phaseRef.current === "calibration" &&
        calibrationProgress < 1 &&
        calibrationProgress === lastCalibrationProgressRef.current &&
        performance.now() - calibrationProgressAtRef.current >= CALIBRATION_STALL_MS
      ) {
        setCalibrationStallHint(true);
      }
    }, CALIBRATION_STALL_MS);

    return () => clearTimeout(t);
  }, [phase, calibrationProgress]);

  const handleStart = () => {
    analyzerRef.current = new SitToStandAnalyzer();
    setCalibrationProgress(0);
    setCalibrationStallHint(false);
    setRepCount(0);
    setRemainingSec(MEASURE_DURATION_SEC);
    setCountdown(POSITION_COUNTDOWN_SEC);
    setPhase("countdown");
  };

  const handlePause = () => {
    pauseStartedRef.current = performance.now();
    setPhase("paused");
  };

  const handleResume = () => {
    pausedAccumRef.current += performance.now() - pauseStartedRef.current;
    setPhase("measuring");
  };

  const handleStop = () => {
    // 중단: 분석 상태 초기화 후 setup으로 복귀 (다시 측정 가능)
    analyzerRef.current = null;
    setRepCount(0);
    setRemainingSec(MEASURE_DURATION_SEC);
    setCountdown(POSITION_COUNTDOWN_SEC);
    setCalibrationProgress(0);
    setCalibrationStallHint(false);
    setPhase("setup");
  };

  const measuring = phase === "measuring" || phase === "paused";

  return (
    <MobileShell className="px-5 pb-8">
      <Header
        right={
          <span className="flex items-center gap-1 text-sm text-sub">
            <CircleHelp size={16} /> 도움말
          </span>
        }
      />

      <h1 className="text-2xl font-black text-ink text-center">
        앉았다 일어나기 30초
      </h1>
      <p className="text-base text-sub text-center mt-1">
        30초 동안 의자에 앉았다 일어나는 횟수를 측정해요.
      </p>

      {/* 상태 패널 */}
      <div className="mt-4 rounded-3xl bg-card border border-gray-100 shadow-sm px-5 py-4 flex items-center justify-between">
        <SitStandTimer remainingSec={remainingSec} />
        <RepCounter count={repCount} />
        <div className="flex flex-col items-end gap-1">
          <RecognitionBadge
            status={modelError ? "detecting" : modelReady ? recognition : "loading-model"}
          />
        </div>
      </div>

      {/* 카메라 영역 */}
      <div className="mt-4 relative">
        {cameraStatus === "error" ? (
          <CameraPermissionState
            state="error"
            errorType={errorType ?? "unknown"}
            onRetry={startCamera}
          />
        ) : cameraStatus !== "active" ? (
          <CameraPermissionState state="requesting" onRetry={startCamera} />
        ) : null}

        <div className={cameraStatus === "active" ? "" : "hidden"}>
          <CameraPreview ref={videoRef} mirrored={mirrored}>
            <PoseOverlay ref={canvasRef} />
            {phase === "setup" && <CameraGuide />}

            {/* 상단 좌우 상태 표시 */}
            <div className="absolute top-3 inset-x-3 flex items-center justify-between">
              <span className="flex items-center gap-1.5 rounded-full bg-black/55 text-white text-xs font-medium px-2.5 py-1.5 backdrop-blur-sm">
                <span className="w-2 h-2 rounded-full bg-success" />
                카메라 연결됨
              </span>
              <CameraSwitcher
                facing={facing}
                onSwitch={switchFacing}
                disabled={measuring}
              />
            </div>

            {/* 캘리브레이션 안내 */}
            {phase === "calibration" && (
              <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-3 px-8 text-center">
                <p className="text-white text-xl font-black">
                  의자에 앉아 주세요
                </p>
                <p className="text-white/80 text-sm leading-relaxed">
                  앉은 자세를 기준으로 잡고 있어요.
                  <br />
                  잠시만 그대로 계세요. 곧 측정이 시작됩니다.
                </p>
                {calibrationStallHint && (
                  <p className="text-warning text-sm font-bold leading-relaxed">
                    전신이 화면에 보이게 해주세요
                  </p>
                )}
                <div className="w-40 h-2 rounded-full bg-white/30 overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${Math.round(calibrationProgress * 100)}%` }}
                  />
                </div>
              </div>
            )}

            {/* 카운트다운 */}
            {phase === "countdown" && (
              <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-2 px-8 text-center">
                <p className="text-white text-xl font-black">
                  뒤로 가서 의자에 앉아 주세요
                </p>
                <p className="text-white/80 text-sm leading-relaxed">
                  {POSITION_COUNTDOWN_SEC}초 안에 위치를 잡아 주세요
                </p>
                <p className="text-white text-7xl font-black tabular-nums mt-2">
                  {countdown}
                </p>
              </div>
            )}

            {/* 일시정지 */}
            {phase === "paused" && (
              <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2">
                <Pause className="text-white" size={48} />
                <p className="text-white text-lg font-bold">일시정지</p>
              </div>
            )}

            {/* 저장 중 */}
            {phase === "saving" && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <p className="text-white text-lg font-bold">
                  결과를 정리하고 있어요...
                </p>
              </div>
            )}
          </CameraPreview>
        </div>
      </div>

      {modelError && (
        <p className="mt-3 text-sm text-danger text-center leading-relaxed">
          분석 모델을 불러오지 못했어요. 네트워크 연결을 확인하고 새로고침해
          주세요.
        </p>
      )}
      {saveError && (
        <p className="mt-3 text-sm text-danger text-center">
          결과 저장에 실패했어요. 다시 시도해 주세요.
        </p>
      )}

      {/* 컨트롤 버튼 */}
      <div className="mt-4 flex flex-col gap-2">
        {phase === "setup" && (
          <>
            <button
              type="button"
              onClick={handleStart}
              disabled={
                !modelReady || cameraStatus !== "active" || modelError
              }
              className="w-full min-h-[56px] rounded-2xl bg-primary text-white text-lg font-bold flex items-center justify-center gap-2 shadow-md active:scale-[0.98] transition disabled:bg-gray-300 disabled:shadow-none"
            >
              <Play size={20} fill="currentColor" />
              {modelReady ? "측정 시작" : "분석 모델 준비 중..."}
            </button>
            <p className="text-sm text-sub text-center leading-relaxed">
              의자가 움직이지 않도록 벽 가까이에 두세요.
            </p>
          </>
        )}

        {phase === "measuring" && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handlePause}
              className="flex-1 min-h-[56px] rounded-2xl bg-card border border-gray-200 text-ink text-base font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition"
            >
              <Pause size={18} /> 일시정지
            </button>
            <button
              type="button"
              onClick={handleStop}
              className="flex-1 min-h-[56px] rounded-2xl bg-danger/10 text-danger text-base font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition"
            >
              <Square size={18} /> 중단
            </button>
          </div>
        )}

        {phase === "paused" && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleResume}
              className="flex-1 min-h-[56px] rounded-2xl bg-primary text-white text-base font-bold flex items-center justify-center gap-2 shadow-md active:scale-[0.98] transition"
            >
              <Play size={18} fill="currentColor" /> 계속하기
            </button>
            <button
              type="button"
              onClick={handleStop}
              className="flex-1 min-h-[56px] rounded-2xl bg-danger/10 text-danger text-base font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition"
            >
              <Square size={18} /> 중단
            </button>
          </div>
        )}

        {(phase === "calibration" || phase === "countdown") && (
          <button
            type="button"
            onClick={handleStop}
            className="w-full min-h-[52px] rounded-2xl bg-card border border-gray-200 text-sub text-base font-bold active:scale-[0.98] transition"
          >
            다시 맞추기
          </button>
        )}
      </div>

      <div className="mt-4 flex flex-col gap-2">
        <SafetyNotice />
        <p className="text-xs text-sub text-center flex items-center justify-center gap-1">
          <ShieldCheck size={14} className="text-primary" />
          측정 영상은 기기에서 분석되며 서버에 저장되지 않습니다.
        </p>
      </div>
    </MobileShell>
  );
}
