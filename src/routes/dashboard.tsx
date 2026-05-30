import { createFileRoute, useNavigate } from "@tanstack/react-router";
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
  Music,
  Headphones,
  Mic,
  Palette,
  Camera,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getInstagramStats, getInstagramProfiles } from "@/lib/instagram.functions";
import { YouTubeDownloader, YouTubeMetaExtractor } from "@/components/youtube-tools";
import { YouTubeCreateMenu } from "@/components/youtube-create-menu";
import { getConnectedYouTubeChannel } from "@/lib/youtube-persistence.functions";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Home — Warriors Media" },
      { name: "description", content: "Your sanctuary of worship, community and Christian media." },
      { name: "referrer", content: "no-referrer" },
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
  { icon: HandHeart, title: "Prayer Wall", desc: "Share & lift up requests together", tag: "", route: "/prayer-wall" },
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

const teamMembers = [
  {
    name: "Mutyala John Moses",
    roles: ["Music Producer", "Social Media Manager", "Singer", "Video Editor", "Test Engineer"],
    icon: Music,
    instagram: "mutyala_john_moses",
    instagramUrl: "https://www.instagram.com/mutyala_john_moses?igsh=MWdjbjg5ZnYwdGN2bQ==",
  },
  {
    name: "Akul Raju",
    roles: ["Voice Analyst", "Coordinator"],
    icon: Headphones,
    instagram: "akula_adler",
    instagramUrl: "https://www.instagram.com/akula_adler?igsh=MW5teDQ4Mzc4eTE=",
  },
  {
    name: "Stanley",
    roles: ["Developer"],
    icon: Mic,
    instagram: "stanley_nuthalpati",
    instagramUrl: "https://www.instagram.com/stanley_nuthalpati?igsh=MWVya2Vmejk2ZG13bw==",
  },
  {
    name: "Somesh Kumar",
    roles: ["Editor", "Social Media Analyst"],
    icon: Palette,
    instagram: "broxx__one",
    instagramUrl: "https://www.instagram.com/broxx__one?igsh=Ym1iY2s1bXVseDg2",
  },
  {
    name: "Anand",
    roles: ["Photographer"],
    icon: Camera,
    instagram: "_nandhu_000.1_",
    instagramUrl: "https://www.instagram.com/_nandhu_000.1_?igsh=M2QyNmhrY2kxc2x6",
  },
  {
    name: "Karthick",
    roles: ["Video Editor", "Designer", "Social Media Manager"],
    icon: Camera,
    instagram: "_karthik14_",
    instagramUrl: "https://www.instagram.com/_karthik14_?igsh=YXFzZmhwajd4djQ4",
  },
];

