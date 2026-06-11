import {
  FilesetResolver,
  PoseLandmarker,
  type PoseLandmarkerResult,
} from "@mediapipe/tasks-vision";

// 버전을 package.json과 일치시켜 wasm/모델 호환성을 보장한다
const TASKS_VISION_VERSION = "0.10.35";
const WASM_BASE_URL = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${TASKS_VISION_VERSION}/wasm`;
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";

let landmarkerPromise: Promise<PoseLandmarker> | null = null;

/**
 * Pose Landmarker 싱글톤 로딩 (모델 ~5MB, 최초 1회만 다운로드).
 * GPU delegate 실패 시 CPU로 fallback.
 */
export function loadPoseLandmarker(): Promise<PoseLandmarker> {
  if (!landmarkerPromise) {
    landmarkerPromise = createLandmarker().catch((err) => {
      landmarkerPromise = null; // 실패 시 재시도 가능하게
      throw err;
    });
  }
  return landmarkerPromise;
}

async function createLandmarker(): Promise<PoseLandmarker> {
  const fileset = await FilesetResolver.forVisionTasks(WASM_BASE_URL);
  const baseOptions = { modelAssetPath: MODEL_URL };

  try {
    return await PoseLandmarker.createFromOptions(fileset, {
      baseOptions: { ...baseOptions, delegate: "GPU" },
      runningMode: "VIDEO",
      numPoses: 1,
      minPoseDetectionConfidence: 0.5,
      minPosePresenceConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });
  } catch {
    // 구형 기기 등 GPU 미지원 시 CPU fallback
    return await PoseLandmarker.createFromOptions(fileset, {
      baseOptions: { ...baseOptions, delegate: "CPU" },
      runningMode: "VIDEO",
      numPoses: 1,
    });
  }
}

/** 비디오 프레임 1장에 대해 포즈 추론 */
export function detectPose(
  landmarker: PoseLandmarker,
  video: HTMLVideoElement,
  timestampMs: number,
): PoseLandmarkerResult | null {
  if (video.readyState < 2 || video.videoWidth === 0) return null;
  try {
    return landmarker.detectForVideo(video, timestampMs);
  } catch {
    return null;
  }
}
