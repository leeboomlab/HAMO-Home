"use client";

import { useEffect, useState } from "react";
import { Flame, Info } from "lucide-react";
import MobileShell from "@/components/layout/MobileShell";
import Header from "@/components/layout/Header";
import HistoryList from "@/components/history/HistoryList";
import StreakCalendar from "@/components/history/StreakCalendar";
import {
  getHabitSnapshot,
  HabitSnapshot,
  listAssessmentRecords,
} from "@/lib/data/records";
import { getSessionInfo } from "@/lib/auth/session";
import { AssessmentSummary } from "@/types/assessment";

/** 최근 측정 기반 간단 추세 문구 (사람 간 비교 없이 본인 기록 변화만) */
function trendCopy(assessments: AssessmentSummary[]): string | null {
  const counted = assessments
    .filter((a) => a.result.resultLevel !== "retry")
    .slice(0, 6);
  if (counted.length < 2) return null;
  const recent = counted[0].result.repCount;
  const prev = counted[1].result.repCount;
  if (recent > prev) return "지난번보다 횟수가 늘었어요. 좋은 흐름이에요!";
  if (recent === prev) return "꾸준히 비슷한 수준을 유지하고 있어요.";
  return "지난번보다 조금 줄었어요. 무리하지 말고 꾸준히 해보세요.";
}

export default function HistoryPage() {
  const [assessments, setAssessments] = useState<AssessmentSummary[] | null>(
    null,
  );
  const [habit, setHabit] = useState<HabitSnapshot | null>(null);
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [records, h, session] = await Promise.all([
        listAssessmentRecords(),
        getHabitSnapshot(),
        getSessionInfo(),
      ]);
      if (cancelled) return;
      setAssessments(records);
      setHabit(h);
      setIsGuest(session.mode !== "google");
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const trend = assessments ? trendCopy(assessments) : null;

  return (
    <MobileShell withBottomNav className="px-5 pb-8">
      <Header />
      <h1 className="text-2xl font-black text-ink">기록</h1>

      <div className="mt-4 flex flex-col gap-3">
        <div className="rounded-2xl bg-card border border-gray-100 p-4">
          <p className="text-base font-bold text-ink flex items-center gap-1.5 mb-3">
            <Flame size={18} className="text-warning" />
            {habit && habit.streak > 0
              ? `${habit.streak}일 연속 체크 중이에요!`
              : "이번 주 완료 현황"}
          </p>
          <StreakCalendar completedDates={habit?.completedDates ?? []} />
          {habit && habit.weekCount > 0 && (
            <p className="mt-3 text-sm text-sub">
              이번 주 {habit.weekCount}번 움직임을 확인했어요. 내일도 3분만
              함께해요.
            </p>
          )}
        </div>

        {trend && (
          <div className="rounded-2xl bg-primary-light px-4 py-3">
            <p className="text-sm text-primary-dark font-medium">{trend}</p>
          </div>
        )}

        <section>
          <h2 className="text-base font-bold text-ink mb-2">최근 측정</h2>
          {assessments === null ? (
            <p className="text-sm text-sub py-4 text-center">불러오는 중...</p>
          ) : (
            <HistoryList assessments={assessments} />
          )}
        </section>

        {isGuest && (
          <p className="text-xs text-sub text-center leading-relaxed flex items-start justify-center gap-1">
            <Info size={13} className="shrink-0 mt-0.5" />
            게스트 모드에서는 이 기기에 연결된 기록만 볼 수 있어요. Google로
            연결하면 다른 기기에서도 확인할 수 있어요.
          </p>
        )}
      </div>
    </MobileShell>
  );
}
