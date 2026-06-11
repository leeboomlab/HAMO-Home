import Link from "next/link";
import { Camera, ClipboardCheck, Clock3, Dumbbell, Play } from "lucide-react";
import MobileShell from "@/components/layout/MobileShell";
import Header from "@/components/layout/Header";
import SafetyNotice from "@/components/assessment/SafetyNotice";

const STEPS = [
  { icon: ClipboardCheck, title: "준비 안내", desc: "의자와 공간을 준비해요" },
  {
    icon: Camera,
    title: "의자에서 앉았다 일어나기",
    desc: "카메라가 횟수를 세어드려요",
  },
  { icon: ClipboardCheck, title: "결과 확인", desc: "오늘의 움직임 상태 확인" },
  { icon: Dumbbell, title: "추천 운동", desc: "결과에 맞는 운동 1~2개" },
] as const;

export default function DailyPage() {
  return (
    <MobileShell withBottomNav className="px-5 pb-8">
      <Header />

      <h1 className="text-2xl font-black text-ink">오늘의 루틴</h1>
      <p className="mt-1 text-base text-sub flex items-center gap-1">
        <Clock3 size={16} className="text-primary" />
        측정 시간: 30초
      </p>

      <div className="mt-5 rounded-3xl bg-card border border-gray-100 shadow-sm p-5 flex flex-col gap-4">
        {STEPS.map((step, i) => (
          <div key={step.title} className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-primary-light text-primary font-black flex items-center justify-center shrink-0">
              {i + 1}
            </div>
            <div>
              <p className="text-base font-bold text-ink">{step.title}</p>
              <p className="text-sm text-sub">{step.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4">
        <SafetyNotice />
      </div>

      <div className="mt-4 rounded-2xl bg-primary-light px-4 py-3">
        <p className="text-sm text-primary-dark leading-relaxed">
          준비물: 등받이가 있는 튼튼한 의자 1개
          <br />
          전신이 화면에 보이도록 2~3m 떨어져 주세요.
        </p>
      </div>

      <div className="flex-1 min-h-6" />

      <Link
        href="/assessment/sit-to-stand"
        className="w-full min-h-[56px] rounded-2xl bg-primary text-white text-lg font-bold flex items-center justify-center gap-2 shadow-md active:scale-[0.98] transition"
      >
        <Play size={20} fill="currentColor" />
        시작하기
      </Link>
    </MobileShell>
  );
}
