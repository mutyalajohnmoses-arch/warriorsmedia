import { createFileRoute, useNavigate, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import {
  Cross,
  LogOut,
  Radio,
  Music2,
  Film,
  HandHeart,
  Users,
  Mic2,
  Video,
  MessageCircle,
  Sparkles,
  ArrowRight,
  Instagram,
  RefreshCw,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getInstagramStats } from "@/lib/instagram.functions";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Home — Warriors Media" },
      { name: "description", content: "Your sanctuary of worship, community and Christian media." },
    ],
  }),
  component: Home,
});

const IG_USERNAME = "mutyala_john_moses";


const modules = [
  {
    icon: Radio,
    title: "Live Streaming",
    desc: "Worship services & events in HD",
    tag: "LIVE NOW",
  },
  { icon: Film, title: "Reels", desc: "Short-form Christian content feed", tag: "TRENDING" },
  { icon: Music2, title: "Worship Music", desc: "Telugu & global worship library", tag: "NEW" },
  { icon: HandHeart, title: "Prayer Wall", desc: "Share & lift up requests together", tag: "" },
  { icon: Users, title: "Community", desc: "Churches, teams & WhatsApp groups", tag: "" },
  { icon: Mic2, title: "Studio Booking", desc: "Recording, video & live production", tag: "" },
  { icon: Video, title: "Video Editor", desc: "AI-assisted reels & sermon edits", tag: "SOON" },
  {
    icon: MessageCircle,
    title: "WhatsApp Bridge",
    desc: "Sync ministry chats seamlessly",
    tag: "BETA",
  },
];

function Home() {
  const navigate = useNavigate();
  const router = useRouter();
  const [profile, setProfile] = useState<{ full_name: string | null; email: string | null } | null>(
    null,
  );
  const [loading, setLoading] = useState(true);

  const handleModuleClick = (title: string) => {
    if (title === "Live Streaming") {
      navigate({ to: "/live-streaming-setup" });
    } else {
      // Handle other modules as needed
    }
  };

  useEffect(() => {
    const load = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        navigate({ to: "/" });
        return;
      }
      const { data } = await supabase
        .from("profiles")
        .select("full_name, email")
        .eq("id", session.user.id)
        .maybeSingle();
      setProfile(data ?? { full_name: null, email: session.user.email ?? null });
      setLoading(false);
    };
    load();
  }, [navigate]);

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  const firstName = profile?.full_name?.split(" ")[0] ?? "Warrior";

  const fetchIg = useServerFn(getInstagramStats);
  const igQuery = useQuery({
    queryKey: ["ig-stats", IG_USERNAME],
    queryFn: () => fetchIg({ data: { username: IG_USERNAME } }),
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });
  const fmt = (n: number | null | undefined) =>
    typeof n === "number" ? n.toLocaleString("en-IN") : "—";


  return (
    <main className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-[radial-gradient(circle,oklch(0.78_0.16_80/0.12),transparent_70%)]" />
      </div>

      {/* Header */}
      <header className="px-6 md:px-10 pt-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full border border-[color:var(--gold)]/40 flex items-center justify-center bg-card/40">
            <Cross className="w-4 h-4 text-[color:var(--gold)]" strokeWidth={1.5} />
          </div>
          <span className="font-display tracking-wide">
            Warriors <span className="text-gold-gradient">Media</span>
          </span>
        </div>
        <button
          onClick={signOut}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border hover:border-[color:var(--gold)]/50 text-xs transition"
        >
          <LogOut className="w-3.5 h-3.5" /> Sign out
        </button>
      </header>

      {/* Hero / welcome */}
      <section className="px-6 md:px-10 pt-12 pb-10 max-w-5xl mx-auto">
        <p className="text-[10px] uppercase tracking-[0.4em] text-[color:var(--gold-soft)] mb-4">
          Sanctuary · Home
        </p>
        <h1 className="font-display text-4xl md:text-6xl leading-tight">
          Welcome back, <span className="text-gold-gradient">{loading ? "…" : firstName}</span>
        </h1>
        <p className="text-muted-foreground mt-4 max-w-xl">
          Step into worship, community, and Christian creativity — all in one cinematic place.
        </p>

        <div className="mt-8 p-5 rounded-2xl border border-[color:var(--gold)]/30 bg-card/60 backdrop-blur-xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">On Air</p>
              <p className="font-medium">Sunday Worship · Hyderabad Live</p>
            </div>
          </div>
          <button className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold-gradient text-[color:var(--primary-foreground)] text-sm font-medium glow-gold">
            Join <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* Modules grid */}
      <section className="px-6 md:px-10 pb-20 max-w-5xl mx-auto">
        <div className="flex items-end justify-between mb-6">
          <h2 className="font-display text-2xl">Your Modules</h2>
          <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground inline-flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-[color:var(--gold)]" /> Premium
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {modules.map(({ icon: Icon, title, desc, tag }) => (
            <article
              key={title}
              onClick={() => handleModuleClick(title)}
              className="group relative p-5 rounded-2xl border border-border bg-card/50 backdrop-blur hover:border-[color:var(--gold)]/50 transition cursor-pointer"
            >
              {tag && (
                <span className="absolute top-4 right-4 text-[9px] uppercase tracking-[0.2em] px-2 py-1 rounded-full border border-[color:var(--gold)]/40 text-[color:var(--gold-soft)]">
                  {tag}
                </span>
              )}
              <div className="w-10 h-10 rounded-xl border border-[color:var(--gold)]/30 flex items-center justify-center mb-4 bg-background/40 group-hover:bg-gold-gradient group-hover:border-transparent transition">
                <Icon
                  className="w-5 h-5 text-[color:var(--gold)] group-hover:text-[color:var(--primary-foreground)] transition"
                  strokeWidth={1.5}
                />
              </div>
              <h3 className="font-medium mb-1">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
            </article>
          ))}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-12">
          Signed in as <span className="text-[color:var(--gold-soft)]">{profile?.email}</span>
        </p>
      </section>
    </main>
  );
}
