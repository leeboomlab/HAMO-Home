import type { User } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

/**
 * 게스트용 Supabase Anonymous Auth 세션을 보장한다.
 * 이미 Google/익명 세션이 있으면 그대로 반환한다.
 */
export async function ensureAnonymousSession(): Promise<User | null> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return null;

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) return user;

    const { data, error } = await supabase.auth.signInAnonymously();
    if (error || !data.user) return null;
    return data.user;
  } catch {
    return null;
  }
}

export function isAnonymousUser(user: User): boolean {
  return user.is_anonymous === true;
}
