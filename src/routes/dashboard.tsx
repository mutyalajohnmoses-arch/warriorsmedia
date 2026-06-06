
import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import {
  LogOut,
  Radio,
  Instagram,
  Facebook,
  Youtube,
  Tv,
  Network,
  Layers,
  Target,
  Clapperboard,
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
  Zap,
  CheckCircle2,
  XCircle,
  Activity,
  Calendar,
  BarChart3,
  ExternalLink,
  Play,
  Settings,
  Image as ImageIcon,
  Type,
  UploadCloud,
  Mail,
  Sliders
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getInstagramStats, getInstagramProfiles } from "@/lib/instagram.functions";
import { getConnectedYouTubeChannel } from "@/lib/youtube-persistence.functions";
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
      { title: "Matrix Hub — Warriors Media" },
      { name: "description", content: "Next-generation automation matrix for digital ministry pipelines." },
      { name: "referrer", content: "no-referrer" },
    ],
  }),
  component: Home,
});

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
];

export default function Home() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<{ full_name: string | null; email: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [teamProfiles, setTeamProfiles] = useState<Record<string, TeamProfile>>({});
  const [youtubeConnected, setYoutubeConnected] = useState(false);
  const [connectedChannel, setConnectedChannel] = useState<ConnectedYouTubeChannel | null>(null);

  // Streaming Gateways Configuration Mock State for UI Fidelity
  const streamingGateways = [
    { id: "yt", name: "YouTube Live", icon: Youtube, connected: true, isLive: false, lastStream: "2 days ago", analytics: "14.2k avg views", color: "text-red-400" },
    { id: "fb", name: "Facebook Live", icon: Facebook, connected: true, isLive: true, lastStream: "Streaming Now", analytics: "4.8k active reach", color: "text-blue-400" },
    { id: "ig", name: "Instagram Live", icon: Instagram, connected: true, isLive: false, lastStream: "5 days ago", analytics: "9.1k engagement", color: "text-pink-400" },
    { id: "obs", name: "OBS Studio", icon: Tv, connected: true, isLive: true, lastStream: "Connected via WS", analytics: "1080p60 fps • 6.2k kbps", color: "text-emerald-400" },
    { id: "rtmp", name: "RTMP Server", icon: Network, connected: true, isLive: false, lastStream: "1 week ago", analytics: "Ultra-low latency pipe", color: "text-amber-400" },
    { id: "restream", name: "Restream Mirror", icon: Layers, connected: false, isLive: false, lastStream: "Never", analytics: "Multi-destination link", color: "text-indigo-400" },
  ];

  // Re-architected Premium Automation Modules
  const automationHub = [
    { title: "AI Thumbnail Generator", icon: ImageIcon, desc: "Neural engine maps sermon context into high-click rate compositions.", tag: "Neural v4", metric: "CTR Opt: +14.2%" },
    { title: "AI Caption Generator", icon: Type, desc: "Generative contextual transcription semantic hooks across languages.", tag: "NLP Engine", metric: "Acc: 99.4%" },
    { title: "Auto Upload Engine", icon: UploadCloud, desc: "Automated distribution cross-pipelines directly from local render pipelines.", tag: "Sync Core", metric: "1.2gb/s Ingest" },
    { title: "WhatsApp Automation", icon: MessageCircle, desc: "Contextual transactional notifications & community micro-broadcast channels.", tag: "Webhooks", metric: "98% Open Rate" },
    { title: "Lead Generation Engine", icon: Target, desc: "Autonomous landing funnels analyzing user interactions and intent signals.", tag: "AI Agent", metric: "240 leads/wk" },
    { title: "Email Marketing Engine", icon: Mail, desc: "Synthesizes automated devotions customized around community metadata profiles.", tag: "CRM-Sync", metric: "Deliverability: 100%" },
    { title: "Social Media Scheduler", icon: Calendar, desc: "Matrix timeline queue orchestrating media assets across core platforms.", tag: "Cron Engine", metric: "48 Posts Active" },
  ];

  const fetchTeamProfilesServerFn = useServerFn(getInstagramProfiles);
  const getChannelFn = useServerFn(getConnectedYouTubeChannel);

  const refreshYouTubeChannel = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const channel = await getChannelFn({ data: { userId: session.user.id } });
    setYoutubeConnected(Boolean(channel));
    setConnectedChannel(channel ?? null);
  }, [getChannelFn]);

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate({ to: "/" }); return; }
      const { data } = await supabase.from("profiles").select("full_name, email").eq("id", session.user.id).maybeSingle();
      setProfile(data ?? { full_name: null, email: session.user.email ?? null });
      setLoading(false);
    };
    load();
    refreshYouTubeChannel();
  }, [navigate, refreshYouTubeChannel]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  return (
    <main className="min-h-screen bg-[#030712] text-slate-200 selection:bg-purple-500/30 overflow-x-hidden relative font-sans antialiased pb-24">
      {/* SaaS Ambient Glow System */}
      <div className="absolute top-[-10%] left-[15%] w-[900px] h-[600px] bg-gradient-to-br from-purple-600/[0.08] to-indigo-600/[0.03] rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute top-[35%] right-[-5%] w-[700px] h-[700px] bg-purple-500/[0.04] rounded-full blur-[180px] pointer-events-none" />
      <div className="absolute bottom-[10%] left-[-10%] w-[800px] h-[800px] bg-indigo-800/[0.03] rounded-full blur-[200px] pointer-events-none" />

      {/* Top Border Accent Accent Bar */}
      <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-purple-500/30 to-transparent absolute top-0 left-0 z-50" />

      {/* Navigation Header */}
      <header className="sticky top-0 z-50 border-b border-white/[0.04] bg-[#030712]/70 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-b from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/15 ring-1 ring-white/20">
              <Radio className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-semibold text-sm tracking-wider text-white uppercase font-mono">WARRIORS CORE</h1>
                <span className="text-[10px] bg-purple-500/10 border border-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded-md font-mono">v3.4-prod</span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">{profile?.full_name || "Infrastructure Workspace"}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.06] text-slate-300 hover:text-white transition-all text-xs font-medium shadow-sm">
            <LogOut className="w-3.5 h-3.5 text-slate-400" />
            Disconnect
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-12 space-y-16 relative z-10">
        
        {/* Workspace Greeting Status Banner */}
        <section className="relative overflow-hidden rounded-[20px] bg-gradient-to-b from-white/[0.03] to-transparent border border-white/[0.06] p-8 md:p-10 flex flex-col md:flex-row md:items-center justify-between min-h-[160px] shadow-2xl backdrop-blur-md">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 px-2.5 py-0.5 rounded-full text-[11px] font-medium text-purple-300 font-mono">
              <Zap className="w-3 h-3 text-purple-400" />
              <span>Network Pipelines Synchronized</span>
            </div>
            <h2 className="text-3xl font-semibold tracking-tight text-white font-sans">Automated Broadcasting Console</h2>
            <p className="text-sm text-slate-400 leading-relaxed max-w-lg">Orchestrate enterprise multi-casting streams and AI workflows from an integrated, military-grade Christian architecture network.</p>
          </div>
          <div className="mt-6 md:mt-0 flex items-center gap-4 bg-neutral-950/40 border border-white/[0.05] p-4 rounded-2xl backdrop-blur-md">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-md shadow-emerald-400 animate-pulse" />
            <div>
              <span className="text-[9px] block text-slate-500 font-mono tracking-widest uppercase">System Hook</span>
              <span className="text-xs font-mono text-purple-300 font-medium">{profile?.email || "matrix@warriors"}</span>
            </div>
          </div>
        </section>

        {/* 1. SECTION: REDESIGNED STREAMING GATEWAYS */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.06] pb-4">
            <div className="flex items-center gap-3">
              <div className="w-2 h-5 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full shadow-[0_0_12px_rgba(168,85,247,0.4)]" />
              <div>
                <h2 className="font-semibold text-base tracking-tight text-white uppercase font-mono">Streaming Gateways Network</h2>
                <p className="text-xs text-slate-400 mt-0.5">Live-edge encoding hubs, continuous ingestion configurations, and endpoints.</p>
              </div>
            </div>
            <div className="scale-95 origin-right">
              <YouTubeCreateMenu
                channelConnected={youtubeConnected}
                connectedChannelId={connectedChannel?.id}
                onChannelConnect={() => refreshYouTubeChannel()}
                onChannelDisconnect={() => setYoutubeConnected(false)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {streamingGateways.map((gateway) => {
              const Icon = gateway.icon;
              return (
                <div key={gateway.id} className="relative rounded-[20px] bg-gradient-to-b from-white/[0.03] to-white/[0.01] border border-white/[0.06] hover:border-purple-500/20 p-6 shadow-xl transition-all duration-300 group hover:-translate-y-1 backdrop-blur-md overflow-hidden">
                  {/* Subtle inner hover glow */}
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/[0.02] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                  
                  {/* Gateway Header */}
                  <div className="flex items-center justify-between mb-5 relative z-10">
                    <div className="flex items-center gap-3.5">
                      <div className="p-3 rounded-xl bg-neutral-950/60 border border-white/[0.06] group-hover:border-purple-500/30 transition-colors">
                        <Icon className={`w-6 h-6 ${gateway.color} transition-transform duration-300 group-hover:scale-105`} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm text-white tracking-wide">{gateway.name}</h3>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {gateway.connected ? (
                            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-mono bg-emerald-500/5 px-1.5 py-0.2 rounded">
                              <CheckCircle2 className="w-2.5 h-2.5" /> Pipeline Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 font-mono bg-white/[0.02] px-1.5 py-0.2 rounded">
                              <XCircle className="w-2.5 h-2.5" /> Disconnected
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Live Transmission Badge */}
                    {gateway.connected && (
                      <div className={`px-2.5 py-1 rounded-full border text-[9px] font-mono tracking-wider flex items-center gap-1.5 uppercase font-semibold ${
                        gateway.isLive 
                          ? "bg-rose-500/10 text-rose-400 border-rose-500/30 shadow-[0_0_8px_rgba(244,63,94,0.2)] animate-pulse" 
                          : "bg-white/[0.03] text-slate-400 border-white/[0.05]"
                      }`}>
                        <Activity className={`w-3 h-3 ${gateway.isLive ? "text-rose-400 animate-spin" : "text-slate-500"}`} />
                        <span>{gateway.isLive ? "LIVE" : "OFFLINE"}</span>
                      </div>
                    )}
                  </div>

                  {/* Micro Analytical Matrix Grid */}
                  <div className="grid grid-cols-2 gap-2.5 mb-5 font-mono text-[11px] relative z-10">
                    <div className="bg-neutral-950/40 border border-white/[0.03] rounded-xl p-2.5">
                      <span className="block text-[9px] uppercase tracking-wider text-slate-500">Last Broadcast</span>
                      <span className="text-slate-300 font-medium mt-0.5 block truncate">{gateway.lastStream}</span>
                    </div>
                    <div className="bg-neutral-950/40 border border-white/[0.03] rounded-xl p-2.5">
                      <span className="block text-[9px] uppercase tracking-wider text-slate-500">Live Analytics</span>
                      <span className="text-purple-300 font-medium mt-0.5 block truncate">{gateway.analytics}</span>
                    </div>
                  </div>

                  {/* Operational Quick Actions Container */}
                  <div className="pt-4 border-t border-white/[0.04] flex items-center justify-between relative z-10">
                    <button className="text-[11px] text-slate-400 group-hover:text-purple-300 font-medium flex items-center gap-1 transition-colors bg-white/[0.02] group-hover:bg-purple-500/10 px-3 py-1.5 rounded-lg border border-white/[0.04] group-hover:border-purple-500/20">
                      <Settings className="w-3 h-3" />
                      <span>Config Route</span>
                    </button>
                    {gateway.connected && (
                      <button className="text-[11px] font-medium text-white flex items-center gap-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 px-3 py-1.5 rounded-lg shadow-md transition-all shadow-purple-950/30">
                        <Play className="w-3 h-3 fill-current" />
                        <span>Initialize</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 2. SECTION: REDESIGNED PREMIUM AI AUTOMATION INFRASTRUCTURE */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 border-b border-white/[0.06] pb-4">
            <div className="w-2 h-5 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full shadow-[0_0_12px_rgba(168,85,247,0.4)]" />
            <div>
              <h2 className="font-semibold text-base tracking-tight text-white uppercase font-mono">AI Automation Infrastructure</h2>
              <p className="text-xs text-slate-400 mt-0.5">Autonomous neural nodes designed to parse datasets, scale engagement, and distribute digital products.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {automationHub.map((node, index) => {
              const NodeIcon = node.icon;
              return (
                <div key={index} className="group relative rounded-[20px] bg-gradient-to-b from-white/[0.02] to-transparent border border-white/[0.05] hover:border-purple-500/30 p-5 shadow-xl transition-all duration-300 flex flex-col justify-between hover:-translate-y-0.5 backdrop-blur-md overflow-hidden">
                  {/* Subtle top horizontal highlight glow line */}
                  <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-purple-500/0 group-hover:via-purple-500/40 to-transparent transition-all duration-500" />
                  
                  <div>
                    {/* Node Header Row */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 rounded-xl bg-[#090e1a] border border-white/[0.06] text-purple-400 group-hover:text-pink-400 group-hover:border-purple-500/20 transition-all duration-300">
                        <NodeIcon className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
                      </div>
                      <div className="flex flex-col items-end gap-1 font-mono">
                        <span className="text-[9px] font-medium px-2 py-0.5 rounded-md border bg-purple-500/5 text-purple-300 border-purple-500/15 tracking-wider">
                          {node.tag}
                        </span>
                      </div>
                    </div>

                    {/* Metadata Content Block */}
                    <div className="space-y-1.5">
                      <h3 className="font-semibold text-sm text-white tracking-tight flex items-center justify-between">
                        <span>{node.title}</span>
                        <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-200 text-purple-400" />
                      </h3>
                      <p className="text-xs text-slate-400 font-light leading-relaxed min-h-[50px]">{node.desc}</p>
                    </div>
                  </div>

                  {/* Micro Metric Banner Block */}
                  <div className="mt-5 pt-3.5 border-t border-white/[0.04] flex items-center justify-between text-[10px] font-mono text-slate-500">
                    <span className="flex items-center gap-1">
                      <Sliders className="w-3 h-3 text-slate-600" /> Engine Telemetry
                    </span>
                    <span className="text-emerald-400 bg-emerald-500/[0.06] px-2 py-0.5 rounded border border-emerald-500/10 font-semibold shadow-sm">
                      {node.metric}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Digital Ecosystem Creators Guild Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2.5 border-b border-white/[0.06] pb-3">
            <div className="w-1.5 h-4 bg-purple-500 rounded-full shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
            <h2 className="font-semibold text-sm tracking-wide text-white uppercase font-mono">Ecosystem Engineers</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {teamMembers.map((member) => {
              const Icon = member.icon;
              return (
                <a key={member.name} href={member.instagramUrl} target="_blank" rel="noopener noreferrer" className="rounded-[20px] bg-white/[0.01] hover:bg-white/[0.03] border border-white/[0.05] hover:border-purple-500/20 p-5 transition-all duration-300 group hover:-translate-y-0.5 flex flex-col justify-between relative overflow-hidden shadow-xl">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2.5 rounded-xl bg-[#090e1a] border border-white/[0.06] text-slate-400 group-hover:text-purple-400 transition-all">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/[0.03] border border-white/[0.06] text-[10px] font-mono text-slate-400 group-hover:text-purple-400">
                      <span>@{member.instagram}</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-medium text-sm text-white tracking-tight group-hover:text-purple-300 transition-colors">{member.name}</h3>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {member.roles.slice(0, 3).map((role) => (
                        <span key={role} className="text-[9px] bg-white/[0.03] text-slate-400 px-1.5 py-0.5 rounded border border-white/[0.04]">{role}</span>
                      ))}
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        </section>

      </div>
    </main>
  );
}
