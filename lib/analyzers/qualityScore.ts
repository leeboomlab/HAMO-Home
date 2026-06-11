import { QualityLevel } from "@/types/assessment";

/**
 * 측정 품질 점수 계산.
 * 기기별 FPS/인식률 차이가 크므로 임계값 상수를 한곳에 모아 튜닝 가능하게 유지한다.
 */

export const QUALITY_THRESHOLDS = {
  /** 이 FPS 이상이면 만점 처리 */
  goodFps: 15,
  /** 이 FPS 미만이면 0점 처리 */
  minFps: 5,
  /** 유효 프레임 비율 만점 기준 */
  goodValidRatio: 0.9,
  /** 유효 프레임 비율 0점 기준 */
  minValidRatio: 0.4,
  /** 주요 관절 visibility 평균 만점 기준 */
  goodVisibility: 0.85,
  minVisibility: 0.4,
  /** tracking lost 1회당 감점 */
  trackingLostPenalty: 8,
  maxTrackingLostPenalty: 30,
} as const;

export const QUALITY_LEVEL_BOUNDS = {
  high: 80,
  medium: 60,
  low: 40,
} as const;

export interface QualityInput {
  avgFps: number;
  validFrameRatio: number;
  avgVisibility: number;
  trackingLostCount: number;
}

function ratio(value: number, min: number, max: number): number {
  if (max <= min) return 0;
  return Math.min(1, Math.max(0, (value - min) / (max - min)));
}

/** 0~100 품질 점수 */
export function computeQualityScore(input: QualityInput): number {
  const t = QUALITY_THRESHOLDS;

  const fpsScore = ratio(input.avgFps, t.minFps, t.goodFps) * 30;
  const validScore =
    ratio(input.validFrameRatio, t.minValidRatio, t.goodValidRatio) * 40;
  const visibilityScore =
    ratio(input.avgVisibility, t.minVisibility, t.goodVisibility) * 30;
  const lostPenalty = Math.min(
    t.maxTrackingLostPenalty,
    input.trackingLostCount * t.trackingLostPenalty,
  );

  const score = fpsScore + validScore + visibilityScore - lostPenalty;
  return Math.round(Math.min(100, Math.max(0, score)));
}

export function qualityLevelFromScore(score: number): QualityLevel {
  if (score >= QUALITY_LEVEL_BOUNDS.high) return "high";
  if (score >= QUALITY_LEVEL_BOUNDS.medium) return "medium";
  if (score >= QUALITY_LEVEL_BOUNDS.low) return "low";
  return "retry";
}

export const QUALITY_LEVEL_LABEL: Record<QualityLevel, string> = {
  high: "높음",
  medium: "보통",
  low: "낮음",
  retry: "재측정 권장",
};
