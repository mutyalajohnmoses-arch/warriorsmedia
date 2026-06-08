import { useNavigate, Link } from "@tanstack/react-router";
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

// lazyRouteComponent కోసం ఇక్కడ తప్పనిసరిగా default export ఉండాలి
export default function LiveStreamingSetupPage() {
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

  const isConnectedRef = useRef(false);

  // Client-only flag for execution safety
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);

  const stopLocalPreview = () => {
    if (typeof window === "undefined") return;

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

  const startLocalPreview = async () => {
    setPreviewError(null);
    
    if (typeof window === "undefined" || !navigator?.mediaDevices) {
      return;
    }

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

  // Prevent useLiveKitRoom hook execution context from failing on server side
  const { room, isConnected, connect, disconnect, toggleCameraTrack, toggleMicTrack } = useLiveKitRoom({
    url: isClient ? (liveKitUrl || "") : "",
    token: isClient ? (liveKitToken || "") : "",
    roomName: safeRoomName,
    onConnected: () => { toast.info("LiveKit Studio Connected. Launching Egress pipeline..."); },
    onDisconnected: () => {
      setIsConnecting(false);
      setIsEgressActive(false);
      setCurrentEgressId(null);
      setGeneratedRtmpUrl(null);
    },
    onError: (err: any) => {
      setIsConnecting(false);
      toast.error(err?.message || "LiveKit connection error");
    }
  });

  // If building on server, render clean placeholder to avoid hydration discrepancies
  if (!isClient) {
    return <div className="p-6 text-center text-muted-foreground">Loading Broadcasting Studio Matrix...</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-foreground">
      {/* Header Studio Controls */}
      <div className="flex justify-between items-center bg-card p-4 border rounded-xl shadow-sm">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-full ${isConnected ? 'bg-red-500/20 text-red-600 animate-pulse' : 'bg-muted text-muted-foreground'}`}>
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Advanced Broadcaster Studio</h1>
            <p className="text-xs text-muted-foreground">Multi-cam production control deck</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button 
            onClick={previewActive ? stopLocalPreview : startLocalPreview}
            className="flex items-center space-x-2 px-3 py-1.5 border rounded-lg text-sm font-medium transition hover:bg-muted bg-background cursor-pointer"
          >
            <Tv className="w-4 h-4" />
            <span>{previewActive ? "Turn Off Monitors" : "Initialize Monitors"}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Production Monitors & Studio Deck */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left/Center: Video Monitors & Scene Controls */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Preview Monitor */}
            <div className="border rounded-xl bg-black overflow-hidden relative shadow-md">
              <div className="absolute top-2 left-2 z-10 bg-green-600 text-white text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-sm shadow">
                Preview (Green Room)
              </div>
              <video ref={previewVideoRef} className="w-full aspect-video object-cover" />
              {!previewActive && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground bg-muted/20 backdrop-blur-xs">
                  <VideoOff className="w-8 h-8 mb-2 opacity-40" />
                  <span className="text-xs">Monitor offline</span>
                </div>
              )}
            </div>

            {/* Program Monitor */}
            <div className="border rounded-xl bg-black overflow-hidden relative shadow-md">
              <div className="absolute top-2 left-2 z-10 bg-red-600 text-white text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-sm shadow animate-pulse">
                Program (Live Feed)
              </div>
              <video ref={programVideoRef} className="w-full aspect-video object-cover" />
              {!previewActive && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground bg-muted/20 backdrop-blur-xs">
                  <VideoOff className="w-8 h-8 mb-2 opacity-40" />
                  <span className="text-xs">Monitor offline</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Audio/Video Hardware Check */}
          <div className="bg-card border rounded-xl p-4 flex flex-wrap gap-4 items-center justify-between">
            <div className="flex space-x-4">
              <div className="flex items-center space-x-1.5 text-xs">
                <span className={`w-2 h-2 rounded-full ${cameraReady ? 'bg-green-500' : 'bg-rose-400'}`} />
                <span className="text-muted-foreground">Camera Hardware: {cameraReady ? 'Ready' : 'Not Detected'}</span>
              </div>
              <div className="flex items-center space-x-1.5 text-xs">
                <span className={`w-2 h-2 rounded-full ${micReady ? 'bg-green-500' : 'bg-rose-400'}`} />
                <span className="text-muted-foreground">Audio Hardware: {micReady ? 'Ready' : 'Not Detected'}</span>
              </div>
            </div>
            
            {previewError && (
              <div className="flex items-center space-x-1 text-xs text-destructive bg-destructive/10 px-2 py-1 rounded">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{previewError}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar: Broadcast Settings Panel */}
        <div className="space-y-6">
          <div className="bg-card border rounded-xl p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground border-b pb-2">Stream Configuration</h3>
            
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium block mb-1">Broadcast Title</label>
                <input 
                  type="text" 
                  value={streamTitle}
                  onChange={(e) => setStreamTitle(e.target.value)}
                  placeholder="e.g., Sunday Worship Live Stream" 
                  className="w-full text-sm border rounded-lg px-3 py-2 bg-background focus:outline-hidden focus:ring-1 focus:ring-primary text-foreground"
                />
              </div>

              <div>
                <label className="text-xs font-medium block mb-1">Description</label>
                <textarea 
                  value={streamDescription}
                  onChange={(e) => setStreamDescription(e.target.value)}
                  placeholder="Provide details about your live broadcast..." 
                  rows={3}
                  className="w-full text-sm border rounded-lg px-3 py-2 bg-background focus:outline-hidden focus:ring-1 focus:ring-primary text-foreground resize-none"
                />
              </div>
            </div>

            <div className="pt-2">
              <button 
                disabled={!streamTitle || isConnecting}
                className="w-full flex items-center justify-center space-x-2 py-2.5 bg-primary text-primary-foreground font-medium rounded-lg text-sm transition hover:bg-primary/90 disabled:opacity-50 cursor-pointer"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Deploying Stream Matrix...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    <span>Go Live Now</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
