
import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import {
  Cross,
  LogOut,
  Radio,
  Instagram,
  Facebook,
  Target,
  Clapperboard,
  Music4,
  Music2,
  Film,
  HandHeart,
  Users,
  Mic2,
  Video,
  MessageCircle,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Music,
  Headphones,
  Mic,
  Palette,
  Camera,
  ArrowUpRight,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getInstagramStats, getInstagramProfiles } from "@/lib/instagram.functions";
import { getConnectedYouTubeChannel } from "@/lib/youtube-persistence.functions";
import { YouTubeDownloader, YouTubeMetaExtractor } from "@/components/youtube-tools";
import { YouTubeCreateMenu } from "@/components/youtube-create-menu";
import { YouTubeChannelStats } from "@/components/youtube-channel-stats";
import type { YouTubeChannelInfo } from "@/lib/youtube-oauth.functions";

type ConnectedYouTubeChannel = {
  id: string;
  channel_id: string;
  title: string | null;
  description?: string | null;
  profile_image_url?: string | null;
  subscriber_count?: string | number | null;
  view_count?: string | number | null;
  video_count?: string | number | null;
};

type TeamProfile = {
  profilePic?: string | null;
  fullName?: string | null;
  followers?: string | number | null;
  posts?: string | number | null;
};

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Warriors Media" },
      { name: "description", content: "The digital ecosystem for modern Christian technology, media, and worship automation." },
      { name: "referrer", content: "no-referrer" },
    ],
  }),
  component: Home,
});

const IG_USERNAME = "mutyala_john_moses";

