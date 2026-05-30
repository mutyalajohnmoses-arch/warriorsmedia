import { Loader2, X } from "lucide-react";
import { useState } from "react";

interface CreatePrayerFormProps {
  onSubmit: (data: { title: string; description: string; category: string }) => void;
  isLoading: boolean;
  onCancel: () => void;
}

const categories = ["healing", "guidance", "family", "work", "faith", "other"];

export function CreatePrayerForm({ onSubmit, isLoading, onCancel }: CreatePrayerFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("other");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;
    onSubmit({ title, description, category });
    setTitle("");
    setDescription("");
    setCategory("other");
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 rounded-2xl border border-[color:var(--gold)]/40 bg-card/60 backdrop-blur-xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-lg">Share a Prayer Request</h2>
        <button
          type="button"
          onClick={onCancel}
          className="p-1 hover:bg-background rounded transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Title */}
      <div>
        <label className="text-xs uppercase tracking-[0.2em] text-[color:var(--gold-soft)] mb-2 block">
          Prayer Title
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., Healing for my mother"
          maxLength={100}
          required
          className="w-full bg-background/60 border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[color:var(--gold)]/60 transition"
        />
        <p className="text-[10px] text-muted-foreground mt-1">{title.length}/100</p>
      </div>

      {/* Category */}
      <div>
        <label className="text-xs uppercase tracking-[0.2em] text-[color:var(--gold-soft)] mb-2 block">
          Category
        </label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full bg-background/60 border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[color:var(--gold)]/60 transition"
        >
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Description */}
      <div>
        <label className="text-xs uppercase tracking-[0.2em] text-[color:var(--gold-soft)] mb-2 block">
          Details
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Share more about your prayer request... (Please keep it respectful and constructive)"
          maxLength={500}
          rows={4}
          required
          className="w-full bg-background/60 border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[color:var(--gold)]/60 transition resize-none"
        />
        <p className="text-[10px] text-muted-foreground mt-1">{description.length}/500</p>
      </div>

      {/* Buttons */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2.5 rounded-lg border border-border hover:border-[color:var(--gold)]/50 text-sm font-medium transition"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading || !title.trim() || !description.trim()}
          className="flex-1 px-4 py-2.5 rounded-lg bg-gold-gradient text-[color:var(--primary-foreground)] text-sm font-medium glow-gold flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Sharing…
            </>
          ) : (
            "Share Prayer"
          )}
        </button>
      </div>

      <p className="text-[10px] text-muted-foreground text-center">
        Your prayer will be visible to the Warriors community. Be respectful & genuine.
      </p>
    </form>
  );
}
