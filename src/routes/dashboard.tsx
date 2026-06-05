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
  if (title === "youtube") {
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

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl">Warriors Media</h1>
            <p className="text-xs text-muted-foreground uppercase tracking-widest">
              {profile?.full_name || "Welcome"}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-card transition text-sm font-medium"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-12">
        {/* YouTube Section */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-2xl">YouTube</h2>
              <p className="text-sm text-muted-foreground">
                {youtubeConnected ? "Channel Connected" : "Connect your YouTube channel"}
              </p>
            </div>
            <YouTubeCreateMenu
              channelConnected={youtubeConnected}
              connectedChannelId={connectedChannel?.id}
              onChannelConnect={handleChannelConnect}
              onChannelDisconnect={handleChannelDisconnect}
            />
          </div>

          {youtubeConnected && connectedChannel && (
            <YouTubeChannelStats channel={connectedChannel} />
          )}
        </section>

        {/* Modules Grid */}
        <section className="space-y-6">
          <h2 className="font-display text-2xl">Modules</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {modules.map((module) => {
              const Icon = module.icon;
              const isDisabled = module.title === "Live Streaming" && !youtubeConnected;

              return (
                <button
                  key={module.title}
                  onClick={() => handleModuleClick(module.title)}
                  disabled={isDisabled}
                  className={`p-6 rounded-xl border transition group ${
                    isDisabled
                      ? "border-border/50 bg-card/30 opacity-50 cursor-not-allowed"
                      : "border-border hover:border-[color:var(--gold)]/50 bg-card/40 hover:bg-card/60 cursor-pointer"
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 rounded-lg bg-[color:var(--gold)]/10 group-hover:bg-[color:var(--gold)]/20 transition">
                      <Icon className="w-5 h-5 text-[color:var(--gold)]" />
                    </div>
                    {module.tag && (
                      <span className="text-[7px] uppercase tracking-widest font-bold text-[color:var(--gold)] bg-[color:var(--gold)]/10 px-2 py-1 rounded">
                        {module.tag}
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-left mb-1">{module.title}</h3>
                  <p className="text-xs text-muted-foreground text-left">{module.desc}</p>
                </button>
              );
            })}
          </div>
        </section>

        {/* Tools Section */}
        <section className="space-y-6">
          <h2 className="font-display text-2xl">Tools</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <YouTubeDownloader />
            <YouTubeMetaExtractor />
          </div>
        </section>

        {/* Team Section */}
        <section className="space-y-6">
          <h2 className="font-display text-2xl">Team</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teamMembers.map((member) => {
              const Icon = member.icon;
              const profile = teamProfiles[member.instagram];

              return (
                <a
                  key={member.name}
                  href={member.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-6 rounded-xl border border-border bg-card/40 hover:bg-card/60 hover:border-[color:var(--gold)]/50 transition group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 rounded-lg bg-pink-500/10 group-hover:bg-pink-500/20 transition">
                      <Icon className="w-5 h-5 text-pink-500" />
                    </div>
                    <Instagram className="w-4 h-4 text-muted-foreground group-hover:text-pink-500 transition" />
                  </div>
                  <h3 className="font-bold mb-2">{member.name}</h3>
                  <div className="space-y-2 mb-4">
                    {member.roles.map((role) => (
                      <p key={role} className="text-xs text-muted-foreground">
                        {role}
                      </p>
                    ))}
                  </div>
                  {profile && (
                    <div className="pt-4 border-t border-border space-y-1 text-xs text-muted-foreground">
                      <p>
                        <span className="font-medium">{profile.followers}</span> followers
                      </p>
                      <p>
                        <span className="font-medium">{profile.posts}</span> posts
                      </p>
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
