import { Heart, Trash2, User, Calendar } from "lucide-react";
import { toast } from "sonner";

type Prayer = {
  id: string;
  title: string;
  description: string;
  category: string;
  user_name: string;
  agreed_count: number;
  created_at: string;
  is_own: boolean;
  has_agreed: boolean;
};

interface PrayerCardProps {
  prayer: Prayer;
  onAgree: () => void;
  onDelete: () => void;
  isAgreeLoading: boolean;
  isDeleteLoading: boolean;
}

const categoryColors: Record<string, string> = {
  healing: "bg-red-500/10 text-red-600 border-red-500/30",
  guidance: "bg-blue-500/10 text-blue-600 border-blue-500/30",
  family: "bg-green-500/10 text-green-600 border-green-500/30",
  work: "bg-purple-500/10 text-purple-600 border-purple-500/30",
  faith: "bg-yellow-500/10 text-yellow-600 border-yellow-500/30",
  other: "bg-gray-500/10 text-gray-600 border-gray-500/30",
};

export function PrayerCard({
  prayer,
  onAgree,
  onDelete,
  isAgreeLoading,
  isDeleteLoading,
}: PrayerCardProps) {
  const categoryColor = categoryColors[prayer.category] || categoryColors.other;
  const createdDate = new Date(prayer.created_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  return (
    <article className="p-5 rounded-2xl border border-border bg-card/50 backdrop-blur hover:border-[color:var(--gold)]/50 transition group">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm leading-tight line-clamp-2 group-hover:text-[color:var(--gold)] transition">
            {prayer.title}
          </h3>
          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
            <User className="w-3 h-3" />
            {prayer.user_name}
          </p>
        </div>

        {prayer.is_own && (
          <button
            onClick={(e) => {
              e.preventDefault();
              onDelete();
            }}
            disabled={isDeleteLoading}
            className="p-1.5 rounded-lg hover:bg-red-500/10 transition disabled:opacity-50"
            title="Delete prayer"
          >
            <Trash2 className="w-4 h-4 text-red-500" />
          </button>
        )}
      </div>

      {/* Category & Date */}
      <div className="flex items-center gap-2 mb-3">
        <span
          className={`text-[10px] uppercase tracking-[0.1em] px-2 py-1 rounded-full border ${categoryColor}`}
        >
          {prayer.category}
        </span>
        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          {createdDate}
        </span>
      </div>

      {/* Description */}
      <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
        {prayer.description}
      </p>

      {/* Footer: Agreement count & agree button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Heart
            className={`w-4 h-4 ${
              prayer.agreed_count > 0
                ? "fill-[color:var(--gold)] text-[color:var(--gold)]"
                : "text-muted-foreground"
            }`}
          />
          <span className="text-xs font-medium text-muted-foreground">
            {prayer.agreed_count} {prayer.agreed_count === 1 ? "prayer" : "prayers"}
          </span>
        </div>

        <button
          onClick={(e) => {
            e.preventDefault();
            onAgree();
          }}
          disabled={isAgreeLoading}
          className={`px-3 py-1.5 rounded-lg text-xs uppercase tracking-[0.1em] font-medium transition disabled:opacity-50 ${
            prayer.has_agreed
              ? "bg-[color:var(--gold)]/20 text-[color:var(--gold)] border border-[color:var(--gold)]/40"
              : "bg-background/60 border border-border hover:border-[color:var(--gold)]/50 text-foreground"
          }`}
        >
          {isAgreeLoading ? "..." : prayer.has_agreed ? "Praying" : "Pray"}
        </button>
      </div>
    </article>
  );
}
