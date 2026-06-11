export function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function getDeviceType(): string {
  if (!isBrowser()) return "unknown";
  const ua = navigator.userAgent;
  if (/iPad|Tablet/i.test(ua)) return "tablet";
  if (/Mobi|iPhone|Android/i.test(ua)) return "mobile";
  return "desktop";
}

export function getBrowserName(): string {
  if (!isBrowser()) return "unknown";
  const ua = navigator.userAgent;
  if (/CriOS/i.test(ua)) return "chrome_ios";
  if (/Chrome/i.test(ua)) return "chrome";
  if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) return "safari";
  if (/Firefox/i.test(ua)) return "firefox";
  if (/SamsungBrowser/i.test(ua)) return "samsung";
  return "other";
}

export function isIOS(): boolean {
  if (!isBrowser()) return false;
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}
