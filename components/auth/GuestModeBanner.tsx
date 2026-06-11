"use client";

import GoogleLoginButton from "./GoogleLoginButton";

/** 홈 등에서 게스트 사용자에게 로그인 저장을 유도하는 작은 배너 */
export default function GuestModeBanner() {
  return (
    <div className="rounded-2xl bg-primary-light px-4 py-3 flex flex-col gap-2">
      <p className="text-sm text-primary-dark leading-relaxed">
        게스트 모드로 이용 중이에요. Google로 연결하면 다른 기기에서도 기록을
        볼 수 있어요.
      </p>
      <GoogleLoginButton label="Google로 연결하기" />
    </div>
  );
}
