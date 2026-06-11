"use client";

import GoogleLoginButton from "./GoogleLoginButton";

/** 결과 리포트 등에서 게스트에게 기록 저장 로그인을 유도하는 카드 */
export default function LoginPromptCard() {
  return (
    <div className="rounded-2xl bg-card border border-primary-light p-5 flex flex-col gap-3">
      <p className="text-base font-bold text-ink">
        다른 기기에서도 보려면 Google로 연결해 주세요.
      </p>
      <p className="text-sm text-sub leading-relaxed">
        지금 이 기기에는 기록이 저장되어 있어요. Google로 연결하면 여러
        기기에서 같은 기록을 확인할 수 있어요.
      </p>
      <GoogleLoginButton label="Google로 연결하기" />
    </div>
  );
}
