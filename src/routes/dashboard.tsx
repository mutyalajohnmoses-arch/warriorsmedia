
import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
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
      { title: "Command Center — Warriors Media" },
      { name: "description", content: "Your premium sanctuary of worship, creative production, and Kingdom AI engineering." },
      { name: "referrer", content: "no-referrer" },
    ],
  }),
  component: Home,
});

const IG_USERNAME = "mutyala_john_moses";

// Removed structural Framer configurations from global scope to prevent split-bundling failure
const modules = [
  {
    icon: Radio,
    title: "Youtube",
    desc: "Live Streaming & Upload Videos & events in HD",
    tag: "LIVE NOW",
    gradient: "from-blue-500/10 to-indigo-500/5",
    borderGlow: "hover:shadow-[0_0_30px_-5px_rgba(37,99,235,0.2)]",
  },
  { 
    icon: Instagram, 
    title: "Instagram", 
    desc: "Manage Instagram content & analytics", 
    tag: "SOCIAL",
    gradient: "from-pink-500/10 to-purple-500/5",
    borderGlow: "hover:shadow-[0_0_30px_-5px_rgba(139,92,246,0.2)]",
  },
  { 
    icon: Facebook, 
    title: "Facebook", 
    desc: "Manage Facebook pages & audience engagement", 
    tag: "SOCIAL",
    gradient: "from-blue-600/10 to-cyan-500/5",
    borderGlow: "hover:shadow-[0_0_30px_-5px_rgba(37,99,235,0.15)]",
  },
  { 
    icon: Target, 
    title: "Warriors Lead Engine", 
    desc: "Generate and manage business leads", 
    tag: "NEW",
    gradient: "from-amber-500/10 to-orange-500/5",
    borderGlow: "hover:shadow-[0_0_30px_-5px_rgba(251,191,36,0.2)]",
  },
  { 
    icon: Clapperboard, 
    title: "Warriors AI Video Editor", 
    desc: "AI-powered video editing & content creation", 
    tag: "AI ENGINE",
    gradient: "from-purple-500/10 to-blue-500/5",
    borderGlow: "hover:shadow-[0_0_30px_-5px_rgba(139,92,246,0.3)]",
  },
  { 
    icon: Music4, 
    title: "Warriors AI Music", 
    desc: "Create Christian songs and music with AI", 
    tag: "AI ENGINE",
    gradient: "from-indigo-500/10 to-purple-500/5",
    borderGlow: "hover:shadow-[0_0_30px_-5px_rgba(139,92,246,0.3)]",
  },
  {
    icon: MessageCircle,
    title: "WhatsApp",
    desc: "Chat with Community",
    tag: "BETA",
    gradient: "from-emerald-500/10 to-teal-500/5",
    borderGlow: "hover:shadow-[0_0_30px_-5px_rgba(16,185,129,0.15)]",
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
    roles
