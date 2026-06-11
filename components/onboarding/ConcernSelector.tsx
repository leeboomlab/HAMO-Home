"use client";

import TouchButton from "@/components/ui/TouchButton";
import { ConcernFlags } from "@/types/profile";

const CONCERN_ITEMS: { key: keyof ConcernFlags; label: string }[] = [
  { key: "fall", label: "낙상 위험" },
  { key: "strength", label: "다리 근력 저하" },
  { key: "balance", label: "균형감각 저하" },
  { key: "walking", label: "보행 불안" },
  { key: "exercise", label: "운동 부족" },
  { key: "parentStatus", label: "부모님 상태 확인" },
];

interface ConcernSelectorProps {
  value: ConcernFlags;
  onChange: (next: ConcernFlags) => void;
}

export default function ConcernSelector({
  value,
  onChange,
}: ConcernSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {CONCERN_ITEMS.map(({ key, label }) => {
        const selected = value[key];
        return (
          <TouchButton
            key={key}
            aria-pressed={selected}
            onPress={() => onChange({ ...value, [key]: !selected })}
            className={`min-h-[52px] rounded-2xl border text-base font-medium px-3 transition ${
              selected
                ? "bg-primary-light border-primary text-primary-dark font-bold"
                : "bg-card border-gray-200 text-sub"
            }`}
          >
            {label}
          </TouchButton>
        );
      })}
    </div>
  );
}
