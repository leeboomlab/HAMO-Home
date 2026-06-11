interface RepCounterProps {
  count: number;
}

export default function RepCounter({ count }: RepCounterProps) {
  return (
    <div className="flex flex-col items-start">
      <span className="text-sm text-sub">현재 횟수</span>
      <span className="text-[32px] leading-tight font-black text-ink tabular-nums">
        {count} <span className="text-base font-bold text-sub">회</span>
      </span>
    </div>
  );
}
