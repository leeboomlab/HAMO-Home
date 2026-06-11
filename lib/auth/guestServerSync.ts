import { ensureAnonymousSession } from "@/lib/auth/anonymous";
import { migrateLocalAssessmentsToSupabase } from "@/lib/auth/migrateGuest";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  createProfileForGuest,
  fetchProfileByAuthUser,
  OnboardingInput,
  updateProfileGuestStatus,
} from "@/lib/supabase/queries";
import {
  getGuestConsents,
  getGuestProfile,
} from "@/lib/storage/guestStorage";

/** 온보딩 완료 게스트의 Supabase 프로필·기록 동기화 (1회/백그라운드) */
export async function ensureGuestServerProfile(): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return;

  const user = await ensureAnonymousSession();
  if (!user) return;

  const existing = await fetchProfileByAuthUser(supabase, user.id);
  if (existing) {
    await migrateLocalAssessmentsToSupabase(supabase, existing.id);
    return;
  }

  const local = getGuestProfile();
  if (!local?.onboardingCompleted) return;

  const consents = getGuestConsents();
  const input: OnboardingInput = {
    displayName: local.displayName,
    userType: local.userType,
    birthYear: local.birthYear,
    ageRange: local.ageRange,
    gender: local.gender,
    concerns: local.concerns,
    consents: consents ?? {
      privacyRequired: true,
      healthNoticeRequired: true,
      notificationOptional: false,
    },
  };

  const profileId = await createProfileForGuest(
    supabase,
    user.id,
    local.id,
    input,
  );
  if (profileId) {
    await migrateLocalAssessmentsToSupabase(supabase, profileId);
  }
}

/** 익명 게스트 → Google 연결 후 is_guest 해제 및 local 기록 이전 */
export async function finalizeGoogleAccountLink(): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.is_anonymous) return;

  const profile = await fetchProfileByAuthUser(supabase, user.id);
  if (!profile) return;

  if (profile.isGuest) {
    await updateProfileGuestStatus(supabase, profile.id, false);
  }
  await migrateLocalAssessmentsToSupabase(supabase, profile.id);
}
