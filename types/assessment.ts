export type SitStandState = "unknown" | "sitting" | "standing" | "transition";

export type QualityLevel = "high" | "medium" | "low" | "retry";

export type ResultLevel = "good" | "normal" | "caution" | "retry";

export type CameraFacing = "user" | "environment" | "unknown";

export interface SitStandFrame {
  timestamp: number;
  hipY: number;
  shoulderY: number;
  kneeY: number;
  visibility: number;
  state: SitStandState;
}

export interface SitStandResult {
  durationSec: number;
  repCount: number;
  avgRepTimeSec: number | null;
  validFrameRatio: number;
  avgFps: number;
  trackingLostCount: number;
  qualityScore: number;
  qualityLevel: QualityLevel;
  resultLevel: ResultLevel;
  /** 흔들림(좌우 sway) 기반 안정성 0~100, 데이터 부족 시 null */
  stabilityScore: number | null;
}

/** 게스트(localStorage)·로그인(Supabase) 공통 저장 단위 */
export interface AssessmentSummary {
  id: string;
  assessmentType: "sit_to_stand_30s";
  completedAt: string; // ISO datetime
  cameraFacing: CameraFacing;
  result: {
    durationSec: number;
    repCount: number;
    avgRepTimeSec: number | null;
    validFrameRatio: number;
    avgFps: number;
    trackingLostCount: number;
    qualityScore: number;
    qualityLevel: QualityLevel;
    resultLevel: ResultLevel;
    stabilityScore: number | null;
    resultSummary: string;
  };
}

export interface DailyLog {
  /** 기기 로컬 기준 'YYYY-MM-DD' */
  logDate: string;
  completed: boolean;
  assessmentId: string | null;
}
