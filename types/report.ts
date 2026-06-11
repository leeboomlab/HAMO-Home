import { ResultLevel } from "./assessment";

export interface RecommendedExercise {
  id: string;
  title: string;
  description: string;
}

export interface ReportCopy {
  /** 예: '오늘의 움직임 상태: 보통' 의 상태 텍스트 */
  levelLabel: string;
  /** 결과 요약 한 줄 */
  summary: string;
  /** HAMO 한마디 */
  hamoComment: string;
  recommendations: RecommendedExercise[];
}

export interface ShareSnapshot {
  shareToken: string;
  repCount: number;
  resultLevel: ResultLevel;
  qualityLevel: string;
  resultSummary: string;
  displayName: string;
  measuredAt: string;
}
