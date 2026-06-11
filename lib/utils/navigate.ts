/** ngrok 등 원격 dev 접속 여부 (localhost가 아닌 브라우저) */
export function isRemoteDevAccess(): boolean {
  if (typeof window === "undefined") return false;
  if (process.env.NODE_ENV !== "development") return false;
  const host = window.location.hostname;
  return host !== "localhost" && host !== "127.0.0.1";
}

/**
 * 모바일 ngrok dev 환경에서는 client router 대신 전체 페이지 이동을 사용한다.
 * (라우트별 JS 청크 로딩 실패·hydration 문제 회피)
 */
export function hardNavigate(href: string): void {
  window.location.assign(href);
}
