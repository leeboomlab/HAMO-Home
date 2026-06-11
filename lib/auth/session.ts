import { isAnonymousUser } from "@/lib/auth/anonymous";
import { guestProfileToInfo } from "@/lib/auth/guest";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { fetchProfileByAuthUser } from "@/lib/supabase/queries";
import { getGuestProfile } from "@/lib/storage/guestStorage";
import { SessionInfo } from "@/types/auth";

/** Supabase/네트워크 지연 시 모바일에서 무한 로딩 방지 */
const SESSION_TIMEOUT_MS = 4000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error("session timeout")), ms),
    ),
  ]);
}

/**
 * 현재 세션 정보를 가져온다 (클라이언트 전용).
 * 우선순위: Supabase Auth(익명/ Google) > localStorage 게스트 > 없음
 */
export async function getSessionInfo(): Promise<SessionInfo> {
  const supabase = getSupabaseBrowserClient();
  if (supabase) {
    try {
      const {
        data: { user },
      } = await withTimeout(supabase.auth.getUser(), SESSION_TIMEOUT_MS);
      if (user) {
        const profile = await withTimeout(
          fetchProfileByAuthUser(supabase, user.id),
          SESSION_TIMEOUT_MS,
        );
        if (profile) {
          return {
            mode: isAnonymousUser(user) ? "guest" : "google",
            profile,
          };
        }
        // Auth 세션은 있으나 온보딩 미완료
        return { mode: isAnonymousUser(user) ? "guest" : "google", profile: null };
      }
    } catch {
      // 네트워크 오류·타임아웃 시 게스트 흐름으로 fallback
    }
  }

  const guest = getGuestProfile();
  if (guest) {
    return { mode: "guest", profile: guestProfileToInfo(guest) };
  }
  return { mode: "none", profile: null };
}

export async function getCurrentProfile() {
  const session = await getSessionInfo();
  return session.profile;
}
