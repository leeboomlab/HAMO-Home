import { AssessmentSummary, DailyLog } from "@/types/assessment";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  fetchAssessmentById,
  fetchAssessments,
  fetchDailyLogs,
  fetchProfileByAuthUser,
  insertAssessment,
  upsertDailyLog,
} from "@/lib/supabase/queries";
import {
  addGuestAssessment,
  getGuestAssessment,
  getGuestAssessments,
  getGuestDailyLogs,
  upsertGuestDailyLog,
} from "@/lib/storage/guestStorage";
import { calcStreak, countThisWeek, todayLocalDate } from "@/lib/utils/date";
import { getBrowserName, getDeviceType } from "@/lib/utils/device";

/**
 * 게스트(localStorage)·Supabase(익명/Google) 공통 기록 계층.
 * Supabase 우선 + localStorage 항상 미러(오프라인/fallback).
 */

async function getLoggedInContext() {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return null;
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;
    const profile = await fetchProfileByAuthUser(supabase, user.id);
    if (!profile) return null;
    return { supabase, profileId: profile.id };
  } catch {
    return null;
  }
}

function mergeAssessments(
  remote: AssessmentSummary[],
  local: AssessmentSummary[],
): AssessmentSummary[] {
  const byId = new Map<string, AssessmentSummary>();
  for (const a of remote) byId.set(a.id, a);
  for (const a of local) {
    if (!byId.has(a.id)) byId.set(a.id, a);
  }
  return [...byId.values()].sort((a, b) =>
    b.completedAt.localeCompare(a.completedAt),
  );
}

function mergeDailyLogs(remote: DailyLog[], local: DailyLog[]): DailyLog[] {
  const byDate = new Map<string, DailyLog>();
  for (const l of local) byDate.set(l.logDate, l);
  for (const l of remote) byDate.set(l.logDate, l);
  return [...byDate.values()].sort((a, b) =>
    b.logDate.localeCompare(a.logDate),
  );
}

/** 측정 완료 시 기록 저장 + 오늘 루틴 완료 처리 */
export async function saveAssessmentRecord(
  summary: AssessmentSummary,
  startedAt: string,
): Promise<void> {
  const today = todayLocalDate();
  const log: DailyLog = {
    logDate: today,
    completed: true,
    assessmentId: summary.id,
  };

  const ctx = await getLoggedInContext();
  if (ctx) {
    const inserted = await insertAssessment(ctx.supabase, ctx.profileId, summary, {
      deviceType: getDeviceType(),
      browser: getBrowserName(),
      startedAt,
    });
    if (inserted) {
      await upsertDailyLog(ctx.supabase, ctx.profileId, log);
    }
  }

  addGuestAssessment(summary);
  upsertGuestDailyLog(log);
}

export async function getAssessmentRecord(
  id: string,
): Promise<AssessmentSummary | null> {
  const local = getGuestAssessment(id);
  if (local) return local;

  const ctx = await getLoggedInContext();
  if (ctx) {
    const remote = await fetchAssessmentById(ctx.supabase, id);
    if (remote) return remote;
  }
  return null;
}

export async function listAssessmentRecords(): Promise<AssessmentSummary[]> {
  const local = getGuestAssessments();
  const ctx = await getLoggedInContext();
  if (ctx) {
    try {
      const remote = await fetchAssessments(ctx.supabase, ctx.profileId);
      if (remote.length > 0) {
        return mergeAssessments(remote, local);
      }
    } catch {
      // Supabase 실패 시 local fallback
    }
  }
  return local;
}

export interface HabitSnapshot {
  todayCompleted: boolean;
  todayAssessmentId: string | null;
  streak: number;
  weekCount: number;
  completedDates: string[];
}

export async function getHabitSnapshot(): Promise<HabitSnapshot> {
  const today = todayLocalDate();
  const localLogs = getGuestDailyLogs();

  let logs: DailyLog[] = localLogs;
  const ctx = await getLoggedInContext();
  if (ctx) {
    try {
      const remoteLogs = await fetchDailyLogs(ctx.supabase, ctx.profileId);
      if (remoteLogs.length > 0) {
        logs = mergeDailyLogs(remoteLogs, localLogs);
      }
    } catch {
      logs = localLogs;
    }
  }

  const completedDates = logs.filter((l) => l.completed).map((l) => l.logDate);
  const todayLog = logs.find((l) => l.logDate === today && l.completed);

  return {
    todayCompleted: Boolean(todayLog),
    todayAssessmentId: todayLog?.assessmentId ?? null,
    streak: calcStreak(completedDates, today),
    weekCount: countThisWeek(completedDates, today),
    completedDates,
  };
}
