import { CameraFacing } from "@/types/assessment";
import { buildConstraints } from "./cameraConstraints";

export type CameraErrorType =
  | "permission-denied"
  | "not-found"
  | "in-use"
  | "unknown";

export class CameraError extends Error {
  type: CameraErrorType;
  constructor(type: CameraErrorType, message?: string) {
    super(message ?? type);
    this.type = type;
  }
}

function toCameraError(err: unknown): CameraError {
  if (err instanceof DOMException) {
    if (err.name === "NotAllowedError" || err.name === "SecurityError")
      return new CameraError("permission-denied", err.message);
    if (err.name === "NotFoundError" || err.name === "OverconstrainedError")
      return new CameraError("not-found", err.message);
    if (err.name === "NotReadableError" || err.name === "AbortError")
      return new CameraError("in-use", err.message);
  }
  return new CameraError("unknown", err instanceof Error ? err.message : "");
}

/** 사용 가능한 비디오 입력 장치 목록 (권한 허용 후 라벨이 채워짐) */
export async function listVideoInputs(): Promise<MediaDeviceInfo[]> {
  if (!navigator.mediaDevices?.enumerateDevices) return [];
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter((d) => d.kind === "videoinput");
  } catch {
    return [];
  }
}

/** 라벨 기반으로 facing에 맞는 deviceId 추정 (facingMode 미지원 기기 fallback) */
export async function findDeviceIdForFacing(
  facing: Exclude<CameraFacing, "unknown">,
): Promise<string | undefined> {
  const inputs = await listVideoInputs();
  const keywords =
    facing === "user" ? ["front", "전면", "user"] : ["back", "rear", "후면", "environment"];
  const match = inputs.find((d) =>
    keywords.some((k) => d.label.toLowerCase().includes(k)),
  );
  return match?.deviceId;
}

/**
 * 카메라 스트림을 연다.
 * 1) facingMode 우선 → 2) 라벨 기반 deviceId → 3) 아무 카메라
 */
export async function openCameraStream(
  facing: Exclude<CameraFacing, "unknown">,
): Promise<MediaStream> {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new CameraError(
      "unknown",
      "이 브라우저는 카메라를 지원하지 않습니다.",
    );
  }

  try {
    return await navigator.mediaDevices.getUserMedia(buildConstraints(facing));
  } catch (first) {
    const firstError = toCameraError(first);
    if (firstError.type === "permission-denied") throw firstError;

    // fallback: enumerateDevices 기반 deviceId
    try {
      const deviceId = await findDeviceIdForFacing(facing);
      if (deviceId) {
        return await navigator.mediaDevices.getUserMedia(
          buildConstraints(facing, deviceId),
        );
      }
      // 마지막 fallback: 제약 없는 비디오
      return await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });
    } catch (second) {
      throw toCameraError(second);
    }
  }
}

/** 카메라 전환/페이지 이탈 시 반드시 호출하여 트랙을 정리한다 */
export function stopStream(stream: MediaStream | null): void {
  stream?.getTracks().forEach((track) => track.stop());
}

/** 현재 스트림의 실제 facing 추정 */
export function detectFacing(stream: MediaStream): CameraFacing {
  const track = stream.getVideoTracks()[0];
  if (!track) return "unknown";
  const facingMode = track.getSettings().facingMode;
  if (facingMode === "user") return "user";
  if (facingMode === "environment") return "environment";
  return "unknown";
}
