"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  BarChart3,
  CalendarCheck2,
  CheckCircle2,
  History,
  Info,
  RefreshCcw,
  ShieldCheck,
  Smile,
  Target,
} from "lucide-react";
import MobileShell from "@/components/layout/MobileShell";
import Header from "@/components/layout/Header";
import ResultSummaryCard from "@/components/report/ResultSummaryCard";
import MetricCard from "@/components/report/MetricCard";
import HamoCommentCard from "@/components/report/HamoCommentCard";
import RecommendedExerciseCard from "@/components/report/RecommendedExerciseCard";
import ShareButton from "@/components/report/ShareButton";
import LoginPromptCard from "@/components/auth/LoginPromptCard";
import QualityBadge from "@/components/assessment/QualityBadge";
import { getAssessmentRecord } from "@/lib/data/records";
import { getSessionInfo } from "@/lib/auth/session";
import {
  buildReportCopy,
  reliabilityLabel,
  stabilityLabel,
} from "@/lib/scoring/reportCopy";
import { AssessmentSummary } from "@/types/assessment";
import { SessionInfo } from "@/types/auth";

export default function ReportPage() {
  const params = useParams<{ assessmentId: string }>();
  const [assessment, setAssessment] = useState<AssessmentSummary | null>(null);
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [record, s] = await Promise.all([
        getAssessmentRecord(params.assessmentId),
        getSessionInfo(),
      ]);
      if (cancelled) return;
      if (!record) {
        setNotFound(true);
        return;
      }
      setAssessment(record);
      setSession(s);
    })();
    return () => {
      cancelled = true;
    };
  }, [params.assessmentId]);

  if (notFound) {
    return (
      <MobileShell className="px-5 items-center justify-center gap-4">
        <p className="text-lg font-bold text-ink">결과를 찾을 수 없어요</p>
        <p className="text-sm text-sub text-center leading-relaxed">
          기록이 삭제되었거나 다른 기기에서 측정한 결과일 수 있어요.
        </p>
        <Link
          href="/"
          className="min-h-[52px] px-8 rounded-2xl bg-primary text-white text-base font-bold flex items-center justify-center"
        >
          홈으로 가기
        </Link>
      </MobileShell>
    );
  }

  if (!assessment) {
    return (
      <MobileShell className="items-center justify-center">
        <p className="text-sub text-base">결과를 불러오는 중...</p>
      </MobileShell>
    );
  }

  const copy = buildReportCopy(assessment.result);
  const retry = assessment.result.resultLevel === "retry";
  const stability = stabilityLabel(assessment.result.stabilityScore);
  const reliability = reliabilityLabel(assessment.result.qualityScore);
  const isGuest = session?.profile?.isGuest ?? true;
  const displayName = session?.profile?.displayName || "부모님";

  return (
    <MobileShell withBottomNav className="px-5 pb-8">
      <Header
        right={
          <Link
            href="/history"
            className="flex items-center gap-1 text-sm text-sub"
          >
            <History size={16} /> 기록 히스토리
          </Link>
        }
      />

      <p className="text-base text-sub flex items-center gap-1.5">
        <Smile size={18} className="text-primary" /> 오늘도 수고하셨어요!
      </p>
      <h1 className="mt-1 text-2xl font-black text-ink">
        오늘의 움직임 상태:{" "}
        <span className={retry ? "text-warning" : "text-primary"}>
          {copy.levelLabel}
        </span>
      </h1>
      <p className="mt-1 text-sm text-sub">
        꾸준한 실천이 건강한 변화를 만듭니다.
      </p>

      <div className="mt-5 flex flex-col gap-3">
        {/* 측정 품질 낮으면 재측정 안내를 정량 결과보다 우선 표시 */}
        {retry ? (
          <div className="rounded-3xl bg-card border border-warning/40 p-5 flex flex-col gap-3">
            <QualityBadge level={assessment.result.qualityLevel} />
            <p className="text-base text-ink leading-relaxed">
              {assessment.result.resultSummary}
            </p>
            <Link
              href="/assessment/sit-to-stand"
              className="w-full min-h-[52px] rounded-2xl bg-primary text-white text-base font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition"
            >
              <RefreshCcw size={18} /> 다시 측정하기
            </Link>
          </div>
        ) : (
          <>
            <ResultSummaryCard assessment={assessment} />

            <div className="flex gap-3">
              <MetricCard
                icon={ShieldCheck}
                title="움직임 안정성"
                value={stability.label}
                description={stability.description}
              />
              <MetricCard
                icon={Target}
                title="측정 신뢰도"
                value={reliability.label}
                description={reliability.description}
              />
            </div>
          </>
        )}

        <HamoCommentCard comment={copy.hamoComment} />

        <section>
          <h2 className="text-base font-bold text-ink mb-2">추천 운동</h2>
          <div className="flex flex-col gap-2">
            {copy.recommendations.map((ex) => (
              <RecommendedExerciseCard key={ex.id} exercise={ex} />
            ))}
          </div>
        </section>

        {!retry && (
          <div className="rounded-2xl bg-success/10 px-4 py-3 flex items-center gap-2">
            <CheckCircle2 className="text-success shrink-0" size={20} />
            <p className="text-sm font-bold text-ink">
              오늘 루틴을 완료했어요!
            </p>
          </div>
        )}

        <div className="flex gap-2">
          <ShareButton assessment={assessment} displayName={displayName} />
          <Link
            href="/history"
            className="flex-1 min-h-[56px] rounded-2xl bg-card border border-gray-200 text-ink text-base font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition"
          >
            <BarChart3 size={18} /> 내 기록 보기
          </Link>
        </div>

        <Link
          href="/"
          className="w-full min-h-[56px] rounded-2xl bg-primary-dark text-white text-base font-bold flex items-center justify-center gap-2 shadow-md active:scale-[0.98] transition"
        >
          <CalendarCheck2 size={18} /> 내일도 하기
        </Link>

        {isGuest && <LoginPromptCard />}

        <p className="text-xs text-sub text-center leading-relaxed flex items-start gap-1 justify-center">
          <Info size={13} className="shrink-0 mt-0.5" />
          본 서비스는 의료 진단이 아닌 건강관리 참고용 자가 체크 서비스입니다.
        </p>
      </div>
    </MobileShell>
  );
}
