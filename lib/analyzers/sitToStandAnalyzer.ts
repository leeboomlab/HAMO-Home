import { SitStandResult, SitStandState } from "@/types/assessment";
import {
  KEY_LANDMARK_INDICES,
  POSE_INDEX,
  PoseLandmarkPoint,
} from "@/lib/mediapipe/types";
import {
  computeQualityScore,
  qualityLevelFromScore,
} from "./qualityScore";
import { resultLevelFrom } from "@/lib/scoring/resultLevel";

/**
 * 30초 앉았다 일어나기 분석기.
 *
 * 핵심 지표: liftRatio = (kneeY - hipY) / torsoHeight
 *  - 앉은 자세: 엉덩이가 무릎 높이에 가까움 → liftRatio 작음
 *  - 선 자세: 엉덩이가 무릎보다 허벅지 길이만큼 위 → liftRatio 큼
 *  - torsoHeight(어깨-엉덩이)로 정규화하여 카메라 거리와 무관하게 동작
 *
 * 측정 시작 전 캘리브레이션(앉은 자세 기준값)을 거쳐 임계값을 보정하고,
 * 히스테리시스(상/하 임계값 분리) + 최소 반복 간격으로 noise를 무시한다.
 * 1회 = 일어섰다가 다시 앉음 (sitting 확정 시 카운트).
 * 정확도보다 안정성을 우선한다.
 */

export const ANALYZER_VERSION = "1.1.0";

const CONFIG = {
  /** 유효 프레임으로 인정할 주요 관절 visibility 평균 최소값 */
  minVisibility: 0.5,
  /** standing 판정 임계값 (캘리브레이션 보정 전 기본값) */
  standThreshold: 0.55,
  /** sitting 복귀 판정 임계값 */
  sitThreshold: 0.3,
  /** 캘리브레이션된 앉은 자세 liftRatio에 더해지는 오프셋 */
  standOffsetFromBaseline: 0.3,
  sitOffsetFromBaseline: 0.12,
  /** 상태가 확정되기 위한 최소 연속 프레임 수 (너무 빠른 전환 무시) */
  stableFrames: 3,
  /** 1회로 인정할 최소 반복 간격 (ms) */
  minRepIntervalMs: 1200,
  /** tracking lost로 간주할 프레임 공백 (ms) */
  trackingLostGapMs: 700,
  /** 캘리브레이션에 필요한 유효 프레임 수 */
  calibrationFrames: 10,
} as const;

interface FrameMetrics {
  hipY: number;
  shoulderY: number;
  kneeY: number;
  hipX: number;
  visibility: number;
  liftRatio: number;
  fullBodyVisible: boolean;
}

function center(a?: PoseLandmarkPoint, b?: PoseLandmarkPoint) {
  if (!a || !b) return null;
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
    visibility: Math.min(a.visibility ?? 0, b.visibility ?? 0),
  };
}

export function extractFrameMetrics(
  landmarks: PoseLandmarkPoint[],
): FrameMetrics | null {
  const shoulder = center(
    landmarks[POSE_INDEX.leftShoulder],
    landmarks[POSE_INDEX.rightShoulder],
  );
  const hip = center(
    landmarks[POSE_INDEX.leftHip],
    landmarks[POSE_INDEX.rightHip],
  );
  const knee = center(
    landmarks[POSE_INDEX.leftKnee],
    landmarks[POSE_INDEX.rightKnee],
  );
  if (!shoulder || !hip || !knee) return null;

  const torsoHeight = Math.abs(hip.y - shoulder.y);
  if (torsoHeight < 0.05) return null; // 비정상 포즈

  const visibilities = KEY_LANDMARK_INDICES.map(
    (i) => landmarks[i]?.visibility ?? 0,
  );
  const visibility =
    visibilities.reduce((s, v) => s + v, 0) / visibilities.length;

  const footIndices = [27, 28, 29, 30, 31, 32] as const;
  const fullBodyVisible =
    (shoulder.visibility ?? 0) > 0.5 &&
    footIndices.some((i) => (landmarks[i]?.visibility ?? 0) > 0.4);

  return {
    hipY: hip.y,
    shoulderY: shoulder.y,
    kneeY: knee.y,
    hipX: hip.x,
    visibility,
    liftRatio: (knee.y - hip.y) / torsoHeight,
    fullBodyVisible,
  };
}

export class SitToStandAnalyzer {
  private standThreshold: number = CONFIG.standThreshold;
  private sitThreshold: number = CONFIG.sitThreshold;
  private calibrationSamples: number[] = [];

  private state: SitStandState = "unknown";
  private candidateState: SitStandState = "unknown";
  private candidateCount = 0;

  private repCount = 0;
  private repTimestamps: number[] = [];
  private lastRepAt = 0;
  /** standing 후 sitting 복귀 시 1회 카운트, 앉을 때까지 재카운트 금지 */
  private armed = false;

  private totalFrames = 0;
  private validFrames = 0;
  private fullBodyFrames = 0;
  private visibilitySum = 0;
  private trackingLostCount = 0;
  private lastFrameAt: number | null = null;
  private firstFrameAt: number | null = null;
  private standingHipXs: number[] = [];

  // ---------- 캘리브레이션 (앉은 자세 기준값) ----------

  /** @returns 캘리브레이션 진행률 0~1 */
  addCalibrationFrame(landmarks: PoseLandmarkPoint[]): number {
    const m = extractFrameMetrics(landmarks);
    if (m && m.visibility >= CONFIG.minVisibility) {
      this.calibrationSamples.push(m.liftRatio);
    }
    return Math.min(1, this.calibrationSamples.length / CONFIG.calibrationFrames);
  }

