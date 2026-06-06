
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
      { title: "Command Center — Warriors Media" },
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
    <main className="min-h-screen bg-[#090d16] text-slate-100 selection:bg-amber-500/30 overflow-x-hidden relative font-sans antialiased">
      {/* Brand Identity Warm Glow fields */}
      <div className="absolute top-[-10%] left-[-5%] w-[600px] h-[600px] bg-amber-500/[0.04] rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute top-[30%] right-[-10%] w-[500px] h-[500px] bg-yellow-600/[0.03] rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[10%] left-[10%] w-[600px] h-[600px] bg-amber-600/[0.03] rounded-full blur-[160px] pointer-events-none" />

      {/* Cyber Gold & Obsidian Header */}
      <header className="sticky top-0 z-50 border-b border-amber-500/10 bg-[#090d16]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 via-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/10 border border-yellow-300/20">
              <span className="font-black text-lg tracking-tighter text-neutral-950">W</span>
            </div>
            <div>
              <h1 className="font-black text-lg tracking-tight leading-none bg-gradient-to-r from-white via-amber-200 to-yellow-400 bg-clip-text text-transparent">
                WARRIORS MEDIA
              </h1>
              <p className="text-[10px] font-bold tracking-[0.2em] text-amber-400/90 uppercase mt-1">
                {profile?.full_name || "COMMAND CENTER"}
              </p>
            </div>
          </div>
          
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-900/80 hover:bg-neutral-800 border border-amber-500/20 text-amber-400 hover:text-amber-300 transition-all duration-300 text-xs font-bold shadow-md shadow-amber-500/[0.02]"
          >
            <LogOut className="w-3.5 h-3.5" />
            Logout
          </button>
        </div>
      </header>

      {/* Main Container Workspace */}
      <div className="max-w-7xl mx-auto px-6 py-10 space-y-12 relative z-10">
        
        {/* Brand Command Header Banner */}
        <section className="relative overflow-hidden rounded-[20px] bg-[#121824]/60 border border-amber-500/10 p-8 flex flex-col md:flex-row md:items-center justify-between min-h-[160px] shadow-xl">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500/[0.05] via-transparent to-transparent pointer-events-none" />
          
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 px-3 py-0.5 rounded-md text-[10px] font-bold text-amber-400 uppercase tracking-wider">
              <Sparkles className="w-3 h-3" />
              <span>System Core Online</span>
            </div>
            <h2 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
              Sanctuary Media Control Matrix
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-xl font-medium">
              Welcome to your workspace. Deploy AI engines, track stats, and manage social ecosystem pipelines under your brand identity framework.
            </p>
          </div>

          <div className="mt-4 md:mt-0 flex items-center gap-3 bg-neutral-950/60 border border-amber-500/10 p-3 rounded-xl">
            <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
            <div className="text-left">
              <span className="text-[9px] block text-slate-500 font-mono tracking-wider uppercase">Identity Profile</span>
              <span className="text-xs font-bold text-amber-200/90">{profile?.email || "Session Active"}</span>
            </div>
          </div>
        </section>

        {/* YouTube Core Integration Status */}
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-1 h-5 bg-amber-500 rounded-full" />
              <div>
                <h2 className="font-black text-base uppercase tracking-wider text-white">YouTube Integration</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {youtubeConnected ? "Array fully functional" : "Awaiting secure authorization"}
                </p>
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
            <div className="p-[1px] rounded-[20px] bg-gradient-to-r from-amber-500/20 to-yellow-500/10">
              <div className="bg-neutral-900/95 rounded-[19px] p-2">
                <YouTubeChannelStats channel={connectedChannel} />
              </div>
            </div>
          )}
        </section>

        {/* Rebuilt Premium Gold & Carbon Module Grid */}
        <section className="space-y-4">
          <div className="flex items-center gap-3 border-b border-slate-800/80 pb-3">
            <div className="w-1 h-5 bg-amber-500 rounded-full" />
            <h2 className="font-black text-base uppercase tracking-wider text-white">Ecosystem Modules</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {modules.map((module) => {
              const Icon = module.icon;
              const isDisabled = module.title === "Live Streaming" && !youtubeConnected;

              return (
                <button
                  key={module.title}
                  onClick={() => handleModuleClick(module.title)}
                  disabled={isDisabled}
                  className={`p-6 rounded-[20px] border transition-all duration-300 group relative overflow-hidden text-left ${
                    isDisabled
                      ? "border-neutral-900 bg-neutral-950/20 opacity-30 cursor-not-allowed"
                      : "bg-[#111622]/80 border-slate-800/80 hover:border-amber-500/30 hover:shadow-xl hover:shadow-amber-500/[0.02] cursor-pointer hover:-translate-y-1"
                  }`}
                >
                  {!isDisabled && (
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                  )}
                  
                  <div className="flex items-start justify-between mb-5 relative z-10">
                    <div className={`p-2.5 rounded-xl transition-colors duration-300 ${
                      isDisabled 
                        ? "bg-neutral-900 text-neutral-700" 
                        : "bg-neutral-950 border border-slate-800 text-amber-400/90 group-hover:text-yellow-400 group-hover:border-amber-500/40"
                    }`}>
                      <Icon className="w-5 h-5 transition-transform duration-300 group-hover:scale-105" />
                    </div>
                    {module.tag && (
                      <span className={`text-[9px] uppercase tracking-widest font-bold px-2 py-0.5 rounded border ${
                        module.tag.includes("AI") || module.tag.includes("LIVE")
                          ? "bg-amber-500/10 text-amber-400 border-amber-500/20" 
                          : "bg-neutral-950 text-slate-400 border-slate-800"
                      }`}>
                        {module.tag}
                      </span>
                    )}
                  </div>
                  
                  <div className="relative z-10 space-y-1">
                    <h3 className="font-bold text-sm text-white tracking-tight flex items-center justify-between">
                      <span>{module.title}</span>
                      {!isDisabled && <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-300 text-amber-400/70" />}
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed font-normal font-sans">{module.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Automation Utility Slots */}
        <section className="space-y-4">
          <div className="flex items-center gap-3 border-b border-slate-800/80 pb-3">
            <div className="w-1 h-5 bg-amber-500 rounded-full" />
            <h2 className="font-black text-base uppercase tracking-wider text-white">Automation Utilities</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-[#111622]/40 border border-slate-800/80 p-1 rounded-[20px] shadow-md">
              <div className="p-1 bg-neutral-950/20 rounded-[19px]">
                <YouTubeDownloader />
              </div>
            </div>
            <div className="bg-[#111622]/40 border border-slate-800/80 p-1 rounded-[20px] shadow-md">
              <div className="p-1 bg-neutral-950/20 rounded-[19px]">
                <YouTubeMetaExtractor />
              </div>
            </div>
          </div>
        </section>

        {/* Rebuilt Team Panel Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-3 border-b border-slate-800/80 pb-3">
            <div className="w-1 h-5 bg-amber-500 rounded-full" />
            <h2 className="font-black text-base uppercase tracking-wider text-white">Ecosystem Guild & Creators</h2>
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
                  className="rounded-[20px] bg-[#111622]/50 border border-slate-800/80 p-6 hover:border-amber-500/20 transition-all duration-300 group hover:-translate-y-0.5 flex flex-col justify-between relative overflow-hidden shadow-md"
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-amber-500/[0.01] to-transparent pointer-events-none" />
                  
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-2 rounded-xl bg-neutral-950 border border-slate-800 text-slate-400 group-hover:text-amber-400 group-hover:border-amber-500/20 transition-all">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-neutral-950 border border-slate-800 text-[10px] font-mono text-slate-400 group-hover:text-amber-400 transition-colors">
                        <Instagram className="w-3 h-3" />
                        <span>@{member.instagram}</span>
                      </div>
                    </div>
                    
                    <h3 className="font-bold text-base text-white tracking-tight group-hover:text-amber-400 transition-colors">
                      {member.name}
                    </h3>
                    
                    <div className="flex flex-wrap gap-1 mt-2.5 mb-5">
                      {member.roles.map((role) => (
                        <span 
                          key={role} 
                          className="text-[10px] font-medium bg-neutral-950 text-slate-400 px-2 py-0.5 rounded border border-slate-800/50"
                        >
                          {role}
                        </span>
                      ))}
                    </div>
                  </div>

                  {profileInstance && (
                    <div className="pt-4 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-center font-mono">
                      <div className="bg-neutral-950/40 p-2 rounded-xl border border-neutral-900">
                        <span className="block text-xs font-bold text-amber-200/90 tracking-tight">{profileInstance.followers}</span>
                        <span className="text-[9px] text-slate-500 uppercase tracking-wider">Followers</span>
                      </div>
                      <div className="bg-neutral-950/40 p-2 rounded-xl border border-neutral-900">
                        <span className="block text-xs font-bold text-amber-200/90 tracking-tight">{profileInstance.posts}</span>
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