const modules = [
  {
    icon: Radio,
    title: "YouTube Studio",
    desc: "Broadcast live streams and scale events in ultra-high fidelity.",
    tag: "Live",
  },
  { icon: Instagram, title: "Instagram Core", desc: "Automate social content workflows and audience pipelines.", tag: "Social" },
  { icon: Facebook, title: "Facebook Graph", desc: "Sync platform engagements and scale reach across metadata channels.", tag: "Social" },
  { icon: Target, title: "Warriors Lead Engine", desc: "AI optimization engine engineered to optimize ministry outreach.", tag: "Next-Gen" },
  { icon: Clapperboard, title: "AI Video Editor", desc: "Intelligent auto-cuts, smart captions, and semantic timeline rendering.", tag: "AI Engine" },
  { icon: Music4, title: "AI Worship Music", desc: "Synthesize instrumental orchestrations and sacred arrangements.", tag: "AI Engine" },
  {
    icon: MessageCircle,
    title: "WhatsApp Core",
    desc: "Seamless contextual automation hooks for community management.",
    tag: "Beta",
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
    name: "Andra Akula Raju",
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
  const router = useRouter();
  const [profile, setProfile] = useState<{ full_name: string | null; email: string | null } | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [teamProfiles, setTeamProfiles] = useState<Record<string, TeamProfile>>({});
  const [youtubeConnected, setYoutubeConnected] = useState(false);
  const [hasYouTubeChannel, setHasYouTubeChannel] = useState(false);
  const [connectedChannel, setConnectedChannel] = useState<ConnectedYouTubeChannel | null>(null);

  const handleModuleClick = (title: string) => {
    if (title === "YouTube Studio") {
      if (!youtubeConnected) return;
      navigate({ to: "/live-streaming-setup" });
    } else if (title === "Instagram Core") {
      navigate({ to: "/instagram" });
    }
  };

  const fetchIg = useServerFn(getInstagramStats);
  const fetchTeamProfilesServerFn = useServerFn(getInstagramProfiles);
  const getChannelFn = useServerFn(getConnectedYouTubeChannel);

  const refreshYouTubeChannel = useCallback(
    async (reason: string) => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setYoutubeConnected(false);
        setHasYouTubeChannel(false);
        setConnectedChannel(null);
        return null;
      }

      const channel = await getChannelFn({ data: { userId: session.user.id } });
      setYoutubeConnected(Boolean(channel));
      setHasYouTubeChannel(Boolean(channel));
      setConnectedChannel(channel ?? null);
      return channel ?? null;
    },
    [getChannelFn],
  );

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
    refreshYouTubeChannel("initial-dashboard-load").catch((error) => {
      console.error("[Dashboard] Error checking YouTube connection:", error);
      setYoutubeConnected(false);
      setHasYouTubeChannel(false);
      setConnectedChannel(null);
    });
  }, [refreshYouTubeChannel]);

  useEffect(() => {
    const handleConnected = () => {
      refreshYouTubeChannel("youtube-channel-connected-event").catch((error) => {
        console.error("[Dashboard] Error refreshing after YouTube connected event:", error);
      });
    };

    window.addEventListener("youtube-channel-connected", handleConnected);
    window.addEventListener("storage", handleConnected);
    return () => {
      window.removeEventListener("youtube-channel-connected", handleConnected);
      window.removeEventListener("storage", handleConnected);
    };
  }, [refreshYouTubeChannel]);

  useEffect(() => {
    const load = async () => {
      try {
        const usernames = teamMembers.map((m) => m.instagram);
        const profiles = await fetchTeamProfilesServerFn({ data: usernames });
        setTeamProfiles(profiles);
      } catch (e) {
        console.error("Failed to fetch team profiles:", e);
      }
    };
    load();
  }, [fetchTeamProfilesServerFn]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  const handleChannelConnect = (channelInfo?: YouTubeChannelInfo) => {
    setYoutubeConnected(true);
    setHasYouTubeChannel(true);
    refreshYouTubeChannel("connect-callback").catch((error) => {
      console.error("[Dashboard] Error refreshing YouTube connection:", error);
    });
  };

  const handleChannelDisconnect = () => {
    setYoutubeConnected(false);
    setHasYouTubeChannel(false);
    setConnectedChannel(null);
  };

  return (
    <main className="min-h-screen bg-[#030712] text-slate-200 selection:bg-violet-500/30 overflow-x-hidden relative font-sans antialiased">
      {/* SaaS Ambient Yellow/Amber Blur Glows */}
      <div className="absolute top-[-15%] left-[10%] w-[800px] h-[500px] bg-gradient-to-br from-violet-500/10 to-indigo-600/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-[40%] right-[-10%] w-[600px] h-[600px] bg-violet-600/[0.04] rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute bottom-[5%] left-[-5%] w-[700px] h-[700px] bg-indigo-500/[0.03] rounded-full blur-[180px] pointer-events-none" />

      {/* Linear Style Global Banner Accent Line */}
      <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-violet-500/30 to-transparent absolute top-0 left-0 z-50" />

      {/* Modern Minimal Header */}
      <header className="sticky top-0 z-50 border-b border-white/[0.04] bg-[#030712]/70 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-b from-violet-300 to-indigo-500 flex items-center justify-center shadow-lg shadow-violet-500/10 ring-1 ring-white/20">
              <Sparkles className="w-4 h-4 text-neutral-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-semibold text-sm tracking-tight text-white uppercase font-mono">
                  Warriors Media
                </h1>
                <span className="text-[10px] bg-white/[0.06] border border-white/[0.08] text-violet-300 px-1.5 py-0.5 rounded-md font-mono">v3.0</span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                {profile?.full_name || "Cloud Environment Workspace"}
              </p>
            </div>
          </div>
          
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.08] text-slate-300 hover:text-white transition-all duration-200 text-xs font-medium shadow-sm"
          >
            <LogOut className="w-3.5 h-3.5 text-slate-400" />
            Sign out
          </button>
        </div>
      </header>

      {/* Dashboard Canvas Container */}
      <div className="max-w-7xl mx-auto px-6 py-12 space-y-12 relative z-10">
        
        {/* Premium Hub Hero Segment */}
        <section className="relative overflow-hidden rounded-[20px] bg-gradient-to-b from-white/[0.03] to-transparent border border-white/[0.06] p-8 md:p-10 flex flex-col md:flex-row md:items-center justify-between min-h-[180px] shadow-2xl backdrop-blur-md">
          <div className="absolute inset-0 bg-gradient-to-tr from-violet-500/[0.03] via-transparent to-indigo-500/[0.02] pointer-events-none" />
          
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 px-2.5 py-0.5 rounded-full text-[11px] font-medium text-violet-300 font-mono">
              <Zap className="w-3 h-3" />
              <span>AI Pipeline Matrix Online</span>
            </div>
            <h2 className="text-3xl font-semibold tracking-tight text-white font-sans">
              Intelligent Sanctum Workspace
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed font-normal max-w-lg">
              Synchronize media pipelines, coordinate digital infrastructure, and manage ministry growth vectors powered by autonomous software agents.
            </p>
          </div>

          <div className="mt-6 md:mt-0 flex items-center gap-3.5 bg-neutral-950/40 border border-white/[0.05] p-3.5 rounded-2xl backdrop-blur-md min-w-[240px]">
            <div className="w-2 h-2 rounded-full bg-violet-300 shadow-md shadow-violet-300/50 animate-pulse" />
            <div className="text-left">
              <span className="text-[10px] block text-slate-500 font-mono tracking-wider uppercase">Active Operator</span>
              <span className="text-xs font-medium text-slate-300">{profile?.email || "System Authenticated"}</span>
            </div>
          </div>
        </section>

        {/* Integration Cluster - YouTube Control */}
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-1.5 h-4 bg-violet-500 rounded-full shadow-[0_0_8px_rgba(234,179,8,0.5)]" />
              <div>
                <h2 className="font-semibold text-sm tracking-wide text-white uppercase font-mono">Streaming Gateways</h2>
                <p className="text-xs text-slate-500 mt-0.5">Stream infrastructure links and ingest routes.</p>
              </div>
            </div>
            <div className="scale-95 origin-right">
              <YouTubeCreateMenu
                channelConnected={youtubeConnected}
                connectedChannelId={connectedChannel?.id}
                onChannelConnect={handleChannelConnect}
                onChannelDisconnect={handleChannelDisconnect}
              />
            </div>
          </div>

          {youtubeConnected && connectedChannel && (
            <div className="p-[1px] rounded-[20px] bg-gradient-to-b from-white/[0.08] to-transparent shadow-xl">
              <div className="bg-[#050a17]/95 rounded-[19px] p-2 backdrop-blur-2xl">
                <YouTubeChannelStats channel={connectedChannel} />
              </div>
            </div>
          )}
        </section>

        {/* Glassmorphic SaaS Module Grid */}
        <section className="space-y-4">
          <div className="flex items-center gap-2.5 border-b border-white/[0.06] pb-3">
            <div className="w-1.5 h-4 bg-violet-500 rounded-full shadow-[0_0_8px_rgba(234,179,8,0.5)]" />
            <h2 className="font-semibold text-sm tracking-wide text-white uppercase font-mono">System App Engines</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {modules.map((module) => {
              const Icon = module.icon;
              const isDisabled = module.title === "YouTube Studio" && !youtubeConnected;

              return (
                <button
                  key={module.title}
                  onClick={() => handleModuleClick(module.title)}
                  disabled={isDisabled}
                  className={`p-6 rounded-[20px] border text-left relative overflow-hidden transition-all duration-300 group ${
                    isDisabled
                      ? "border-white/[0.02] bg-white/[0.01] opacity-25 cursor-not-allowed"
                      : "bg-white/[0.02] hover:bg-white/[0.04] border-white/[0.05] hover:border-violet-500/30 hover:shadow-2xl hover:shadow-violet-500/[0.02] cursor-pointer hover:-translate-y-0.5"
                  }`}
                >
                  {/* Hover interactive inner gradient glow */}
                  {!isDisabled && (
                    <div className="absolute inset-0 bg-gradient-to-br from-violet-500/[0.02] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                  )}
                  
                  <div className="flex items-start justify-between mb-6 relative z-10">
                    <div className={`p-2.5 rounded-xl transition-all duration-300 ${
                      isDisabled 
                        ? "bg-white/[0.02] text-slate-600" 
                        : "bg-[#090e1a] border border-white/[0.06] text-violet-300 group-hover:text-indigo-300 group-hover:border-violet-500/20"
                    }`}>
                      <Icon className="w-4.5 h-4.5 transition-transform duration-300 group-hover:scale-105" />
                    </div>
                    {module.tag && (
                      <span className={`text-[9px] font-mono tracking-wider px-2 py-0.5 rounded-md border ${
                        module.tag.includes("AI") || module.tag === "Live"
                          ? "bg-violet-500/10 text-violet-300 border-violet-500/20" 
                          : "bg-white/[0.04] text-slate-400 border-white/[0.06]"
                      }`}>
                        {module.tag}
                      </span>
                    )}
                  </div>
                  
                  <div className="relative z-10 space-y-1.5">
                    <h3 className="font-medium text-sm text-white tracking-tight flex items-center justify-between">
                      <span>{module.title}</span>
                      {!isDisabled && <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-200 text-violet-300/80" />}
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed font-light">{module.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Automation Utility Slots */}
        <section className="space-y-4">
          <div className="flex items-center gap-2.5 border-b border-white/[0.06] pb-3">
            <div className="w-1.5 h-4 bg-violet-500 rounded-full shadow-[0_0_8px_rgba(234,179,8,0.5)]" />
            <h2 className="font-semibold text-sm tracking-wide text-white uppercase font-mono">Automation Infrastructure</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white/[0.02] border border-white/[0.06] p-1 rounded-[20px] shadow-lg backdrop-blur-md">
              <div className="p-1 bg-[#030712]/40 rounded-[19px]">
                <YouTubeDownloader />
              </div>
            </div>
            <div className="bg-white/[0.02] border border-white/[0.06] p-1 rounded-[20px] shadow-lg backdrop-blur-md">
              <div className="p-1 bg-[#030712]/40 rounded-[19px]">
                <YouTubeMetaExtractor />
              </div>
            </div>
          </div>
        </section>

        {/* Premium Digital Guild Grid */}
        <section className="space-y-4">
          <div className="flex items-center gap-2.5 border-b border-white/[0.06] pb-3">
            <div className="w-1.5 h-4 bg-violet-500 rounded-full shadow-[0_0_8px_rgba(234,179,8,0.5)]" />
            <h2 className="font-semibold text-sm tracking-wide text-white uppercase font-mono">Ecosystem Creators</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teamMembers.map((member) => {
              const Icon = member.icon;
              const profileInstance = teamProfiles[member.instagram];

              return (
                <a
                  key={member.name}
                  href={member.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-[20px] bg-white/[0.01] hover:bg-white/[0.03] border border-white/[0.05] hover:border-violet-500/20 p-6 transition-all duration-300 group hover:-translate-y-0.5 flex flex-col justify-between relative overflow-hidden shadow-xl"
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-violet-500/[0.01] to-transparent pointer-events-none" />
                  
                  <div>
                    <div className="flex items-center justify-between mb-5">
                      <div className="p-2.5 rounded-xl bg-[#090e1a] border border-white/[0.06] text-slate-400 group-hover:text-violet-300 group-hover:border-violet-500/20 transition-all">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/[0.03] border border-white/[0.06] text-[10px] font-mono text-slate-400 group-hover:text-violet-300 transition-colors">
                        <Instagram className="w-3 h-3 text-slate-500 group-hover:text-violet-300" />
                        <span>@{member.instagram}</span>
                      </div>
                    </div>
                    
                    <h3 className="font-medium text-base text-white tracking-tight group-hover:text-violet-300 transition-colors">
                      {member.name}
                    </h3>
                    
                    <div className="flex flex-wrap gap-1.5 mt-3 mb-6">
                      {member.roles.map((role) => (
                        <span 
                          key={role} 
                          className="text-[10px] bg-white/[0.03] text-slate-400 px-2 py-0.5 rounded-md border border-white/[0.04]"
                        >
                          {role}
                        </span>
                      ))}
                    </div>
                  </div>

                  {profileInstance && (
                    <div className="pt-4 border-t border-white/[0.05] grid grid-cols-2 gap-2 text-center font-mono">
                      <div className="bg-white/[0.01] border border-white/[0.04] p-2 rounded-xl">
                        <span className="block text-xs font-semibold text-slate-200 tracking-tight">{profileInstance.followers}</span>
                        <span className="text-[9px] text-slate-500 uppercase tracking-wider">Followers</span>
                      </div>
                      <div className="bg-white/[0.01] border border-white/[0.04] p-2 rounded-xl">
                        <span className="block text-xs font-semibold text-slate-200 tracking-tight">{profileInstance.posts}</span>
                        <span className="text-[9px] text-slate-500 uppercase tracking-wider">Posts</span>
                      </div>
                    </div>
                  )}
                </a>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
