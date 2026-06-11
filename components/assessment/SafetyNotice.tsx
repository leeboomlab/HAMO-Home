import { TriangleAlert } from "lucide-react";

export default function SafetyNotice() {
  return (
    <div className="rounded-2xl bg-warning/10 px-4 py-3 flex items-start gap-3">
      <TriangleAlert className="text-warning shrink-0 mt-0.5" size={20} />
      <p className="text-sm text-ink leading-relaxed">
        어지럽거나 불편하면 즉시 중단하세요. 보호자가 옆에서 함께 진행하면 더
        안전합니다.
      </p>
    </div>
  );
}
