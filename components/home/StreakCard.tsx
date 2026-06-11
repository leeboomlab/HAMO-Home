import { Flame } from "lucide-react";

interface StreakCardProps {
  streak: number;
  weekCount: number;
}

export default function StreakCard({ streak, weekCount }: StreakCardProps) {
  return (
    <div className="rounded-2xl bg-primary-light px-4 py-3 flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-card flex items-center justify-center shrink-0">
        <Flame className="text-warning" size={22} fill="currentColor" />
      </div>
      <div>
        {streak > 0 ? (
          <>
            <p className="text-base font-black text-primary-dark">
              {streak}일 연속 체크 중
            </p>
            <p className="text-sm text-sub">
              이번 주 {weekCount}번 움직임을 확인했어요.
            </p>
          </>
        ) : (
          <>
            <p className="text-base font-black text-primary-dark">
              오늘부터 시작해 볼까요?
            </p>
            <p className="text-sm text-sub">
              매일 꾸준한 습관이 건강을 만듭니다.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
