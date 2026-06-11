import Image from "next/image";
import { ShieldCheck, Info } from "lucide-react";
import HamoLogo from "@/components/brand/HamoLogo";
import MobileShell from "@/components/layout/MobileShell";
import GoogleLoginButton from "@/components/auth/GoogleLoginButton";
import GuestStartButton from "@/components/auth/GuestStartButton";

export default function StartPage() {
  return (
    <MobileShell className="px-5 pb-8">
      <div className="pt-10 pb-6">
        <HamoLogo priority />
      </div>

      <div className="relative">
        <Image
          src="/heart.png"
          alt=""
          aria-hidden
          width={229}
          height={235}
          className="absolute -right-1 top-4 w-[88px] md:w-[96px] h-auto pointer-events-none select-none"
          priority
        />

        <h1 className="text-[28px] leading-snug font-black text-ink pr-16">
          부모님이
          <br />
          <span className="text-primary">넘어지기 전에,</span>
          <br />
          매일 5분만 확인하세요
        </h1>

        <p className="mt-4 text-base text-sub leading-relaxed">
          카메라로 간단한 움직임을 확인하고,
          <br />
          쉽게 리포트를 확인할 수 있어요.
        </p>
      </div>

      <div className="flex-1 flex items-center min-h-[180px] my-2">
        <Image
          src="/start-hero.png"
          alt="부모님이 함께 건강을 확인하는 모습"
          width={1448}
          height={1086}
          className="w-full h-auto object-contain"
          priority
          sizes="(max-width: 768px) calc(100vw - 2.5rem), 472px"
        />
      </div>

      <div className="flex flex-col gap-3">
        <GoogleLoginButton />
        <GuestStartButton />
      </div>

      <div className="mt-6 flex flex-col gap-2">
        <div className="rounded-2xl bg-card border border-gray-100 px-4 py-3 flex items-start gap-3">
          <ShieldCheck className="text-primary shrink-0 mt-0.5" size={20} />
          <p className="text-sm text-sub leading-relaxed">
            카메라 영상은 저장되지 않습니다.
          </p>
        </div>
        <div className="rounded-2xl bg-card border border-gray-100 px-4 py-3 flex items-start gap-3">
          <Info className="text-sub shrink-0 mt-0.5" size={20} />
          <p className="text-sm text-sub leading-relaxed">
            HAMO는 의료 진단이 아닌 건강관리 참고용 자가 체크 서비스이며,
            의료적 진단이나 치료를 대체하지 않습니다.
          </p>
        </div>
      </div>
    </MobileShell>
  );
}
