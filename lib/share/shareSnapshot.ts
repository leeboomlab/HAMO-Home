import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { AssessmentSummary } from "@/types/assessment";

/**
 * 가족 공유용 요약 스냅샷.
 * 게스트 기록은 localStorage에만 있어 링크 수신자가 볼 수 없으므로,
 * 공유 시점에 "요약 스냅샷"만 서버(share_snapshots)에 저장하고
 * /share/[shareToken] 으로 조회한다. (게스트·로그인 공통 경로)
 * 개인정보 최소화: 횟수/구간/요약 문구/표시 이름만 저장한다.
 */

function generateShareToken(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export interface CreatedShare {
  shareToken: string;
  url: string;
}

/** @returns 생성 실패(Supabase 미설정/네트워크 오류) 시 null */
export async function createShareSnapshot(
  assessment: AssessmentSummary,
  displayName: string,
): Promise<CreatedShare | null> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return null;

  const shareToken = generateShareToken();
  const { error } = await supabase.from("share_snapshots").insert({
    share_token: shareToken,
    rep_count: assessment.result.repCount,
    result_level: assessment.result.resultLevel,
    quality_level: assessment.result.qualityLevel,
    result_summary: assessment.result.resultSummary,
    display_name: displayName || "부모님",
    measured_at: assessment.completedAt,
  });
  if (error) return null;

  return {
    shareToken,
    url: `${window.location.origin}/share/${shareToken}`,
  };
}

export const SHARE_MESSAGE =
  "HAMO로 오늘의 움직임 체크를 완료했어요. 가족과 함께 확인해보세요.";

/** 공유 텍스트 (링크 생성이 불가한 경우 텍스트만 공유) */
export function buildShareText(assessment: AssessmentSummary): string {
  return `${SHARE_MESSAGE}\n${assessment.result.resultSummary}`;
}