function Home() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<{ full_name: string | null; email: string | null } | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [teamProfiles, setTeamProfiles] = useState<Record<string, any>>({});
  const [youtubeConnected, setYoutubeConnected] = useState(false);

  const fetchIg = useServerFn(getInstagramStats);
  const fetchTeamProfilesServerFn = useServerFn(getInstagramProfiles);
  const getChannelFn = useServerFn(getConnectedYouTubeChannel);

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

  useEffect(() => {
    const checkYouTube = async () => {
      try {
        const channel = await getChannelFn({ data: { userId: "" } });
        setYoutubeConnected(!!channel);
      } catch (err) {
        console.error("Failed to check YouTube connection:", err);
      }
    };
    checkYouTube();
  }, [getChannelFn]);

  useEffect(() => {
    const load = async () => {
      try {
        const usernames = teamMembers.map((m) => m.instagram);
        const profiles = await fetchTeamProfilesServerFn({ data: usernames });
        setTeamProfiles(profiles);
      } catch (e) {
        console.error("Failed to fetch team profiles:", e);
      }
    }
    load();
  }, [fetchTeamProfilesServerFn]);

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  const firstName = profile?.full_name?.split(" ")[0] ?? "Warrior";

  const igQuery = useQuery({
    queryKey: ["ig-stats", IG_USERNAME],
    queryFn: () => fetchIg({ data: { username: IG_USERNAME } }),
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });
  
  const fmt = (n: number | null | undefined) =>
    typeof n === "number" ? n.toLocaleString("en-IN") : "—";

  const handleModuleClick = (title: string, route?: string) => {
    if (route) {
      navigate({ to: route as any });
      return;
    }
    if (title === "Live Streaming") {
      navigate({ to: "/live-streaming-setup" });
    }
  };

  return (
    <main className="min-h-screen relative overflow-hidden bg-background">
      <div className="absolute inset-0 -z-10">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-accent/5 blur-[120px]" />
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
        <div className="flex items-center gap-2">
          <YouTubeCreateMenu 
            channelConnected={youtubeConnected}
            onChannelConnect={() => setYoutubeConnected(true)}
            onChannelDisconnect={() => setYoutubeConnected(false)}
          />
          <button
            onClick={() => {
              const currentThemeStr = localStorage.getItem("app-theme-index");
              let currentTheme = currentThemeStr ? parseInt(currentThemeStr, 10) : 1;
              let nextTheme = (currentTheme % 6) + 1;
              const html = document.documentElement;
              for (let i = 1; i <= 6; i++) html.classList.remove(`theme-${i}`);
              html.classList.add(`theme-${nextTheme}`);
              localStorage.setItem("app-theme-index", nextTheme.toString());
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border hover:border-[color:var(--gold)]/50 text-xs transition"
            title="Change Theme"
          >
            <Palette className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={signOut}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border hover:border-[color:var(--gold)]/50 text-xs transition"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign out
          </button>
        </div>
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

        {/* Instagram live followers */}
        <a
          href={`https://instagram.com/${IG_USERNAME}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 p-5 rounded-2xl border border-[color:var(--gold)]/30 bg-card/60 backdrop-blur-xl flex items-center justify-between gap-4 hover:border-[color:var(--gold)]/60 transition"
        >
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] shrink-0">
              <Instagram className="w-5 h-5 text-white" strokeWidth={1.8} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                Live · Instagram
              </p>
              <p className="font-medium truncate">@{IG_USERNAME}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-display text-2xl md:text-3xl text-gold-gradient leading-none">
              {igQuery.isLoading ? "…" : fmt(igQuery.data?.followers)}
            </p>
            <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mt-1 flex items-center justify-end gap-1.5">
              Followers
              <RefreshCw
                className={`w-3 h-3 ${igQuery.isFetching ? "animate-spin" : "opacity-50"}`}
              />
            </p>
          </div>
        </a>
      </section>

      {/* YouTube tools */}
      <section className="px-6 md:px-10 pb-4 max-w-5xl mx-auto space-y-4">
        <YouTubeDownloader />
        <YouTubeMetaExtractor />
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
          {modules.map(({ icon: Icon, title, desc, tag, route }) => (
            <article
              key={title}
              onClick={() => handleModuleClick(title, route)}
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

      {/* Warriors Team Section */}
      <section className="px-6 md:px-10 pb-20 max-w-5xl mx-auto">
        <div className="mb-8">
          <h2 className="font-display text-2xl mb-2">Warriors Team</h2>
          <p className="text-muted-foreground text-sm">Meet the creative minds behind Warriors Media</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {teamMembers.map(({ name, roles, instagram }) => (
            <div
              key={name}
              className="p-5 rounded-2xl border border-border bg-card/40 backdrop-blur flex items-center gap-4"
            >
              <div className="w-12 h-12 rounded-full border border-[color:var(--gold)]/30 bg-background/60 flex items-center justify-center overflow-hidden">
                {teamProfiles[instagram]?.profile_pic_url ? (
                  <img src={teamProfiles[instagram].profile_pic_url} alt={name} className="w-full h-full object-cover" />
                ) : (
                  <Users className="w-6 h-6 text-[color:var(--gold)]/40" />
                )}
              </div>
              <div>
                <h3 className="font-medium text-sm">{name}</h3>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">
                  {roles.join(" · ")}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
