"use client";

import Link from "next/link";
import { UserRound } from "lucide-react";
import { ensureAnonymousSession } from "@/lib/auth/anonymous";
import { createGuestProfile } from "@/lib/auth/guest";

export default function GuestStartButton() {
  const handleStart = () => {
    const profile = createGuestProfile();
    void ensureAnonymousSession();
    if (profile.onboardingCompleted) {
      window.location.href = "/";
    }
  };

  return (
    <Link
      href="/onboarding"
      onClick={handleStart}
      className="w-full min-h-[52px] flex items-center justify-center gap-2 rounded-2xl bg-primary text-white text-lg font-bold shadow-md active:scale-[0.98] transition touch-manipulation"
    >
      <UserRound size={22} />
      로그인 없이 바로 시작
    </Link>
  );
}
