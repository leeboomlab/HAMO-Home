import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { AssessmentSummary, ResultLevel } from "@/types/assessment";
import { RESULT_LEVEL_LABEL } from "@/lib/scoring/resultLevel";
import { formatKoreanShortDate } from "@/lib/utils/date";

const LEVEL_STYLE: Record<ResultLevel, string> = {
  good: "bg-success/10 text-success",
  normal: "bg-primary-light text-primary-dark",
  caution: "bg-warning/10 text-warning",
  retry: "bg-danger/10 text-danger",
};

interface HistoryListProps {
  assessments: AssessmentSummary[];
}

export default function HistoryList({ assessments }: HistoryListProps) {
  if (assessments.length === 0) {
    return (
      <div className="rounded-2xl bg-card border border-gray-100 p-6 text-center">
        <p className="text-base text-sub">아직 측정 기록이 없어요.</p>
        <Link
          href="/daily"
          className="mt-3 inline-flex min-h-[48px] px-6 rounded-2xl bg-primary text-white text-base font-bold items-center justify-center"
        >
          첫 측정 시작하기
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-card border border-gray-100 divide-y divide-gray-100">
      {assessments.map((a) => {
        const retry = a.result.resultLevel === "retry";
        return (
          <Link
            key={a.id}
            href={`/report/${a.id}`}
            className="flex items-center gap-3 px-4 py-3.5 active:bg-gray-50 transition"
          >
            <span className="text-base font-bold text-ink w-20 shrink-0">
              {formatKoreanShortDate(a.completedAt)}
            </span>
            <span className="text-base text-ink flex-1">
              {retry ? "-" : `${a.result.repCount}회`}
            </span>
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-bold ${LEVEL_STYLE[a.result.resultLevel]}`}
            >
              {RESULT_LEVEL_LABEL[a.result.resultLevel]}
            </span>
            <ChevronRight size={18} className="text-gray-300" />
          </Link>
        );
      })}
    </div>
  );
}
