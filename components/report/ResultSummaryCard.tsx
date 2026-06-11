import { Armchair } from "lucide-react";
import { AssessmentSummary } from "@/types/assessment";
import { REP_BOUNDS } from "@/lib/scoring/resultLevel";

interface ResultSummaryCardProps {
  assessment: AssessmentSummary;
}

export default function ResultSummaryCard({
  assessment,
}: ResultSummaryCardProps) {
  const { repCount, durationSec } = assessment.result;
  return (
    <div className="rounded-3xl bg-card border border-gray-100 shadow-sm p-5">
      <span className="inline-block rounded-full bg-primary-light text-primary-dark text-sm font-bold px-3 py-1">
        오늘의 수행 결과
      </span>
      <div className="mt-3 flex items-center justify-between">
        <p className="text-[28px] leading-snug font-black text-ink">
          {durationSec}초 동안{" "}
          <span className="text-primary text-[32px]">{repCount}회</span>{" "}
          수행했어요
        </p>
        <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center shrink-0">
          <Armchair className="text-white" size={30} />
        </div>
      </div>
      <p className="mt-1 text-sm text-sub">
        목표 {durationSec}초 · {REP_BOUNDS.normal}회 이상
      </p>
    </div>
  );
}
