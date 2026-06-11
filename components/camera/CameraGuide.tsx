import { Info } from "lucide-react";

export type RecognitionStatus =
  | "loading-model"
  | "detecting"
  | "good"
  | "too-close"
  | "not-full-body"
  | "too-dark";

const STATUS_LABEL: Record<RecognitionStatus, string> = {
  "loading-model": "분석 모델 준비 중",
  detecting: "전신 인식 중",
  good: "인식 양호",
  "too-close": "조금 더 뒤로 가주세요",
  "not-full-body": "전신이 화면에 보이게 해주세요",
  "too-dark": "조명이 어두워요",
};

/** 프리뷰 위에 표시하는 가이드 프레임 + 안내 문구 */
export default function CameraGuide() {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* guide frame: 전신이 들어와야 하는 영역 */}
      <div className="absolute inset-x-[12%] inset-y-[5%] border-2 border-dashed border-white/60 rounded-2xl" />

      <div className="absolute bottom-3 inset-x-3 rounded-xl bg-black/60 backdrop-blur-sm px-3 py-2.5 flex items-start gap-2">
        <Info className="text-white/80 shrink-0 mt-0.5" size={16} />
        <p className="text-sm text-white leading-relaxed">
          전신이 화면에 보이도록 2~3m 떨어져 주세요.
          <br />
          밝은 곳에서 진행해 주세요.
        </p>
      </div>
    </div>
  );
}

interface RecognitionBadgeProps {
  status: RecognitionStatus;
}

/** 인식 상태 뱃지 (good이면 초록, 그 외 안내) */
export function RecognitionBadge({ status }: RecognitionBadgeProps) {
  const good = status === "good";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-bold ${
        good ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
      }`}
    >
      <span
        className={`w-2 h-2 rounded-full ${good ? "bg-success" : "bg-warning"}`}
      />
      {STATUS_LABEL[status]}
    </span>
  );
}
