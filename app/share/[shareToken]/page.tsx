import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { Armchair, Heart, Info, ShieldCheck } from "lucide-react";
import HamoLogo from "@/components/brand/HamoLogo";
import MobileShell from "@/components/layout/MobileShell";
import { RESULT_LEVEL_LABEL } from "@/lib/scoring/resultLevel";
import { formatKoreanShortDate } from "@/lib/utils/date";
import { ResultLevel } from "@/types/assessment";

interface SnapshotRow {
  share_token: string;
  rep_count: number;
  result_level: string;
  quality_level: string;
  result_summary: string;
  display_name: string;
  measured_at: string | null;
}

/** 토큰 기반 RPC로만 조회 (개인정보 최소화된 스냅샷) */
async function fetchSnapshot(token: string): Promise<SnapshotRow | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  const supabase = createClient(url, key);
  const { data } = await supabase
    .rpc("get_share_snapshot", { p_token: token })
    .maybeSingle<SnapshotRow>();
  return data ?? null;
}

export default async function SharePage({
  params,
}: {
  params: Promise<{ shareToken: string }>;
}) {
  const { shareToken } = await params;
  const snapshot = await fetchSnapshot(shareToken);

  if (!snapshot) {
    return (
      <MobileShell className="px-5 items-center justify-center gap-4">
        <p className="text-lg font-bold text-ink">
          공유된 결과를 찾을 수 없어요
        </p>
        <p className="text-sm text-sub text-center leading-relaxed">
          링크가 만료되었거나 잘못된 주소일 수 있어요.
        </p>
        <Link
          href="/start"
          className="min-h-[52px] px-8 rounded-2xl bg-primary text-white text-base font-bold flex items-center justify-center"
        >
          HAMO 시작하기
        </Link>
      </MobileShell>
    );
  }

  const level = snapshot.result_level as ResultLevel;
  const levelLabel = RESULT_LEVEL_LABEL[level] ?? snapshot.result_level;

  return (
    <MobileShell className="px-5 pb-8">
      <div className="pt-8 pb-4 flex justify-center">
        <HamoLogo className="h-7 w-auto" />
      </div>

      <div className="rounded-2xl bg-primary-light px-4 py-3 flex items-center gap-2 justify-center">
        <Heart size={16} className="text-primary" />
        <p className="text-sm text-primary-dark font-medium text-center">
          HAMO로 오늘의 움직임 체크를 완료했어요. 가족과 함께 확인해보세요.
        </p>
      </div>

      <div className="mt-4 rounded-3xl bg-card border border-gray-100 shadow-sm p-5">
        <p className="text-sm text-sub">
          {snapshot.display_name}님의 움직임 체크
          {snapshot.measured_at &&
            ` · ${formatKoreanShortDate(snapshot.measured_at)}`}
        </p>
        <h1 className="mt-2 text-2xl font-black text-ink">
          오늘의 움직임 상태:{" "}
          <span className={level === "retry" ? "text-warning" : "text-primary"}>
            {levelLabel}
          </span>
        </h1>

        {level !== "retry" && (
          <div className="mt-4 flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center shrink-0">
              <Armchair className="text-white" size={26} />
            </div>
            <p className="text-xl font-black text-ink">
              30초 동안{" "}
              <span className="text-primary">{snapshot.rep_count}회</span>{" "}
              수행했어요
            </p>
          </div>
        )}

        <p className="mt-4 text-base text-ink leading-relaxed">
          {snapshot.result_summary}
        </p>
      </div>

      <div className="mt-4 flex flex-col gap-2">
        <div className="rounded-2xl bg-card border border-gray-100 px-4 py-3 flex items-start gap-3">
          <ShieldCheck className="text-primary shrink-0 mt-0.5" size={18} />
          <p className="text-sm text-sub leading-relaxed">
            카메라 영상은 서버에 저장되지 않고, 기기에서 분석됩니다.
          </p>
        </div>
        <div className="rounded-2xl bg-card border border-gray-100 px-4 py-3 flex items-start gap-3">
          <Info className="text-sub shrink-0 mt-0.5" size={18} />
          <p className="text-sm text-sub leading-relaxed">
            본 서비스는 의료 진단이 아닌 건강관리 참고용 자가 체크
            서비스입니다.
          </p>
        </div>
      </div>

      <div className="flex-1 min-h-6" />

      <Link
        href="/start"
        className="w-full min-h-[56px] rounded-2xl bg-primary text-white text-lg font-bold flex items-center justify-center shadow-md active:scale-[0.98] transition"
      >
        나도 3분 체크 해보기
      </Link>
    </MobileShell>
  );
}
