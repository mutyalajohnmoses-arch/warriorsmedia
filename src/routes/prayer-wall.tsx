import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowLeft,
  Heart,
  Trash2,
  Loader2,
  Prayer,
  Plus,
  Filter,
  Search,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  getPrayerRequests,
  createPrayerRequest,
  deletePrayerRequest,
  agreeToPrayer,
} from "@/lib/prayer.functions";
import { PrayerCard } from "@/components/prayer-card";
import { CreatePrayerForm } from "@/components/create-prayer-form";

export const Route = createFileRoute("/prayer-wall")({
  head: () => ({
    meta: [
      { title: "Prayer Wall — Warriors Media" },
      {
        name: "description",
        content: "Share, lift up, and pray together with the Warriors community.",
      },
    ],
  }),
  component: PrayerWall,
});

type PrayerRequest = {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: string;
  agreed_count: number;
  created_at: string;
  user_name: string;
  is_own: boolean;
  has_agreed: boolean;
};

function PrayerWall() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchPrayers = useServerFn(getPrayerRequests);
  const createPrayer = useServerFn(createPrayerRequest);
  const removePrayer = useServerFn(deletePrayerRequest);
  const agreeOnPrayer = useServerFn(agreeToPrayer);

  // Fetch user
  useEffect(() => {
    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        navigate({ to: "/" });
        return;
      }
      setUserId(session.user.id);
      setLoading(false);
    })();
  }, [navigate]);

  // Fetch prayers
  const prayersQuery = useQuery({
    queryKey: ["prayers"],
    queryFn: () => fetchPrayers({ data: { userId: userId || "" } }),
    enabled: !!userId,
    refetchInterval: 5000,
  });

  // Create prayer mutation
  const createMutation = useMutation({
    mutationFn: (data: { title: string; description: string; category: string }) =>
      createPrayer({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prayers"] });
      setShowForm(false);
      toast.success("Prayer request shared with the community!");
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to create prayer");
    },
  });

  // Delete prayer mutation
  const deleteMutation = useMutation({
    mutationFn: (prayerId: string) => removePrayer({ data: { prayerId } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prayers"] });
      toast.success("Prayer removed");
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    },
  });

  // Agree mutation
  const agreeMutation = useMutation({
    mutationFn: (prayerId: string) => agreeOnPrayer({ data: { prayerId } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prayers"] });
      toast.success("You're praying this request!");
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to agree");
    },
  });

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[color:var(--gold)]" />
      </main>
    );
  }

  // Filter and search prayers
  let filteredPrayers = prayersQuery.data || [];
  if (filter !== "all") {
    filteredPrayers = filteredPrayers.filter((p) => p.category === filter);
  }
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filteredPrayers = filteredPrayers.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
    );
  }

  const categories = ["all", "healing", "guidance", "family", "work", "faith", "other"];

  return (
    <main className="min-h-screen relative overflow-hidden pb-20">
      <div className="absolute inset-0 -z-10">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-accent/5 blur-[120px]" />
      </div>

      {/* Header */}
      <header className="px-6 md:px-10 pt-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate({ to: "/dashboard" })}
            className="p-2 hover:bg-card rounded-lg transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-display text-2xl flex items-center gap-2">
              <Prayer className="w-6 h-6 text-[color:var(--gold)]" />
              Prayer Wall
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              Lift up requests · Support each other in prayer
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold-gradient text-[color:var(--primary-foreground)] text-sm font-medium glow-gold"
        >
          <Plus className="w-4 h-4" /> Add Prayer
        </button>
      </header>

      {/* Create Prayer Form */}
      {showForm && (
        <section className="px-6 md:px-10 py-6 max-w-2xl mx-auto">
          <CreatePrayerForm
            onSubmit={(data) => createMutation.mutate(data)}
            isLoading={createMutation.isPending}
            onCancel={() => setShowForm(false)}
          />
        </section>
      )}

      {/* Stats */}
      <section className="px-6 md:px-10 py-6 max-w-5xl mx-auto">
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 rounded-lg border border-border bg-card/50">
            <p className="text-xs text-muted-foreground uppercase tracking-[0.2em]">
              Total Requests
            </p>
            <p className="text-2xl font-display mt-1">
              {filteredPrayers.length}
            </p>
          </div>
          <div className="p-4 rounded-lg border border-border bg-card/50">
            <p className="text-xs text-muted-foreground uppercase tracking-[0.2em]">
              Total Prayers
            </p>
            <p className="text-2xl font-display mt-1 text-[color:var(--gold)]">
              {filteredPrayers.reduce((sum, p) => sum + p.agreed_count, 0)}
            </p>
          </div>
          <div className="p-4 rounded-lg border border-border bg-card/50">
            <p className="text-xs text-muted-foreground uppercase tracking-[0.2em]">
              Your Prayers
            </p>
            <p className="text-2xl font-display mt-1">
              {filteredPrayers.filter((p) => p.is_own).length}
            </p>
          </div>
        </div>
      </section>

      {/* Search & Filter */}
      <section className="px-6 md:px-10 py-6 max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Search prayers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-background/60 border border-border rounded-lg pl-11 pr-4 py-2.5 text-sm focus:outline-none focus:border-[color:var(--gold)]/60 transition"
            />
          </div>

          {/* Filter */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-4 py-2 rounded-full text-xs uppercase tracking-[0.15em] transition whitespace-nowrap ${
                  filter === cat
                    ? "bg-gold-gradient text-[color:var(--primary-foreground)]"
                    : "border border-border hover:border-[color:var(--gold)]/50"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Prayer Cards */}
      <section className="px-6 md:px-10 max-w-5xl mx-auto">
        {prayersQuery.isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-[color:var(--gold)]" />
          </div>
        ) : filteredPrayers.length === 0 ? (
          <div className="text-center py-12">
            <Prayer className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">No prayer requests found</p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 text-[color:var(--gold)] hover:underline text-sm"
            >
              Be the first to share
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredPrayers.map((prayer) => (
              <PrayerCard
                key={prayer.id}
                prayer={prayer}
                onAgree={() => agreeMutation.mutate(prayer.id)}
                onDelete={() => deleteMutation.mutate(prayer.id)}
                isAgreeLoading={agreeMutation.isPending}
                isDeleteLoading={deleteMutation.isPending}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
