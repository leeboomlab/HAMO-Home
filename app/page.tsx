"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldCheck, UserRound } from "lucide-react";
import MobileShell from "@/components/layout/MobileShell";
import Header from "@/components/layout/Header";
import GuestModeBanner from "@/components/auth/GuestModeBanner";
import TodayRoutineCard from "@/components/home/TodayRoutineCard";
import StreakCard from "@/components/home/StreakCard";
import {
  ensureGuestServerProfile,
  finalizeGoogleAccountLink,
} from "@/lib/auth/guestServerSync";
import { getSessionInfo } from "@/lib/auth/session";
import { getHabitSnapshot, HabitSnapshot } from "@/lib/data/records";
import { formatKoreanDate } from "@/lib/utils/date";
import { SessionInfo } from "@/types/auth";

function greeting(displayName: string): string {
  const name = displayName.trim();
  const prefix = name ? `${name}님, ` : "";

  const h = new Date().getHours();
  if (h < 12) return `${prefix}좋은 아침입니다!`;
  if (h < 18) return `${prefix}좋은 오후에요!`;
  return `${prefix}편안한 저녁이에요!`;
}

export default function HomePage() {
  const router = useRouter();
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [habit, setHabit] = useState<HabitSnapshot | null>(null);
  const [showFallback, setShowFallback] = useState(false);

  useEffect(() => {
    let cancelled = false;

    // 모바일 Safari에서 router.replace가 안 먹는 경우 대비
    const fallbackTimer = setTimeout(() => {
      if (!cancelled) setShowFallback(true);
    }, 5000);

    (async () => {
      try {
        const s = await getSessionInfo();
        if (cancelled) return;

        // 온보딩 게이팅: 세션 없음 → /start, 온보딩 미완료 → /onboarding
        if (s.mode === "none") {
          router.replace("/start");
          // 클라이언트 라우팅 실패 시 강제 이동
          setTimeout(() => {
            if (!cancelled && window.location.pathname === "/") {
              window.location.replace("/start");
            }
          }, 800);
          return;
        }
        if (!s.profile || !s.profile.onboardingCompleted) {
          router.replace("/onboarding");
          setTimeout(() => {
            if (!cancelled && window.location.pathname === "/") {
              window.location.replace("/onboarding");
            }
          }, 800);
          return;
        }

        setSession(s);

        if (s.mode === "guest") {
          void ensureGuestServerProfile();
        } else if (s.mode === "google") {
          void finalizeGoogleAccountLink();
        }

        const h = await getHabitSnapshot();
        if (!cancelled) setHabit(h);
      } catch {
        if (!cancelled) window.location.replace("/start");
      }
    })();

    return () => {
      cancelled = true;
      clearTimeout(fallbackTimer);
    };
  }, [router]);

  if (!session || !session.profile) {
    return (
      <MobileShell className="items-center justify-center px-6 gap-4">
        <p className="text-sub text-base">불러오는 중...</p>
        {showFallback && (
          <>
            <p className="text-sm text-sub text-center leading-relaxed">
              연결이 느리거나 처음 방문이시면 시작 화면에서 바로 이용할 수
              있어요.
            </p>
            <Link
              href="/start"
              className="min-h-[52px] px-8 rounded-2xl bg-primary text-white text-base font-bold flex items-center justify-center"
            >
              시작 화면으로 이동
            </Link>
          </>
        )}
      </MobileShell>
    );
  }

  const profile = session.profile;

  return (
    <MobileShell withBottomNav className="px-5">
      <Header
        right={
          <span className="flex items-center gap-1.5 rounded-full bg-primary-light px-3 py-1.5 text-sm font-bold text-primary-dark">
            <UserRound size={14} />
            {profile.isGuest ? "게스트 모드" : profile.displayName}
          </span>
        }
      />

      <p className="text-sm text-sub">{formatKoreanDate()}</p>
      <h1 className="mt-1 text-2xl font-black text-ink leading-snug">
        {greeting(profile.displayName)}
        <br />
        <span className="text-primary">오늘도 건강한 하루 되세요.</span>
      </h1>

      <div className="mt-5 flex flex-col gap-3">
        <StreakCard
          streak={habit?.streak ?? 0}
          weekCount={habit?.weekCount ?? 0}
        />

        <TodayRoutineCard completed={habit?.todayCompleted ?? false} />

        {profile.isGuest && <GuestModeBanner />}

        <div className="rounded-2xl bg-card border border-gray-100 px-4 py-3 flex items-start gap-3">
          <ShieldCheck className="text-primary shrink-0 mt-0.5" size={20} />
          <p className="text-sm text-sub leading-relaxed">
            HAMO는 영상이 기기에서 분석되며, 서버에 저장되거나 전송되지
            않습니다.
          </p>
        </div>

        <div className="rounded-2xl bg-card border border-gray-100 p-5 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-ink">오늘의 완료 현황</h2>
              <p className="text-sm text-sub mt-1">
                루틴을 완료하고 건강한 습관을 이어가세요.
              </p>
            </div>
            <div className="w-16 h-16 rounded-full border-4 border-primary-light flex items-center justify-center shrink-0">
              <span className="text-lg font-black text-primary">
                {habit?.todayCompleted ? "1" : "0"}
                <span className="text-sm text-sub font-normal">/1</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </MobileShell>
  );
}
