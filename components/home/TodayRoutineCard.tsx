"use client";

import Image from "next/image";
import Link from "next/link";
import { BarChart3, Clock3, Play } from "lucide-react";

interface TodayRoutineCardProps {
  completed: boolean;
}

export default function TodayRoutineCard({ completed }: TodayRoutineCardProps) {
  return (
    <div className="rounded-3xl bg-card border border-gray-100 shadow-sm p-5">
      <h2 className="text-base font-bold text-primary">오늘의 루틴</h2>

      <div className="mt-4 flex items-center gap-4">
        <div className="w-20 h-20 rounded-full bg-primary-light flex items-center justify-center shrink-0 overflow-hidden">
          <Image
            src="/chair_sit_stand.png"
            alt="의자에서 앉았다 일어나기"
            width={80}
            height={80}
            className="w-full h-full object-contain p-2"
          />
        </div>
        <div>
          <p className="text-lg font-black text-ink">의자에서 앉았다 일어나기</p>
          <p className="text-sm text-sub mt-1 leading-relaxed">
            하체 근력과 균형 감각을 키우는 쉬운 운동이에요.
          </p>
          <p className="text-sm text-primary font-bold mt-1 flex items-center gap-1">
            <Clock3 size={14} /> 30초
          </p>
        </div>
      </div>

      <Link
        href="/daily"
        className="mt-5 w-full min-h-[56px] rounded-2xl bg-primary text-white text-lg font-bold flex items-center justify-center gap-2 shadow-md active:scale-[0.98] transition"
      >
        <Play size={20} fill="currentColor" />
        {completed ? "한 번 더 하기" : "오늘 루틴 시작하기"}
      </Link>

      <Link
        href="/history"
        className="mt-2 w-full min-h-[52px] rounded-2xl bg-card border border-gray-200 text-ink text-base font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition"
      >
        <BarChart3 size={18} />
        지난 결과 보기
      </Link>
    </div>
  );
}
