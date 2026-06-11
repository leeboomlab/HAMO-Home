import { MessageCircle } from "lucide-react";

interface HamoCommentCardProps {
  comment: string;
}

export default function HamoCommentCard({ comment }: HamoCommentCardProps) {
  return (
    <div className="rounded-2xl bg-primary-light p-4 flex items-start gap-3">
      <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center shrink-0">
        <MessageCircle className="text-white" size={18} />
      </div>
      <div>
        <p className="text-sm font-bold text-primary-dark">HAMO 한마디</p>
        <p className="mt-1 text-base text-ink leading-relaxed">{comment}</p>
      </div>
    </div>
  );
}
