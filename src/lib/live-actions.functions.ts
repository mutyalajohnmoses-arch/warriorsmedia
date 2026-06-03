
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useLiveKitRoom } from "@/hooks/useLiveKitRoom";
import { RoomEvent } from "livekit-client";
import { toast } from "sonner";
import {
  Video,
  Mic,
  MicOff,
  VideoOff,
  Loader2,
  Radio,
  PowerOff,
  AlertCircle,
  CheckCircle2,
  FileText,
  Tv,
  Link2,
  Image as ImageIcon,
  Upload,
  Sparkles,
  Wand2,
  Layers
} from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";

import {
  generateLiveKitToken,
  createYouTubeLivePipeline,
  startLiveKitEgress,
  stopLiveKitEgress,
  generateAIThumbnailServerFn // Real server function imported here
} from "@/lib/live-actions.functions";
import { getOrRefreshYouTubeToken } from "@/lib/youtube-token-manager.functions";

export const Route = createFileRoute("/live-streaming-setup")({
  component: LiveStreamingSetupPage,
});

function LiveStreamingSetupPage() {
  const navigate = useNavigate();

  // YouTube States
  const [streamTitle, setStreamTitle] = useState("");
  const [streamDescription, setStreamDescription] = useState("");
  const [privacyStatus, setPrivacyStatus] = useState("public");
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const [isYouTubeLinked, setIsYouTubeLinked] = useState<boolean>(false);
  const [isCheckingChannel, setIsCheckingChannel] = useState<boolean>(true);

  // Thumbnail States
  const [thumbnailMode, setThumbnailMode] = useState<"manual" | "ai">("manual");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [referenceFile, setReferenceFile] = useState<File | null>(null); // Optional AI reference image state
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [premiumError, setPremiumError] = useState<string | null>(null);
  const [freeAiPrompt, setFreeAiPrompt] = useState("");
  const [isGeneratingFree, setIsGeneratingFree] = useState(false);

  // Connection Pipelines
  const [isConnecting, setIsConnecting] = useState(false);
  const [isEgressActive, setIsEgressActive] = useState(false); 
  const [isCameraEnabled, setIsCameraEnabled] = useState(true);
  const [isMicEnabled, setIsMicEnabled] = useState(true);
  const [liveKitToken, setLiveKitToken] = useState<string | null>(null);
  const [liveKitUrl, setLiveKitUrl] = useState<string | null>(null);
  const [currentEgressId, setCurrentEgressId] = useState<string | null>(null);
  const [generatedRtmpUrl, setGeneratedRtmpUrl] = useState<string | null>(null);
  const [participantName, setParticipantName] = useState("Host");
  const videoRef = useRef<HTMLVideoElement>(null);

  const generateTokenFn = useServerFn(generateLiveKitToken);
  const createYouTubePipelineFn = useServerFn(createYouTubeLivePipeline);
  const startEgressFn = useServerFn(startLiveKitEgress);
  const stopEgressFn = useServerFn(stopLiveKitEgress);
  const generateAIThumbnailFn = useServerFn(generateAIThumbnailServerFn); // Hook initialization

  const safeRoomName = streamTitle ? `room-${streamTitle.toLowerCase().replace(/[^a-z0-9]/g, "-")}` : "live-studio-room";

  const { room, isConnected, error, connect, disconnect, toggleCameraTrack, toggleMicTrack } = useLiveKitRoom({
    url: liveKitUrl || "",
    token: liveKitToken || "",
    roomName: safeRoomName,
    onConnected: () => {
      toast.info("LiveKit Studio Connected. Launching Egress pipeline...");
    },
    onDisconnected: () => {
      setIsConnecting(false);
      setIsEgressActive(false);
      setCurrentEgressId(null);
      setGeneratedRtmpUrl(null);
    },
    onError: (err) => {
      setIsConnecting(false);
      toast.error(`Studio Error: ${err.message}`);
    },
  });

  const fetchYouTubeFn = useServerFn(getOrRefreshYouTubeToken);

  useEffect(() => {
    let cancelled = false;
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          if (!cancelled) setIsCheckingChannel(false);
          return;
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", session.user.id)
          .maybeSingle();
        if (profile?.full_name && !cancelled) setParticipantName(profile.full_name);

        const { data: channel } = await supabase
          .from("youtube_channels")
          .select("id, is_connected")
          .eq("user_id", session.user.id)
          .eq("is_connected", true)
          .maybeSingle();

        if (channel && !cancelled) {
          setIsYouTubeLinked(true);
          try {
            const tok = await fetchYouTubeFn({ data: { userId: session.user.id } });
            if (!cancelled) setGoogleToken(tok.access_token);
          } catch (err: any) {
            console.error("[live-streaming-setup] token fetch failed", err);
            if (!cancelled) {
              toast.error("YouTube token refresh failed. Please reconnect your channel from the dashboard.");
            }
          }
        }
      } finally {
        if (!cancelled) setIsCheckingChannel(false);
      }
    };
    checkSession();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!room || !isConnected || !generatedRtmpUrl || currentEgressId || isEgressActive) return;

    const pipelineExecution = async () => {
      try {
        setIsConnecting(true);
        const tId = toast.loading("Connecting live stream to YouTube...");
        
        const res = await start