  get isCalibrated(): boolean {
    return this.calibrationSamples.length >= CONFIG.calibrationFrames;
  }

  finishCalibration(): void {
    if (this.calibrationSamples.length === 0) return;
    const sorted = [...this.calibrationSamples].sort((a, b) => a - b);
    const baseline = sorted[Math.floor(sorted.length / 2)]; // median
    // 기준값 기반 임계값 보정 (기본값보다 낮아지지는 않게)
    this.standThreshold = Math.max(
      CONFIG.standThreshold,
      baseline + CONFIG.standOffsetFromBaseline,
    );
    this.sitThreshold = Math.max(
      CONFIG.sitThreshold,
      baseline + CONFIG.sitOffsetFromBaseline,
    );
    this.state = "sitting";
    this.armed = false;
  }

  // ---------- 측정 프레임 처리 ----------

  /** @returns 현재 상태/카운트 (UI 갱신용) */
  addFrame(
    landmarks: PoseLandmarkPoint[] | null,
    timestampMs: number,
  ): { state: SitStandState; repCount: number } {
    this.totalFrames += 1;

    // tracking lost 감지 (프레임 공백)
    if (
      this.lastFrameAt !== null &&
      timestampMs - this.lastFrameAt > CONFIG.trackingLostGapMs
    ) {
      this.trackingLostCount += 1;
      // lost 동안에는 상태 후보 초기화 → 복구 직후 오카운트 방지
      this.candidateState = "unknown";
      this.candidateCount = 0;
    }
    if (this.firstFrameAt === null) this.firstFrameAt = timestampMs;
    this.lastFrameAt = timestampMs;

    const m = landmarks ? extractFrameMetrics(landmarks) : null;
    if (!m || m.visibility < CONFIG.minVisibility) {
      // tracking lost 상태에서는 카운트하지 않음
      return { state: this.state, repCount: this.repCount };
    }

    this.validFrames += 1;
    this.visibilitySum += m.visibility;
    if (m.fullBodyVisible) this.fullBodyFrames += 1;

    // 히스테리시스 판정
    let observed: SitStandState;
    if (m.liftRatio >= this.standThreshold) observed = "standing";
    else if (m.liftRatio <= this.sitThreshold) observed = "sitting";
    else observed = "transition";

    if (observed === this.candidateState) {
      this.candidateCount += 1;
    } else {
      this.candidateState = observed;
      this.candidateCount = 1;
    }

    // 연속 N프레임 동일 상태일 때만 확정 (너무 빠른 전환은 noise로 무시)
    if (
      this.candidateCount >= CONFIG.stableFrames &&
      this.candidateState !== "transition" &&
      this.candidateState !== this.state
    ) {
      const prev = this.state;
      this.state = this.candidateState;

      if (this.state === "standing" && prev === "sitting") {
        this.armed = true;
      } else if (this.state === "sitting" && prev === "standing") {
        const sinceLastRep = timestampMs - this.lastRepAt;
        if (this.armed && sinceLastRep >= CONFIG.minRepIntervalMs) {
          this.repCount += 1;
          this.repTimestamps.push(timestampMs);
          this.lastRepAt = timestampMs;
          this.armed = false;
        }
      }
    }

    if (this.state === "standing") {
      this.standingHipXs.push(m.hipX);
    }

    return { state: this.state, repCount: this.repCount };
  }

  // ---------- 결과 ----------

  buildResult(durationSec: number): SitStandResult {
    const validFrameRatio =
      this.totalFrames > 0 ? this.validFrames / this.totalFrames : 0;
    const avgVisibility =
      this.validFrames > 0 ? this.visibilitySum / this.validFrames : 0;

    const elapsedMs =
      this.firstFrameAt !== null && this.lastFrameAt !== null
        ? this.lastFrameAt - this.firstFrameAt
        : 0;
    const avgFps =
      elapsedMs > 0 ? (this.totalFrames - 1) / (elapsedMs / 1000) : 0;

    let avgRepTimeSec: number | null = null;
    if (this.repTimestamps.length >= 2) {
      const gaps: number[] = [];
      for (let i = 1; i < this.repTimestamps.length; i++) {
        gaps.push(this.repTimestamps[i] - this.repTimestamps[i - 1]);
      }
      avgRepTimeSec =
        Math.round((gaps.reduce((s, g) => s + g, 0) / gaps.length / 1000) * 10) /
        10;
    }

    // 안정성: standing 중 좌우 흔들림(표준편차) 기반 0~100
    let stabilityScore: number | null = null;
    if (this.standingHipXs.length >= 10) {
      const mean =
        this.standingHipXs.reduce((s, x) => s + x, 0) /
        this.standingHipXs.length;
      const variance =
        this.standingHipXs.reduce((s, x) => s + (x - mean) ** 2, 0) /
        this.standingHipXs.length;
      const std = Math.sqrt(variance);
      // std 0.005 이하 = 매우 안정(100), 0.05 이상 = 불안정(0)
      stabilityScore = Math.round(
        Math.min(100, Math.max(0, ((0.05 - std) / 0.045) * 100)),
      );
    }

    const qualityScore = computeQualityScore({
      avgFps,
      validFrameRatio,
      avgVisibility,
      trackingLostCount: this.trackingLostCount,
    });
    const qualityLevel = qualityLevelFromScore(qualityScore);
    const resultLevel = resultLevelFrom(this.repCount, qualityLevel);

    return {
      durationSec,
      repCount: this.repCount,
      avgRepTimeSec,
      validFrameRatio: Math.round(validFrameRatio * 100) / 100,
      avgFps: Math.round(avgFps * 10) / 10,
      trackingLostCount: this.trackingLostCount,
      qualityScore,
      qualityLevel,
      resultLevel,
      stabilityScore,
    };
  }
}
