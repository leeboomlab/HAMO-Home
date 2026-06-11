interface SitStandTimerProps {
  remainingSec: number;
}

export default function SitStandTimer({ remainingSec }: SitStandTimerProps) {
  const mm = String(Math.floor(remainingSec / 60)).padStart(2, "0");
  const ss = String(Math.max(0, remainingSec % 60)).padStart(2, "0");
  return (
    <div className="flex flex-col items-start">
      <span className="text-sm text-sub">남은 시간</span>
      <span className="text-[32px] leading-tight font-black text-primary tabular-nums">
        {mm}:{ss}
      </span>
    </div>
  );
}
