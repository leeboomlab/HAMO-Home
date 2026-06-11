"use client";

import { SwitchCamera } from "lucide-react";
import { CameraFacing } from "@/types/assessment";

interface CameraSwitcherProps {
  facing: CameraFacing;
  onSwitch: () => void;
  disabled?: boolean;
}

export default function CameraSwitcher({
  facing,
  onSwitch,
  disabled,
}: CameraSwitcherProps) {
  const label =
    facing === "user"
      ? "전면 카메라"
      : facing === "environment"
        ? "후면 카메라"
        : "카메라";

  return (
    <button
      type="button"
      onClick={onSwitch}
      disabled={disabled}
      aria-label={`카메라 전환 (현재 ${label})`}
      className="flex items-center gap-1.5 rounded-full bg-black/55 text-white text-sm font-medium px-3 py-2 backdrop-blur-sm active:scale-95 transition disabled:opacity-50"
    >
      <SwitchCamera size={16} />
      카메라 전환
    </button>
  );
}
