
import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import {
  LogOut,
  Radio,
  Instagram,
  Facebook,
  Target,
  Clapperboard,
  Music4,
  MessageCircle,
  Sparkles,
  Music,
  Headphones,
  Mic,
  Palette,
  Camera,
  ArrowUpRight,
  ShieldCheck,
  Zap,
  LayoutGrid,
  Search,
  Bell,
  Sliders,
  Cpu,
  Tv,
  Workflow,
  BarChart3,
  TrendingUp,
  UserCheck,
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
    tag: "Live Ingest",
  },
  { icon: Instagram, title: "Instagram Core", desc: "Automate social content workflows and audience pipelines.", tag: "Graph API" },
  { icon: Facebook, title: "Facebook Graph", desc: "Sync platform engagements and scale reach across metadata channels.", tag: "Social" },
  { icon: Target, title: "Warriors Lead Engine", desc: "AI optimization engine engineered to optimize ministry outreach.", tag: "Next-Gen AI" },
  { icon: Clapperboard, title: "AI Video Editor", desc: "Intelligent auto-cuts, smart captions, and semantic timeline rendering.", tag: "Timeline Engine" },
  { icon: Music4, title: "AI Worship Music", desc: "Synthesize instrumental orchestrations and sacred arrangements.", tag: "Synth Engine" },
  {
    icon: MessageCircle,
    title: "WhatsApp Core",
    desc: "Seamless contextual automation hooks for community management.",
    tag: "Beta Router",
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
    <main className="min-h-screen bg-[#030712] text-slate-200 selection:bg-purple-500/30 overflow-x-hidden relative font-sans antialiased">
      {/* High-End Ambient Aurora Lighting Fields */}
      <div className="absolute top-[-25%] left-[-10%] w-[1000px] h-[600px] bg-gradient-to-br from-purple-600/15 via-indigo-600/5 to-transparent rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute top-[30%] right-[-15%] w-[800px] h-[800px] bg-purple-500/[0.03] rounded-full blur-[180px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[15%] w-[900px] h-[700px] bg-indigo-500/[0.04] rounded-full blur-[200px] pointer-events-none" />

      {/* Futuristic Grid Overlay Pattern to mimic OS Matrix */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff02_1px,transparent_1px),linear-gradient(to_bottom,#ffffff02_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_at_center,transparent_20%,#000_100%)] pointer-events-none" />

      {/* Linear Style Global Top Boundary Line */}
      <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-purple-500/40 to-transparent absolute top-0 left-0 z-50" />

      {/* Premium Vercel-Style Nav Header */}
      <header className="sticky top-0 z-50 border-b border-white/[0.04] bg-[#030712]/75 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-b from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/20 ring-1 ring-white/10 group relative overflow-hidden">
              <div className="absolute inset-0 bg-white/10 opacity
