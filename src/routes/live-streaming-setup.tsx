
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
  Layers,
  Plus,
  Trash2,
  Monitor,
  Sliders,
  Maximize2,
  Play,
  Square,
  Volume2,
  VolumeX,
  Grid
} from "lucide-react";


import {
  generateLiveKitToken,
  createYouTubeLivePipeline,
  startLiveKitEgress,
  stopLiveKitEgress,
  generateAIThumbnailServerFn
} from "@/lib/live-actions.functions";
import { getOrRefreshYouTubeToken } from "@/lib/youtube-token-manager.functions";

export const Route = createFileRoute("/live-streaming-setup")({
  component: LiveStreamingSetupPage,
});

// Types for Multi-Camera Setup
interface CameraSource {
  id: string;
  name: string;
  type: "Webcam" | "External USB" | "Virtual Camera" | "Screen Share" | "Browser" | "Video File";
  deviceId: string;
  enabled: boolean;
  muted: boolean;
  volume: number;
}

interface Scene {
  id: string;
  name: string;
  sourceIds: string[];
}

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
  const [referenceFile, setReferenceFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

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
  
  // Dedicated Video Elements Refs for Multi-Cam Layout
  const videoRef = useRef<HTMLVideoElement>(null);
  const previewVideoRef = useRef<HTMLVideoElement>(null);
  const programVideoRef = useRef<HTMLVideoElement>(null);

  // Local preview (independent of LiveKit/YouTube)
  const localStreamRef = useRef<MediaStream | null>(null);
  const [previewActive, setPreviewActive] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [micReady, setMicReady] = useState(false);
  const [permissionsGranted, setPermissionsGranted] = useState(false);

  // --- NEW ADVANCED STUDIO STATES ---
  const [sources, setSources] = useState<CameraSource[]>([
    { id: "cam-1", name: "Main Camera", type: "Webcam", deviceId: "default", enabled: true, muted: false, volume: 80 }
  ]);
  const [activePreviewSource, setActivePreviewSource] = useState<string>("cam-1");
  const [activeProgramSource, setActiveProgramSource] = useState<string>("cam-1");
  
  const [scenes, setScenes] = useState<Scene[]>([
    { id: "sc-1", name: "Main Camera", sourceIds: ["cam-1"] },
    { id: "sc-2", name: "Worship Camera", sourceIds: [] },
    { id: "sc-3", name: "Stage Camera", sourceIds: [] },
    { id: "sc-4", name: "Speaker Camera", sourceIds: [] },
    { id: "sc-5", name: "Screen Share", sourceIds: [] },
    { id: "sc-6", name: "Multi View", sourceIds: ["cam-1"] },
  ]);
  const [activeScene, setActiveScene] = useState<string>("sc-1");

  const [transitionType, setTransitionType] = useState("Fade");
  const [transitionDuration, setTransitionDuration] = useState("500ms");
  const [customDuration, setCustomDuration] = useState("500");
  const [multiviewLayout, setMultiviewLayout] = useState<"2" | "4" | "6" | "9">("4");
  
  const [isRecording, setIsRecording] = useState(false);
  const [isNoiseSuppression, setIsNoiseSuppression] = useState(true);
  const [newSourceName, setNewSourceName] = useState("");
  const [newSourceType, setNewSourceType] = useState<CameraSource["type"]>("Webcam");

  const stopLocalPreview = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    if (videoRef.current && !isConnectedRef.current) videoRef.current.srcObject = null;
    if (previewVideoRef.current) previewVideoRef.current.srcObject = null;
    if (programVideoRef.current) programVideoRef.current.srcObject = null;
    setPreviewActive(false);
    setCameraReady(false);
    setMicReady(false);
  };

  const isConnectedRef = useRef(false);

  const startLocalPreview = async () => {
    setPreviewError(null);
    try {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
        localStreamRef.current = null;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true,
      });
      localStreamRef.current = stream;
      setCameraReady(stream.getVideoTracks().length > 0);
      setMicReady(stream.getAudioTracks().length > 0);
      setPermissionsGranted(true);
      
      // Load Stream into Preview, Program and Main monitors
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
        try { await videoRef.current.play(); } catch {}
      }
      if (previewVideoRef.current) {
        previewVideoRef.current.srcObject = stream;
        try { await previewVideoRef.current.play(); } catch {}
      }
      if (programVideoRef.current) {
        programVideoRef.current.srcObject = stream;
        try { await programVideoRef.current.play(); } catch {}
      }
      setPreviewActive(true);
    } catch (err: any) {
      console.error("[LocalPreview] getUserMedia failed", err);
      let msg = "Failed to start preview.";
      if (err?.name === "NotAllowedError") msg = "Permission denied. Please grant access in your browser.";
      else if (err?.name === "NotFoundError") msg = "No camera or microphone found.";
      else if (err?.message) msg = err.message;
      setPreviewError(msg);
      setPreviewActive(false);
    }
  };

  const generateTokenFn = useServerFn(generateLiveKitToken);
  const createYouTubePipelineFn = useServerFn(createYouTubeLivePipeline);
  const startEgressFn = useServerFn(startLiveKitEgress);
  const stopEgressFn = useServerFn(stopLiveKitEgress);
  const generateAIThumbnailFn = useServerFn(generateAIThumbnailServerFn);

  const safeRoomName = streamTitle ? `room-${streamTitle.toLowerCase().replace(/[^a-z0-9]/g, "-")}` : "live-studio-room";

  const { room, isConnected, connect, disconnect, toggleCameraTrack, toggleMicTrack } = useLiveKitRoom({
    url: liveKitUrl || "",
    token: liveKitToken || "",
    roomName: safeRoomName,
    onConnected: () => { toast.info("LiveKit Studio Connected. Launching Egress pipeline..."); },
    onDisconnected: () => {
      setIsConnecting(false);
      setIsEgressActive(false);
      setCurrentEgressId(null);
      setGeneratedRtmpUrl(null);
    },
    onError: (err) => {
      setIsConnecting(false);
      toast.error(
