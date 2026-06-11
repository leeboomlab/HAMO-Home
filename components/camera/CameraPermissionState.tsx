"use client";

import { Camera, CameraOff, RefreshCcw } from "lucide-react";
import { CameraErrorType } from "@/lib/camera/cameraDevices";

interface CameraPermissionStateProps {
  state: "requesting" | "error";
  errorType?: CameraErrorType;
  onRetry: () => void;
}

const ERROR_COPY: Record<CameraErrorType, { title: string; body: string }> = {
  "permission-denied": {
    title: "카메라 권한이 필요해요",
    body: "브라우저 주소창의 카메라 아이콘 또는 설정에서 카메라 권한을 허용한 뒤 다시 시도해 주세요. 영상은 서버에 저장되지 않고 기기에서만 분석됩니다.",
  },
  "not-found": {
    title: "카메라를 찾을 수 없어요",
    body: "기기에 사용 가능한 카메라가 없거나 연결되지 않았어요. 다른 기기에서 시도해 주세요.",
  },
  "in-use": {
    title: "카메라를 사용할 수 없어요",
    body: "다른 앱에서 카메라를 사용 중일 수 있어요. 다른 앱을 종료한 뒤 다시 시도해 주세요.",
  },
  unknown: {
    title: "카메라를 켜지 못했어요",
    body: "잠시 후 다시 시도해 주세요. 문제가 계속되면 브라우저를 새로고침해 주세요.",
  },
};

export default function CameraPermissionState({
  state,
  errorType = "unknown",
  onRetry,
}: CameraPermissionStateProps) {
  if (state === "requesting") {
    return (
      <div className="w-full aspect-[3/4] rounded-3xl bg-gray-900 flex flex-col items-center justify-center gap-3 text-white px-6">
        <Camera size={40} className="text-white/70" />
        <p className="text-base font-bold">카메라 권한을 요청하고 있어요</p>
        <p className="text-sm text-white/70 text-center leading-relaxed">
          영상은 서버에 저장되지 않고
          <br />
          기기에서만 분석됩니다.
        </p>
      </div>
    );
  }

  const copy = ERROR_COPY[errorType];
  return (
    <div className="w-full aspect-[3/4] rounded-3xl bg-gray-900 flex flex-col items-center justify-center gap-3 text-white px-6">
      <CameraOff size={40} className="text-danger" />
      <p className="text-base font-bold">{copy.title}</p>
      <p className="text-sm text-white/70 text-center leading-relaxed">
        {copy.body}
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-2 min-h-[48px] px-6 rounded-2xl bg-primary text-white text-base font-bold flex items-center gap-2 active:scale-95 transition"
      >
        <RefreshCcw size={18} />
        다시 시도
      </button>
    </div>
  );
}
