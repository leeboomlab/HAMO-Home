import type { SupabaseClient } from "@supabase/supabase-js";
import {
  AssessmentSummary,
  CameraFacing,
  DailyLog,
  QualityLevel,
  ResultLevel,
} from "@/types/assessment";
import {
  ConcernFlags,
  ConsentFlags,
  EMPTY_CONCERNS,
  Gender,
  ProfileInfo,
  ReminderPreference,
  UserType,
} from "@/types/profile";

// ---------------- profiles ----------------

interface ProfileRow {
  id: string;
  auth_user_id: string | null;
  display_name: string;
  user_type: string;
  birth_year: number | null;
  age_range: string | null;
  gender: string | null;
  is_guest: boolean;
}

interface ConcernRow {
  concern_fall: boolean;
  concern_strength: boolean;
  concern_balance: boolean;
  concern_walking: boolean;
  concern_exercise: boolean;
  concern_parent_status: boolean;
}

function concernsFromRow(row: ConcernRow | null): ConcernFlags {
  if (!row) return { ...EMPTY_CONCERNS };
  return {
    fall: row.concern_fall,
    strength: row.concern_strength,
    balance: row.concern_balance,
    walking: row.concern_walking,
    exercise: row.concern_exercise,
    parentStatus: row.concern_parent_status,
  };
}

export async function fetchProfileByAuthUser(
  supabase: SupabaseClient,
  authUserId: string,
): Promise<ProfileInfo | null> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("auth_user_id", authUserId)
    .maybeSingle<ProfileRow>();
  if (!profile) return null;

  const { data: concerns } = await supabase
    .from("user_concerns")
    .select("*")
    .eq("profile_id", profile.id)
    .maybeSingle<ConcernRow>();

  return {
    id: profile.id,
    displayName: profile.display_name,
    userType: profile.user_type as UserType,
    birthYear: profile.birth_year,
    ageRange: profile.age_range,
    gender: profile.gender as Gender | null,
    isGuest: profile.is_guest,
    concerns: concernsFromRow(concerns),
    onboardingCompleted: true, // profile row 존재 = 온보딩 완료
  };
}

export interface OnboardingInput {
  displayName: string;
  userType: UserType;
  birthYear: number | null;
  ageRange: string | null;
  gender: Gender | null;
  concerns: ConcernFlags;
  consents: ConsentFlags;
}

/** 온보딩 완료 시 profiles + user_concerns + consents 저장 */
export async function createProfileForUser(
  supabase: SupabaseClient,
  authUserId: string,
  input: OnboardingInput,
): Promise<string | null> {
  const { data: profile, error } = await supabase
    .from("profiles")
    .insert({
      auth_user_id: authUserId,
      display_name: input.displayName,
      user_type: input.userType,
      birth_year: input.birthYear,
      age_range: input.ageRange,
      gender: input.gender,
      is_guest: false,
    })
    .select("id")
    .single<{ id: string }>();
  if (error || !profile) return null;

  await supabase.from("user_concerns").insert({
    profile_id: profile.id,
    concern_fall: input.concerns.fall,
    concern_strength: input.concerns.strength,
    concern_balance: input.concerns.balance,
    concern_walking: input.concerns.walking,
    concern_exercise: input.concerns.exercise,
    concern_parent_status: input.concerns.parentStatus,
  });

  await supabase.from("consents").insert({
    profile_id: profile.id,
    privacy_required: input.consents.privacyRequired,
    health_notice_required: input.consents.healthNoticeRequired,
    marketing_optional: input.consents.notificationOptional,
  });

  return profile.id;
}

/** 익명 Auth 게스트 온보딩 완료 시 profiles + user_concerns + consents 저장 */
export async function createProfileForGuest(
  supabase: SupabaseClient,
  authUserId: string,
  guestId: string,
  input: OnboardingInput,
): Promise<string | null> {
  const { data: profile, error } = await supabase
    .from("profiles")
    .insert({
      auth_user_id: authUserId,
      display_name: input.displayName,
      user_type: input.userType,
      birth_year: input.birthYear,
      age_range: input.ageRange,
      gender: input.gender,
      is_guest: true,
      guest_id: guestId,
    })
    .select("id")
    .single<{ id: string }>();
  if (error || !profile) return null;

  await supabase.from("user_concerns").insert({
    profile_id: profile.id,
    concern_fall: input.concerns.fall,
    concern_strength: input.concerns.strength,
    concern_balance: input.concerns.balance,
    concern_walking: input.concerns.walking,
    concern_exercise: input.concerns.exercise,
    concern_parent_status: input.concerns.parentStatus,
  });

  await supabase.from("consents").insert({
    profile_id: profile.id,
    privacy_required: input.consents.privacyRequired,
    health_notice_required: input.consents.healthNoticeRequired,
    marketing_optional: input.consents.notificationOptional,
  });

  return profile.id;
}

export async function updateProfileGuestStatus(
  supabase: SupabaseClient,
  profileId: string,
  isGuest: boolean,
): Promise<void> {
  await supabase
    .from("profiles")
    .update({ is_guest: isGuest })
    .eq("id", profileId);
}

// ---------------- assessments ----------------

interface AssessmentResultRow {
  rep_count: number;
  avg_rep_time_sec: number | null;
  valid_frame_ratio: number;
  avg_fps: number;
  tracking_lost_count: number;
  quality_score: number;
  quality_level: string;
  result_level: string;
  stability_score: number | null;
  result_summary: string;
}

