import { Dumbbell } from "lucide-react";
import { RecommendedExercise } from "@/types/report";

interface RecommendedExerciseCardProps {
  exercise: RecommendedExercise;
}

export default function RecommendedExerciseCard({
  exercise,
}: RecommendedExerciseCardProps) {
  return (
    <div className="rounded-2xl bg-card border border-gray-100 p-4 flex items-start gap-3 flex-1">
      <div className="w-10 h-10 rounded-xl bg-primary-light flex items-center justify-center shrink-0">
        <Dumbbell className="text-primary" size={20} />
      </div>
      <div>
        <p className="text-base font-bold text-ink">{exercise.title}</p>
        <p className="mt-0.5 text-sm text-sub leading-relaxed">
          {exercise.description}
        </p>
      </div>
    </div>
  );
}
