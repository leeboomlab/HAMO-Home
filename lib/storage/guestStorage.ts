import { AssessmentSummary, DailyLog } from "@/types/assessment";
import {
  ConcernFlags,
  ConsentFlags,
  Gender,
  ReminderPreference,
  UserType,
} from "@/types/profile";
import { isBrowser } from "@/lib/utils/device";

export const STORAGE_KEYS = {
  guestId: "hamo_guest_id",
  guestProfile: "hamo_guest_profile",
  guestConsents: "hamo_guest_consents",
  guestAssessments: "hamo_guest_assessments",
  guestDailyLogs: "hamo_guest_daily_logs",
  guestReminder: "hamo_guest_reminder",
  guestMigratedAt: "hamo_guest_migrated_at",
} as const;

export interface GuestProfile {
  id: string;
  displayName: string;
  userType: UserType;
  birthYear: number | null;
  ageRange: string | null;
  gender: Gender | null;
  concerns: ConcernFlags;
  onboardingCompleted: boolean;
  createdAt: string;
}

function readJson<T>(key: string): T | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    // 손상된 데이터는 무시 (브라우저 저장소 특성상 방어적으로 처리)
    return null;
  }
}

function writeJson(key: string, value: unknown): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // 저장 공간 부족 등은 조용히 무시 (게스트 모드 한계로 안내됨)
  }
}

// ---------- guest id ----------

export function getOrCreateGuestId(): string {
  if (!isBrowser()) return "";
  let id = window.localStorage.getItem(STORAGE_KEYS.guestId);
  if (!id) {
    id = `guest_${crypto.randomUUID()}`;
    window.localStorage.setItem(STORAGE_KEYS.guestId, id);
  }
  return id;
}

// ---------- profile ----------

export function getGuestProfile(): GuestProfile | null {
  return readJson<GuestProfile>(STORAGE_KEYS.guestProfile);
}

export function saveGuestProfile(profile: GuestProfile): void {
  writeJson(STORAGE_KEYS.guestProfile, profile);
}

// ---------- consents ----------

export function getGuestConsents(): ConsentFlags | null {
  return readJson<ConsentFlags>(STORAGE_KEYS.guestConsents);
}

export function saveGuestConsents(consents: ConsentFlags): void {
  writeJson(STORAGE_KEYS.guestConsents, consents);
}

// ---------- assessments ----------

export function getGuestAssessments(): AssessmentSummary[] {
  return readJson<AssessmentSummary[]>(STORAGE_KEYS.guestAssessments) ?? [];
}

export function getGuestAssessment(id: string): AssessmentSummary | null {
  return getGuestAssessments().find((a) => a.id === id) ?? null;
}

export function addGuestAssessment(assessment: AssessmentSummary): void {
  const list = getGuestAssessments();
  list.unshift(assessment);
  // localStorage 용량 보호: 최근 100건만 유지
  writeJson(STORAGE_KEYS.guestAssessments, list.slice(0, 100));
}

// ---------- daily logs ----------

export function getGuestDailyLogs(): DailyLog[] {
  return readJson<DailyLog[]>(STORAGE_KEYS.guestDailyLogs) ?? [];
}

export function upsertGuestDailyLog(log: DailyLog): void {
  const logs = getGuestDailyLogs().filter((l) => l.logDate !== log.logDate);
  logs.push(log);
  logs.sort((a, b) => (a.logDate < b.logDate ? 1 : -1));
  writeJson(STORAGE_KEYS.guestDailyLogs, logs.slice(0, 366));
}

// ---------- reminder ----------

export function getGuestReminder(): ReminderPreference | null {
  return readJson<ReminderPreference>(STORAGE_KEYS.guestReminder);
}

export function saveGuestReminder(pref: ReminderPreference): void {
  writeJson(STORAGE_KEYS.guestReminder, pref);
}

// ---------- migration helpers ----------

/** 게스트 데이터 전체를 한 번에 읽는다 (Supabase migration용) */
export function exportGuestData() {
  return {
    guestId: isBrowser()
      ? window.localStorage.getItem(STORAGE_KEYS.guestId)
      : null,
    profile: getGuestProfile(),
    consents: getGuestConsents(),
    assessments: getGuestAssessments(),
    dailyLogs: getGuestDailyLogs(),
    reminder: getGuestReminder(),
  };
}

export function hasGuestDataMigrated(): boolean {
  if (!isBrowser()) return false;
  return Boolean(window.localStorage.getItem(STORAGE_KEYS.guestMigratedAt));
}

export function markGuestDataMigrated(): void {
  if (!isBrowser()) return;
  window.localStorage.setItem(
    STORAGE_KEYS.guestMigratedAt,
    new Date().toISOString(),
  );
}

export function clearGuestData(): void {
  if (!isBrowser()) return;
  Object.values(STORAGE_KEYS).forEach((key) =>
    window.localStorage.removeItem(key),
  );
}
