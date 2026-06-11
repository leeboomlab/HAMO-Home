import type { SupabaseClient } from "@supabase/supabase-js";
import {
  exportGuestData,
  hasGuestDataMigrated,
  markGuestDataMigrated,
} from "@/lib/storage/guestStorage";
import { insertAssessment, upsertDailyLog } from "@/lib/supabase/queries";
import { getBrowserName, getDeviceType } from "@/lib/utils/device";

/**
 * 게스트 → Google 계정 데이터 이전.
 * localStorage 기록을 Supabase profile에 연결한다.
 */

/** 게스트 localStorage 기록을 로그인 사용자의 profile로 연결 */
export async function linkGuestDataToUser(
  supabase: SupabaseClient,
  profileId: string,
): Promise<{ migrated: number; failed: number }> {
  return migrateLocalAssessmentsToSupabase(supabase, profileId);
}

/** localStorage 측정 기록을 Supabase로 이전 (중복 이전 방지) */
export async function migrateLocalAssessmentsToSupabase(
  supabase: SupabaseClient,
  profileId: string,
): Promise<{ migrated: number; failed: number }> {
  if (hasGuestDataMigrated()) {
    return { migrated: 0, failed: 0 };
  }

  const data = exportGuestData();
  let migrated = 0;
  let failed = 0;

  for (const assessment of data.assessments) {
    const inserted = await insertAssessment(supabase, profileId, assessment, {
      deviceType: getDeviceType(),
      browser: getBrowserName(),
      startedAt: assessment.completedAt,
    });
    if (inserted) migrated += 1;
    else failed += 1;
  }

  for (const log of data.dailyLogs) {
    await upsertDailyLog(supabase, profileId, log);
  }

  markGuestDataMigrated();

  return { migrated, failed };
}
