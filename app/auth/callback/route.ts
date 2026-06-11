import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Google OAuth callback.
 * Supabase가 전달한 code를 세션으로 교환하고 홈으로 보낸다.
 * 온보딩 미완료 사용자는 홈에서 /onboarding으로 게이팅된다.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await getSupabaseServerClient();
    if (supabase) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        return NextResponse.redirect(`${origin}/`);
      }
    }
  }

  // 코드 없음/교환 실패 → 시작 화면으로
  return NextResponse.redirect(`${origin}/start?auth_error=1`);
}
