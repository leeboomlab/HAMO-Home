import { ReactNode } from "react";
import Link from "next/link";
import HamoLogo from "@/components/brand/HamoLogo";

interface HeaderProps {
  right?: ReactNode;
  /** 기본 `/`. 온보딩 등에서 시작 화면으로 돌아갈 때 사용 */
  logoHref?: string;
}

export default function Header({ right, logoHref = "/" }: HeaderProps) {
  return (
    <header className="flex items-center justify-between pt-5 pb-3">
      <Link href={logoHref} className="flex items-center" aria-label="HAMO 홈">
        <HamoLogo className="h-7 w-auto" />
      </Link>
      {right && <div className="flex items-center gap-2">{right}</div>}
    </header>
  );
}
