
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
      { title: "Home — Warriors Media" },
      { name: "description", content: "Your sanctuary of worship, community and Christian media." },
      { name: "referrer", content: "no-referrer" },
    ],
  }),
  component: Home,
});

const IG_USERNAME = "mutyala_john_moses";

// Kept completely primitive to pass TanStack route tree checks safely
const modules = [
  {
    icon: Radio,
    title: "Youtube",
    desc: "Live Streaming & Upload Videos & events in HD",
    tag: "LIVE NOW",
  },
  { icon: Instagram, title: "Instagram", desc: "Manage Instagram content & analytics", tag: "SOCIAL" },
  { icon: Facebook, title: "Facebook", desc: "Manage Facebook pages & audience engagement", tag: "SOCIAL" },
  { icon: Target, title: "Warriors Lead Engine", desc: "Generate and manage business leads", tag: "NEW" },
  { icon: Clapperboard, title: "Warriors AI Video Editor", desc: "AI-powered video editing & content creation", tag: "AI" },
  { icon: Music4, title: "Warriors AI Music", desc: "Create Christian songs and music with AI", tag: "AI" },
  {
    icon: MessageCircle,
    title: "WhatsApp",
    desc: "Chat with Community",
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
    if (title === "Youtube") {
      if (!youtubeConnected) {
        console.log("[Dashboard] Please connect YouTube channel first");
        return;
      }
      navigate({ to: "/live-streaming-setup" });
    } else if (title === "Instagram") {
      navigate({ to: "/instagram" });
    }
  };

  const fetchIg = useServerFn(getInstagramStats);
  const fetchTeamProfilesServerFn = useServerFn(getInstagramProfiles);
  const getChannelFn = useServerFn(getConnectedYouTubeChannel);

  const refreshYouTubeChannel = useCallback(
    async (reason: string) => {
      console.log("[Dashboard] Refreshing YouTube channel state", { reason });
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        console.log("[Dashboard] No Supabase session while refreshing YouTube channel");
        setYoutubeConnected(false);
        setHasYouTubeChannel(false);
        setConnectedChannel(null);
        return null;
      }

      console.log("[Dashboard] Calling getConnectedYouTubeChannel", {
        userId: session.user.id,
        reason,
      });
      const channel = await getChannelFn({ data: { userId: session.user.id } });
      console.log("[Dashboard] getConnectedYouTubeChannel returned", {
        found: Boolean(channel),
        channelId: channel?.channel_id,
        dbChannelId: channel?.id,
        title: channel?.title,
        reason,
      });

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
    console.log("[Dashboard] Channel connected callback received", {
      channelId: channelInfo?.channelId,
      title: channelInfo?.title,
    });
    setYoutubeConnected(true);
    setHasYouTubeChannel(true);
    refreshYouTubeChannel("connect-callback").catch((error) => {
      console.error("[Dashboard] Error refreshing YouTube connection:", error);
    });
  };

  const handleChannelDisconnect = () => {
    console.log("[Dashboard] Channel disconnected callback received");
    setYoutubeConnected(false);
    setHasYouTubeChannel(false);
    setConnectedChannel(null);
  };

  // Helper inside component scope to supply distinct luxury color patterns safely
  const getModuleStyles = (title: string) => {
    switch (title) {
      case "Youtube": return { gradient: "from-blue-500/10 to-indigo-500/5", glow: "hover:shadow-[0_0_30px_-5px_rgba(37,99,235,0.2)]" };
      case "Instagram": return { gradient: "from-pink-500/10 to-purple-500/5", glow: "hover:shadow-[0_0_30px_-5px_rgba(139,92,246,0.2)]" };
      case "Facebook": return { gradient: "from-blue-600/10 to-cyan-500/5", glow: "hover:shadow-[0_0_30px_-5px_rgba(37,99,235,0.15)]" };
      case "Warriors Lead Engine": return { gradient: "from-amber-500/10 to-orange-500/5", glow: "hover:shadow-[0_0_30px_-5px_rgba(251,191,36,0.2)]" };
      case "Warriors AI Video Editor": return { gradient: "from-purple-500/10 to-blue-500/5", glow: "hover:shadow-[0_0_30px_-5px_rgba(139,92,246,0.3)]" };
      case "Warriors AI Music": return { gradient: "from-indigo-500/10 to-purple-500/5", glow: "hover:shadow-[0_0_30px_-5px_rgba(139,92,246,0.3)]" };
      default: return { gradient: "from-emerald-500/10 to-teal-500/5", glow: "hover:shadow-[0_0_30px_-5px_rgba(16,185,129,0.15)]" };
    }
  };

  return (
    <main className="min-h-screen bg-[#020617] text-white selection:bg-blue-500/30 overflow-x-hidden relative font-sans antialiased">
      {/* Luxury Background Ambient Lighting */}
      <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute top-[20%] right-[-5%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[5%] left-[15%] w-[700px] h-[700px] bg-amber-500/5 rounded-full blur-[180px] pointer-events-none" />

      {/* Premium Glass Header */}
      <header className="sticky top-0 z-50 border-b border-slate-800/60 bg-[#020617]/70 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <span className="font-black text-lg tracking-tighter text-white">W</span>
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight leading-none bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                WARRIORS MEDIA
              </h1>
              <p className="text-[10px] font-semibold tracking-[0.25em] text-purple-400 uppercase mt-1">
                {profile?.full_name || "COMMAND CENTER"}
              </p>
            </div>
          </div>
          
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800/80 text-slate-300 hover:text-white transition-all duration-300 text-xs font-semibold tracking-wide shadow-md"
          >
            <LogOut className="w-3.5 h-3.5 text-slate-400" />
            Logout
          </button>
        </div>
      </header>

      {/* Main Panel Content Area */}
      <div className="max-w-7xl mx-auto px-6 py-10 space-y-12 relative z-10">
        
        {/* Dynamic Welcome Premium Command Box */}
        <section className="relative overflow-hidden rounded-[24px] bg-[#0F172A]/40 backdrop-blur-xl border border-slate-800/80 p-8 flex flex-col md:flex-row md:items-center justify-between min-h-[180px] shadow-2xl transition-all duration-500 ease-out">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/5 to-transparent pointer-events-none" />
          <div className="absolute right-[20%] top-0 bottom-0 w-[120px] bg-gradient-to-r from-white/0 via-white/[0.015] to-white/0 transform -skew-x-12 pointer-events-none" />
          
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 px-3 py-1 rounded-full text-[10px] font-bold text-blue-300 uppercase tracking-widest">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>Ecosystem Operational</span>
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              Sanctuary Media Control Matrix
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-xl">
              Welcome to your premium Christian Media hub. Deploy AI production engines, inspect cross-platform outreach arrays, and monitor system diagnostics seamlessly.
            </p>
          </div>

          <div className="mt-4 md:mt-0 flex items-center gap-3 bg-slate-950/40 border border-slate-800/60 p-3.5 rounded-xl">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <div className="text-left">
              <span className="text-[10px] block text-slate-500 font-mono tracking-wider uppercase">Identity Verified</span>
              <span className="text-xs font-semibold text-slate-300">{profile?.email || "Session Active"}</span>
            </div>
          </div>
        </section>

        {/* YouTube Integration Status Box */}
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-4 bg-blue-500 rounded-full" />
                <h2 className="font-bold text-lg tracking-tight text-white">YouTube Integration</h2>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {youtubeConnected ? "Streaming array established" : "Awaiting secure OAuth authorization"}
              </p>
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
            <div className="p-1 rounded-[24px] bg-gradient-to-r from-blue-500/20 to-purple-500/20 transition-all duration-300">
              <div className="bg-[#111827]/95 backdrop-blur-xl rounded-[23px] p-2">
                <YouTubeChannelStats channel={connectedChannel} />
              </div>
            </div>
          )}
        </section>

        {/* Modules Layout Grid Component */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800/60 pb-3">
            <div className="w-1.5 h-4 bg-purple-500 rounded-full" />
            <h2 className="font-bold text-lg tracking-tight text-white">Ecosystem Modules</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {modules.map((module) => {
              const Icon = module.icon;
              const isDisabled = module.title === "Live Streaming" && !youtubeConnected;
              const styleConfig = getModuleStyles(module.title);

              return (
                <button
                  key={module.title}
                  onClick={() => handleModuleClick(module.title)}
                  disabled={isDisabled}
                  className={`p-6 rounded-[24px] backdrop-blur-xl border transition-all duration-500 group relative overflow-hidden text-left ${
                    isDisabled
                      ? "border-slate-900 bg-slate-950/20 opacity-40 cursor-not-allowed"
                      : `bg-[#111827]/60 border-slate-800/60 hover:border-slate-700/80 ${styleConfig.glow} cursor-pointer hover:-translate-y-1`
                  }`}
                >
                  {!isDisabled && (
                    <div className={`absolute inset-0 bg-gradient-to-br ${styleConfig.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none`} />
                  )}
                  
                  <div className="flex items-start justify-between mb-5 relative z-10">
                    <div className={`p-3 rounded-xl transition-colors duration-300 ${
                      isDisabled 
                        ? "bg-slate-900 text-slate-600" 
                        : "bg-slate-950/80 border border-slate-800/80 text-blue-400 group-hover:text-purple-400 group-hover:border-purple-500/30"
                    }`}>
                      <Icon className="w-5 h-5 transition-transform duration-500 group-hover:scale-110" />
                    </div>
                    {module.tag && (
                      <span className={`text-[9px] uppercase tracking-widest font-bold px-2.5 py-1 rounded-md border ${
                        module.tag.includes("AI") 
                          ? "bg-purple-500/10 text-purple-400 border-purple-500/20" 
                          : "bg-slate-950/80 text-slate-400 border-slate-800"
                      }`}>
                        {module.tag}
                      </span>
                    )}
                  </div>
                  
                  <div className="relative z-10 space-y-1.5">
                    <h3 className="font-bold text-sm text-white tracking-tight flex items-center justify-between">
                      <span>{module.title}</span>
                      {!isDisabled && <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-300 text-slate-400" />}
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed font-normal">{module.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Automation Toolbox Cards Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800/60 pb-3">
            <div className="w-1.5 h-4 bg-amber-500 rounded-full" />
            <h2 className="font-bold text-lg tracking-tight text-white">Automation Utilities</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-[#111827]/40 backdrop-blur-xl border border-slate-800/60 p-1 rounded-[24px] shadow-xl">
              <div className="p-1 bg-slate-950/20 rounded-[23px]">
                <YouTubeDownloader />
              </div>
            </div>
            <div className="bg-[#111827]/40 backdrop-blur-xl border border-slate-800/60 p-1 rounded-[24px] shadow-xl">
              <div className="p-1 bg-slate-950/20 rounded-[23px]">
                <YouTubeMetaExtractor />
              </div>
            </div>
          </div>
        </section>

        {/* Community Guild Profile Grid */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800/60 pb-3">
            <div className="w-1.5 h-4 bg-emerald-500 rounded-full" />
            <h2 className="font-bold text-lg tracking-tight text-white">Ecosystem Guild & Creators</h2>
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
                  className="rounded-[24px] bg-[#111827]/40 backdrop-blur-xl border border-slate-800/60 p-6 hover:border-slate-700/80 transition-all duration-300 group hover:-translate-y-0.5 flex flex-col justify-between relative overflow-hidden shadow-lg hover:shadow-[0_0_30px_-10px_rgba(139,92,246,0.15)]"
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-purple-500/[0.02] to-transparent pointer-events-none" />
                  
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 text-slate-400 group-hover:text-purple-400 group-hover:border-purple-500/20 transition-all">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-950 border border-slate-800 text-[10px] font-mono text-slate-400 group-hover:text-pink-400 transition-colors">
                        <Instagram className="w-3 h-3" />
                        <span>@{member.instagram}</span>
                      </div>
                    </div>
                    
                    <h3 className="font-bold text-base text-white tracking-tight group-hover:text-blue-400 transition-colors">
                      {member.name}
                    </h3>
                    
                    <div className="flex flex-wrap gap-1.5 mt-2.5 mb-5">
                      {member.roles.map((role) => (
                        <span 
                          key={role} 
                          className="text-[10px] font-medium bg-slate-900 text-slate-400 px-2.5 py-0.5 rounded-md border border-slate-800/60"
                        >
                          {role}
                        </span>
                      ))}
                    </div>
                  </div>

                  {profileInstance && (
                    <div className="pt-4 border-t border-slate-800/60 grid grid-cols-2 gap-2 text-center font-mono">
                      <div className="bg-slate-950/50 p-2 rounded-xl border border-slate-900">
                        <span className="block text-xs font-bold text-white tracking-tight">{profileInstance.followers}</span>
                        <span className="text-[9px] text-slate-500 uppercase tracking-wider">Followers</span>
                      </div>
                      <div className="bg-slate-950/50 p-2 rounded-xl border border-slate-900">
                        <span className="block text-xs font-bold text-white tracking-tight">{profileInstance.posts}</span>
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
