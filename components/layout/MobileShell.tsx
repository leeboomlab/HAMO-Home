import { ReactNode } from "react";
import BottomNav from "./BottomNav";

interface MobileShellProps {
  children: ReactNode;
  /** 하단 탭 네비게이션 표시 여부 (측정 화면 등에서는 숨김) */
  withBottomNav?: boolean;
  className?: string;
}

export default function MobileShell({
  children,
  withBottomNav = false,
  className = "",
}: MobileShellProps) {
  return (
    <div className="w-full max-w-md md:max-w-lg mx-auto min-h-dvh flex flex-col bg-app relative">
      <main
        className={`flex-1 flex flex-col ${withBottomNav ? "pb-20" : ""} ${className}`}
      >
        {children}
      </main>
      {withBottomNav && <BottomNav />}
    </div>
  );
}
