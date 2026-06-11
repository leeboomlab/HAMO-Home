import { ResultLevel, SitStandResult } from "@/types/assessment";
import { RecommendedExercise, ReportCopy } from "@/types/report";
import { RESULT_LEVEL_LABEL } from "./resultLevel";

/**
 * 결과 리포트 문구 생성 (rule-based).
 * 의료 진단처럼 표현하지 않고, 본인 기록 변화 중심의 참고형 문구만 사용한다.
 */

const EXERCISES: Record<string, RecommendedExercise> = {
  chairSitStand: {
    id: "chair-sit-stand",
    title: "의자 앉았다 일어나기",
    description: "의자에 앉았다 천천히 일어나기를 10회 반복해 보세요.",
  },
  wallBalance: {
    id: "wall-balance",
    title: "벽 잡고 균형 서기",
    description: "벽을 잡고 한 발로 10초씩 번갈아 서 보세요.",
  },
  lightWalk: {
    id: "light-walk",
    title: "가벼운 제자리 걷기",
    description: "제자리에서 1~2분 가볍게 걸어 보세요.",
  },
  retryGuide: {
    id: "retry-guide",
    title: "카메라 위치 조정 후 재측정",
    description:
      "밝은 곳에서 전신이 보이도록 카메라를 조정하고 다시 측정해 주세요.",
  },
};

const RECOMMENDATIONS: Record<ResultLevel, RecommendedExercise[]> = {
  good: [EXERCISES.lightWalk, EXERCISES.chairSitStand],
  normal: [EXERCISES.chairSitStand, EXERCISES.wallBalance],
  caution: [EXERCISES.wallBalance, EXERCISES.chairSitStand],
  retry: [EXERCISES.retryGuide],
};

function summaryFor(result: SitStandResult): string {
  if (result.resultLevel === "retry") {
    return "이번 측정은 카메라 인식률이 낮아 정확한 결과를 제공하기 어렵습니다. 밝은 곳에서 전신이 보이도록 다시 측정해 주세요.";
  }

  const base = `30초 동안 ${result.repCount}회 수행했어요.`;
  const stability = result.stabilityScore;
  if (stability !== null) {
    if (stability >= 70) return `${base} 일어서는 동작이 안정적이었어요.`;
    if (stability >= 40)
      return `${base} 일어서는 속도는 무난했지만 약간의 흔들림이 보였어요.`;
    return `${base} 일어설 때 흔들림이 다소 컸어요. 천천히, 안전하게 진행해 주세요.`;
  }
  return base;
}

function hamoCommentFor(level: ResultLevel): string {
  switch (level) {
    case "good":
      return "움직임이 안정적으로 유지되고 있어요! 지금처럼 꾸준히 실천하면 더 좋아질 거예요.";
    case "normal":
      return "꾸준한 실천이 건강한 변화를 만듭니다. 오늘은 하체 근력과 균형 운동을 함께 해보세요.";
    case "caution":
      return "무리하지 않는 것이 가장 중요해요. 벽을 잡고 하는 균형 운동부터 천천히 시작해 보세요.";
    case "retry":
      return "측정 환경만 조금 바꾸면 정확한 결과를 받을 수 있어요. 밝은 곳에서 다시 한 번 해보세요.";
  }
}

export function buildReportCopy(result: SitStandResult): ReportCopy {
  return {
    levelLabel: RESULT_LEVEL_LABEL[result.resultLevel],
    summary: summaryFor(result),
    hamoComment: hamoCommentFor(result.resultLevel),
    recommendations: RECOMMENDATIONS[result.resultLevel],
  };
}

/** 움직임 안정성 표시용 라벨 */
export function stabilityLabel(score: number | null): {
  label: string;
  description: string;
} {
  if (score === null)
    return { label: "-", description: "데이터가 부족했어요." };
  if (score >= 70)
    return { label: "좋음", description: "흔들림이 거의 없었어요." };
  if (score >= 40)
    return { label: "보통", description: "흔들림이 크지 않았어요." };
  return { label: "주의", description: "흔들림이 다소 보였어요." };
}

/** 측정 신뢰도 표시용 라벨 */
export function reliabilityLabel(qualityScore: number): {
  label: string;
  description: string;
} {
  if (qualityScore >= 80)
    return { label: "좋음", description: "정확한 측정이었어요." };
  if (qualityScore >= 60)
    return { label: "보통", description: "대체로 잘 측정됐어요." };
  return { label: "낮음", description: "참고용으로만 봐주세요." };
}
