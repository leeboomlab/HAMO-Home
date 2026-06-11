import { Check } from "lucide-react";
import { todayLocalDate } from "@/lib/utils/date";

interface StreakCalendarProps {
  completedDates: string[];
}

/** 최근 7일 완료 현황을 점으로 표시하는 간단 주간 뷰 */
export default function StreakCalendar({
  completedDates,
}: StreakCalendarProps) {
  const set = new Set(completedDates);
  const today = new Date();
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    const ymd = todayLocalDate(d);
    return {
      ymd,
      label: `${d.getMonth() + 1}/${d.getDate()}`,
      done: set.has(ymd),
    };
  });

  return (
    <div className="flex justify-between">
      {days.map((day) => (
        <div key={day.ymd} className="flex flex-col items-center gap-1.5">
          <span
            className={`w-9 h-9 rounded-full flex items-center justify-center ${
              day.done ? "bg-primary text-white" : "bg-gray-100 text-gray-300"
            }`}
          >
            <Check size={18} strokeWidth={3} />
          </span>
          <span className="text-xs text-sub">{day.label}</span>
        </div>
      ))}
    </div>
  );
}
