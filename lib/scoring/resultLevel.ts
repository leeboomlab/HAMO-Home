import { QualityLevel, ResultLevel } from "@/types/assessment";

/**
 * 결과 구간 판정.
 * 정밀 진단이 아닌 구간형/참고형 표현을 위한 기준이며,
 * 측정 품질이 낮으면 정량 결과보다 재측정 안내를 우선한다.
 */

export const REP_BOUNDS = {
  good: 12,
  normal: 8,
} as const;

export function resultLevelFrom(
  repCount: number,
  qualityLevel: QualityLevel,
): ResultLevel {
  if (qualityLevel === "retry") return "retry";
  if (repCount === 0) return "retry";
  if (repCount >= REP_BOUNDS.good) return "good";
  if (repCount >= REP_BOUNDS.normal) return "normal";
  return "caution";
}

export const RESULT_LEVEL_LABEL: Record<ResultLevel, string> = {
  good: "양호",
  normal: "보통",
  caution: "주의",
  retry: "재측정 권장",
};
