"use client";

import { useRef, type ButtonHTMLAttributes, type ReactNode } from "react";

interface TouchButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  onPress: () => void;
}

/**
 * iOS Safari + ngrok dev 환경에서 click 이벤트가 누락되는 경우를 대비한 버튼.
 * pointerup 기준으로 동작하며, 짧은 시간 내 중복 호출을 막는다.
 */
export default function TouchButton({
  children,
  onPress,
  className = "",
  disabled,
  ...rest
}: TouchButtonProps) {
  const lock = useRef(false);

  const handlePress = () => {
    if (disabled || lock.current) return;
    lock.current = true;
    onPress();
    window.setTimeout(() => {
      lock.current = false;
    }, 300);
  };

  return (
    <button
      type="button"
      disabled={disabled}
      className={`touch-manipulation ${className}`}
      onPointerUp={handlePress}
      onClick={handlePress}
      {...rest}
    >
      {children}
    </button>
  );
}
