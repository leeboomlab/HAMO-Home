import { CameraFacing } from "@/types/assessment";

/** 모바일 성능을 위해 저해상도 권장 (640x480) */
export const PREFERRED_RESOLUTION = {
  width: { ideal: 640 },
  height: { ideal: 480 },
} as const;

export function buildConstraints(
  facing: Exclude<CameraFacing, "unknown">,
  deviceId?: string,
): MediaStreamConstraints {
  if (deviceId) {
    // iOS Safari 등에서 facingMode가 안 먹을 때 deviceId 기반 fallback
    return {
      video: { deviceId: { exact: deviceId }, ...PREFERRED_RESOLUTION },
      audio: false,
    };
  }
  return {
    video: { facingMode: { ideal: facing }, ...PREFERRED_RESOLUTION },
    audio: false,
  };
}
