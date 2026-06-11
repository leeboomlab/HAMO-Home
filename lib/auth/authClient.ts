import { clearGuestData } from "@/lib/storage/guestStorage";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

/**
 * Google OAuth 로그인 시작.
 * 익명 게스트 세션이 있으면 linkIdentity로 계정을 연결한다.
 * Supabase 미설정 시 false 반환 → UI에서 안내 처리.
 */
export async function signInWithGoogle(): Promise<boolean> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return false;

  const redirectTo = `${window.location.origin}/auth/callback`;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user?.is_anonymous) {
    const { error } = await supabase.auth.linkIdentity({
      provider: "google",
      options: { redirectTo },
    });
    return !error;
  }

  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo },
  });
  return !error;
}

export async function signOut(): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return;
  await supabase.auth.signOut();
}

/** 게스트 모드 종료: localStorage 초기화 + 익명 Auth 세션 종료 */
export async function signOutGuest(): Promise<void> {
  clearGuestData();
  const supabase = getSupabaseBrowserClient();
  if (supabase) await supabase.auth.signOut();
}
