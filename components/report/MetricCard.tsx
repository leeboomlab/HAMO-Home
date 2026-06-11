import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  icon: LucideIcon;
  title: string;
  value: string;
  description: string;
}

export default function MetricCard({
  icon: Icon,
  title,
  value,
  description,
}: MetricCardProps) {
  return (
    <div className="rounded-2xl bg-card border border-gray-100 p-4 flex-1">
      <p className="text-sm text-sub flex items-center gap-1">
        {title}
        <Icon size={14} className="text-primary" />
      </p>
      <p className="mt-1 text-xl font-black text-ink">{value}</p>
      <p className="mt-0.5 text-xs text-sub leading-relaxed">{description}</p>
    </div>
  );
}
