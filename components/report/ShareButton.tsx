"use client";

import { useState } from "react";
import { Check, Share2 } from "lucide-react";
import { AssessmentSummary } from "@/types/assessment";
import {
  buildShareText,
  createShareSnapshot,
  SHARE_MESSAGE,
} from "@/lib/share/shareSnapshot";

interface ShareButtonProps {
  assessment: AssessmentSummary;
  displayName: string;
}

/**
 * 가족 공유 버튼.
 * 1) 공유 스냅샷 생성 → 링크 포함 공유
 * 2) Web Share API 미지원 시 클립보드 복사
 * 3) 스냅샷 생성 불가 시 텍스트만 공유
 * TODO: 카카오톡 공유는 추후 확장
 */
export default function ShareButton({
  assessment,
  displayName,
}: ShareButtonProps) {
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    setBusy(true);
    try {
      const created = await createShareSnapshot(assessment, displayName);
      const text = created ? SHARE_MESSAGE : buildShareText(assessment);
      const url = created?.url;

      if (navigator.share) {
        try {
          await navigator.share({ title: "HAMO 움직임 체크", text, url });
          return;
        } catch {
          // 사용자가 공유 시트를 닫은 경우 등 → 클립보드 fallback
        }
      }

      const clipboardText = url ? `${text}\n${url}` : text;
      await navigator.clipboard.writeText(clipboardText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleShare}
      disabled={busy}
      className="flex-1 min-h-[56px] rounded-2xl bg-card border border-gray-200 text-ink text-base font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition disabled:opacity-60"
    >
      {copied ? (
        <>
          <Check size={18} className="text-success" /> 복사됨
        </>
      ) : (
        <>
          <Share2 size={18} /> 가족에게 공유하기
        </>
      )}
    </button>
  );
}
