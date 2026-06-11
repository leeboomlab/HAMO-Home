import { QualityLevel } from "@/types/assessment";
import { QUALITY_LEVEL_LABEL } from "@/lib/analyzers/qualityScore";

interface QualityBadgeProps {
  level: QualityLevel;
}

const STYLES: Record<QualityLevel, string> = {
  high: "bg-success/10 text-success",
  medium: "bg-primary-light text-primary-dark",
  low: "bg-warning/10 text-warning",
  retry: "bg-danger/10 text-danger",
};

export default function QualityBadge({ level }: QualityBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-bold ${STYLES[level]}`}
    >
      측정 품질 {QUALITY_LEVEL_LABEL[level]}
    </span>
  );
}
