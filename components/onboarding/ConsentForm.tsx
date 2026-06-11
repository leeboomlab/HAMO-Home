"use client";

import { Check } from "lucide-react";
import TouchButton from "@/components/ui/TouchButton";
import { ConsentFlags } from "@/types/profile";

interface ConsentFormProps {
  value: ConsentFlags;
  onChange: (next: ConsentFlags) => void;
}

interface ConsentItem {
  key: keyof ConsentFlags;
  label: string;
  required: boolean;
  description?: string;
}

const ITEMS: ConsentItem[] = [
  {
    key: "privacyRequired",
    label: "개인정보 수집·이용 동의",
    required: true,
    description: "측정 결과 요약과 프로필 정보를 저장하는 데 사용돼요.",
  },
  {
    key: "healthNoticeRequired",
    label: "건강관리 참고용 서비스 안내 확인",
    required: true,
    description:
      "HAMO는 의료 진단이 아닌 건강관리 참고용 자가 체크 서비스입니다.",
  },
  {
    key: "notificationOptional",
    label: "알림 수신 동의 (선택)",
    required: false,
    description: "매일 체크 시간을 알려드려요. 나중에 변경할 수 있어요.",
  },
];

export default function ConsentForm({ value, onChange }: ConsentFormProps) {
  return (
    <div className="flex flex-col gap-2">
      {ITEMS.map((item) => {
        const checked = value[item.key];
        return (
          <TouchButton
            key={item.key}
            aria-pressed={checked}
            onPress={() => onChange({ ...value, [item.key]: !checked })}
            className={`text-left rounded-2xl border px-4 py-3 flex items-start gap-3 transition w-full ${
              checked
                ? "bg-primary-light border-primary"
                : "bg-card border-gray-200"
            }`}
          >
            <span
              className={`mt-0.5 w-6 h-6 shrink-0 rounded-full flex items-center justify-center ${
                checked ? "bg-primary text-white" : "bg-gray-200 text-white"
              }`}
            >
              <Check size={16} strokeWidth={3} />
            </span>
            <span>
              <span className="block text-base font-bold text-ink">
                {item.label}
                {item.required && (
                  <span className="text-danger ml-1 text-sm">필수</span>
                )}
              </span>
              {item.description && (
                <span className="block text-sm text-sub mt-0.5 leading-relaxed">
                  {item.description}
                </span>
              )}
            </span>
          </TouchButton>
        );
      })}
    </div>
  );
}
