/** 기기 로컬 타임존 기준 'YYYY-MM-DD' (streak/출석은 UTC가 아닌 로컬 날짜 기준) */
export function todayLocalDate(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const WEEKDAYS_KO = ["일", "월", "화", "수", "목", "금", "토"];

/** 예: '5월 20일 화요일' */
export function formatKoreanDate(d: Date = new Date()): string {
  return `${d.getMonth() + 1}월 ${d.getDate()}일 ${WEEKDAYS_KO[d.getDay()]}요일`;
}

/** 예: '6월 11일' */
export function formatKoreanShortDate(isoOrYmd: string): string {
  const d = new Date(isoOrYmd);
  if (Number.isNaN(d.getTime())) return isoOrYmd;
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}

function addDays(ymd: string, delta: number): string {
  const [y, m, d] = ymd.split("-").map(Number);
  const date = new Date(y, m - 1, d + delta);
  return todayLocalDate(date);
}

/**
 * 완료된 날짜 목록에서 연속 수행일을 계산한다.
 * 오늘 완료했으면 오늘부터, 아니면 어제부터 거꾸로 센다.
 * (daily_logs.streak_count 저장값에 의존하지 않고 매번 계산)
 */
export function calcStreak(completedDates: string[], today: string): number {
  const set = new Set(completedDates);
  let cursor = set.has(today) ? today : addDays(today, -1);
  let streak = 0;
  while (set.has(cursor)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

/** 이번 주(월요일 시작) 완료 횟수 */
export function countThisWeek(completedDates: string[], today: string): number {
  const [y, m, d] = today.split("-").map(Number);
  const t = new Date(y, m - 1, d);
  const dayOfWeek = (t.getDay() + 6) % 7; // 월=0
  const monday = addDays(today, -dayOfWeek);
  return completedDates.filter((date) => date >= monday && date <= today)
    .length;
}