interface AssessmentRow {
  id: string;
  assessment_type: string;
  completed_at: string;
  camera_facing: string;
  duration_sec: number;
  assessment_results: AssessmentResultRow[];
}

function rowToSummary(row: AssessmentRow): AssessmentSummary | null {
  const r = row.assessment_results?.[0];
  if (!r) return null;
  return {
    id: row.id,
    assessmentType: "sit_to_stand_30s",
    completedAt: row.completed_at,
    cameraFacing: row.camera_facing as CameraFacing,
    result: {
      durationSec: row.duration_sec,
      repCount: r.rep_count,
      avgRepTimeSec: r.avg_rep_time_sec,
      validFrameRatio: Number(r.valid_frame_ratio),
      avgFps: Number(r.avg_fps),
      trackingLostCount: r.tracking_lost_count,
      qualityScore: r.quality_score,
      qualityLevel: r.quality_level as QualityLevel,
      resultLevel: r.result_level as ResultLevel,
      stabilityScore: r.stability_score,
      resultSummary: r.result_summary,
    },
  };
}

export async function insertAssessment(
  supabase: SupabaseClient,
  profileId: string,
  summary: AssessmentSummary,
  meta: { deviceType: string; browser: string; startedAt: string },
): Promise<string | null> {
  const { data: assessment, error } = await supabase
    .from("assessments")
    .insert({
      id: summary.id,
      profile_id: profileId,
      assessment_type: summary.assessmentType,
      status: "completed",
      started_at: meta.startedAt,
      completed_at: summary.completedAt,
      duration_sec: summary.result.durationSec,
      device_type: meta.deviceType,
      browser: meta.browser,
      camera_facing: summary.cameraFacing,
      analyzer_version: "1.0.0",
    })
    .select("id")
    .single<{ id: string }>();
  if (error || !assessment) return null;

  const r = summary.result;
  await supabase.from("assessment_results").insert({
    assessment_id: assessment.id,
    rep_count: r.repCount,
    avg_rep_time_sec: r.avgRepTimeSec,
    valid_frame_ratio: r.validFrameRatio,
    avg_fps: r.avgFps,
    tracking_lost_count: r.trackingLostCount,
    quality_score: r.qualityScore,
    quality_level: r.qualityLevel,
    result_level: r.resultLevel,
    stability_score: r.stabilityScore,
    result_summary: r.resultSummary,
    recommendation_json: null,
  });

  return assessment.id;
}

const ASSESSMENT_SELECT =
  "id, assessment_type, completed_at, camera_facing, duration_sec, assessment_results(*)";

export async function fetchAssessmentById(
  supabase: SupabaseClient,
  assessmentId: string,
): Promise<AssessmentSummary | null> {
  const { data } = await supabase
    .from("assessments")
    .select(ASSESSMENT_SELECT)
    .eq("id", assessmentId)
    .maybeSingle<AssessmentRow>();
  return data ? rowToSummary(data) : null;
}

export async function fetchAssessments(
  supabase: SupabaseClient,
  profileId: string,
  limit = 50,
): Promise<AssessmentSummary[]> {
  const { data } = await supabase
    .from("assessments")
    .select(ASSESSMENT_SELECT)
    .eq("profile_id", profileId)
    .eq("status", "completed")
    .order("completed_at", { ascending: false })
    .limit(limit)
    .returns<AssessmentRow[]>();
  return (data ?? [])
    .map(rowToSummary)
    .filter((s): s is AssessmentSummary => s !== null);
}

// ---------------- daily logs ----------------

export async function upsertDailyLog(
  supabase: SupabaseClient,
  profileId: string,
  log: DailyLog,
): Promise<void> {
  await supabase.from("daily_logs").upsert(
    {
      profile_id: profileId,
      log_date: log.logDate,
      completed: log.completed,
      assessment_id: log.assessmentId,
    },
    { onConflict: "profile_id,log_date" },
  );
}

export async function fetchDailyLogs(
  supabase: SupabaseClient,
  profileId: string,
): Promise<DailyLog[]> {
  const { data } = await supabase
    .from("daily_logs")
    .select("log_date, completed, assessment_id")
    .eq("profile_id", profileId)
    .order("log_date", { ascending: false })
    .limit(366)
    .returns<
      { log_date: string; completed: boolean; assessment_id: string | null }[]
    >();
  return (data ?? []).map((row) => ({
    logDate: row.log_date,
    completed: row.completed,
    assessmentId: row.assessment_id,
  }));
}

// ---------------- reminder ----------------

export async function saveReminderPreference(
  supabase: SupabaseClient,
  profileId: string,
  pref: ReminderPreference,
): Promise<void> {
  await supabase.from("reminder_preferences").upsert(
    {
      profile_id: profileId,
      preferred_time: pref.preferredTime,
      enabled: pref.enabled,
    },
    { onConflict: "profile_id" },
  );
}

export async function fetchReminderPreference(
  supabase: SupabaseClient,
  profileId: string,
): Promise<ReminderPreference | null> {
  const { data } = await supabase
    .from("reminder_preferences")
    .select("preferred_time, enabled")
    .eq("profile_id", profileId)
    .maybeSingle<{ preferred_time: string | null; enabled: boolean }>();
  if (!data) return null;
  return { preferredTime: data.preferred_time, enabled: data.enabled };
}
