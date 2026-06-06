
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
  Sliders,
  ShieldCheck,
  User,
  Globe
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
    { id: "obs", name: "OBS Studio", icon: Tv, connected: true, isLive: true, lastStream: "Connected via WS", analytics: "1080p60 fps • 6
