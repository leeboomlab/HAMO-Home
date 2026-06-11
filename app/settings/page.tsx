"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Info, LogOut, UserRound } from "lucide-react";
import MobileShell from "@/components/layout/MobileShell";
import Header from "@/components/layout/Header";
import GoogleLoginButton from "@/components/auth/GoogleLoginButton";
import { getSessionInfo } from "@/lib/auth/session";
import { signOut, signOutGuest } from "@/lib/auth/authClient";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  fetchReminderPreference,
  saveReminderPreference,
} from "@/lib/supabase/queries";
import {
  getGuestReminder,
  saveGuestReminder,
} from "@/lib/storage/guestStorage";
import { ReminderPreference } from "@/types/profile";
import { SessionInfo } from "@/types/auth";

const TIME_OPTIONS = ["08:00", "10:00", "14:00", "19:00"];

export default function SettingsPage() {
  const router = useRouter();
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [reminder, setReminder] = useState<ReminderPreference>({
    enabled: false,
    preferredTime: null,
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const s = await getSessionInfo();
      if (cancelled) return;
      setSession(s);

      if (s.profile) {
        const supabase = getSupabaseBrowserClient();
        if (supabase) {
          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (user) {
            const pref = await fetchReminderPreference(supabase, s.profile.id);
            if (!cancelled && pref) setReminder(pref);
            return;
          }
        }
      }
      const local = getGuestReminder();
      if (!cancelled && local) setReminder(local);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const persistReminder = async (next: ReminderPreference) => {
    setReminder(next);
    if (session?.profile) {
      const supabase = getSupabaseBrowserClient();
      if (supabase) {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          await saveReminderPreference(supabase, session.profile.id, next);
          saveGuestReminder(next);
          return;
        }
      }
    }
    saveGuestReminder(next);
    // TODO: PWA push notification 연동은 추후 확장 (현재는 시간 저장만)
  };

  const handleSignOut = async () => {
    await signOut();
    router.replace("/start");
  };

  const handleGuestExit = async () => {
    const ok = window.confirm(
      "모든 기록이 삭제되고 시작 화면으로 돌아갑니다. 계속할까요?",
    );
    if (!ok) return;
    await signOutGuest();
    router.replace("/start");
  };

  const profile = session?.profile;

  return (
    <MobileShell withBottomNav className="px-5 pb-8">
      <Header />
      <h1 className="text-2xl font-black text-ink">설정</h1>

      <div className="mt-4 flex flex-col gap-3">
        {/* 프로필 */}
        <div className="rounded-2xl bg-card border border-gray-100 p-4 flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary-light flex items-center justify-center shrink-0">
            <UserRound className="text-primary" size={24} />
          </div>
          <div className="flex-1">
            <p className="text-base font-bold text-ink">
              {profile?.displayName || "사용자"}
            </p>
            <p className="text-sm text-sub">
              {session?.mode === "google"
                ? "Google 계정으로 로그인됨"
                : "게스트 모드"}
              {profile?.ageRange ? ` · ${profile.ageRange}` : ""}
            </p>
          </div>
        </div>

        {/* 게스트 → 로그인 유도 */}
        {session && session.mode !== "google" && (
          <div className="rounded-2xl bg-primary-light p-4 flex flex-col gap-2">
            <p className="text-sm text-primary-dark leading-relaxed">
              Google로 연결하면 다른 기기에서도 기록을 확인할 수 있어요.
            </p>
            <GoogleLoginButton label="Google로 연결하기" />
          </div>
        )}

        {/* 리마인더 */}
        <div className="rounded-2xl bg-card border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <p className="text-base font-bold text-ink flex items-center gap-1.5">
              <Bell size={18} className="text-primary" /> 매일 체크 알림
            </p>
            <button
              type="button"
              role="switch"
              aria-checked={reminder.enabled}
              onClick={() =>
                persistReminder({ ...reminder, enabled: !reminder.enabled })
              }
              className={`w-13 h-7 rounded-full transition relative ${
                reminder.enabled ? "bg-primary" : "bg-gray-300"
              }`}
              style={{ width: 52 }}
            >
              <span
                className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-all ${
                  reminder.enabled ? "left-[26px]" : "left-0.5"
                }`}
              />
            </button>
          </div>
          {reminder.enabled && (
            <div className="mt-3 grid grid-cols-4 gap-2">
              {TIME_OPTIONS.map((time) => (
                <button
                  key={time}
                  type="button"
                  onClick={() =>
                    persistReminder({ ...reminder, preferredTime: time })
                  }
                  className={`min-h-[44px] rounded-xl border text-sm font-bold transition ${
                    reminder.preferredTime === time
                      ? "bg-primary-light border-primary text-primary-dark"
                      : "bg-card border-gray-200 text-sub"
                  }`}
                >
                  {time}
                </button>
              ))}
            </div>
          )}
          <p className="mt-2 text-xs text-sub leading-relaxed">
            지금은 시간 저장만 지원해요. 푸시 알림은 곧 추가될 예정이에요.
          </p>
        </div>

        {/* 게스트: 처음으로 */}
        {session?.mode === "guest" && (
          <button
            type="button"
            onClick={handleGuestExit}
            className="rounded-2xl bg-card border border-gray-200 p-4 flex items-center gap-2 text-base font-bold text-danger active:scale-[0.98] transition"
          >
            <LogOut size={18} /> 처음으로 돌아가기
          </button>
        )}

        {/* Google 로그아웃 */}
        {session?.mode === "google" && (
          <button
            type="button"
            onClick={handleSignOut}
            className="rounded-2xl bg-card border border-gray-200 p-4 flex items-center gap-2 text-base font-bold text-danger active:scale-[0.98] transition"
          >
            <LogOut size={18} /> 로그아웃
          </button>
        )}

        {/* 고지 */}
        <div className="rounded-2xl bg-card border border-gray-100 p-4 flex items-start gap-3">
          <Info className="text-sub shrink-0 mt-0.5" size={18} />
          <p className="text-sm text-sub leading-relaxed">
            본 서비스는 의료 진단이 아닌 건강관리 참고용 자가 체크
            서비스입니다. 카메라 영상은 서버에 저장되지 않고, 기기에서
            분석됩니다.
          </p>
        </div>
      </div>
    </MobileShell>
  );
}
