"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BarChart3, Settings } from "lucide-react";

const TABS = [
  { href: "/", label: "홈", icon: Home },
  { href: "/history", label: "기록", icon: BarChart3 },
  { href: "/settings", label: "설정", icon: Settings },
] as const;

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md md:max-w-lg bg-card border-t border-primary-light flex justify-around items-stretch pb-[env(safe-area-inset-bottom)] z-40">
      {TABS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center justify-center gap-1 py-2.5 min-w-20 min-h-[60px] ${
              active ? "text-primary font-bold" : "text-sub"
            }`}
          >
            <Icon size={24} strokeWidth={active ? 2.5 : 2} />
            <span className="text-xs">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
