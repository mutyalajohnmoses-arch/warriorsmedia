import { createFileRoute, useNavigate } from "@tanstack/react-router";
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
  LogIn
} from "lucide-react";

// కరెక్ట్ అలియాస్ పాత్ ఇంపోర్ట్
import { 
  generateLiveKitToken, 
  createYouTubeLivePipeline, 
  startLiveKitEgress, 
  stopLiveKitEgress 
} from "@/server/live-actions";

export const Route = createFileRoute("/live-streaming-setup")({
  component: LiveStreamingSetupPage,
});

function LiveStreamingSetupPage() {
  const navigate = useNavigate();

  // YouTube Setup States
  const [streamTitle, setStreamTitle] = useState("");
  const [streamDescription, setStreamDescription] = useState("");
  const [privacyStatus, setPrivacyStatus] = useState("public");
  const [googleToken, setGoogleToken] = useState<string | null>(null);

  // Connection Pipeline States
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

  // Server Functions Hooks
  const generateTokenFn = useServerFn(generateLiveKitToken);
  const createYouTubePipelineFn = useServerFn(createYouTubeLivePipeline);
  const startEgressFn = useServerFn(startLiveKitEgress);
  const stopEgressFn = useServerFn(stopLiveKitEgress);

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

  // Google OAuth తో లాగిన్ అవ్వడం (YouTube Live Scopes తో)
  const handleGoogleLogin = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          scopes: "https://www.googleapis.com/auth/youtube.force-ssl https://www.googleapis.com/auth/youtube.readonly",
          queryParams: { access_type: "offline", prompt: "consent" }
        },
      });
      if (error) throw error;
    } catch (err: any) {
      toast.error(`Google Login Failed: ${err.message}`);
    }
  };

  // Session నుండి Google Access Token ని ఎక్స్‌ట్రాక్ట్ చేయడం
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setGoogleToken(session.provider_token || null);
        const { data } = await supabase.from("profiles").select("full_name").eq("id", session.user.id).maybeSingle();
        if (data?.full_name) setParticipantName(data.full_name);
      }
    };
    checkSession();
  }, []);

  // LiveKit కి కనెక్ట్ అయ్యాక ఆటోమేటిక్‌గా Egress స్టార్ట్ చేసి YouTube కి పంపడం
  useEffect(() => {
    if (!room || !isConnected || !generatedRtmpUrl || currentEgressId || isEgressActive) return;

    const pipelineExecution = async () => {
      try {
        setIsConnecting(true);
        const tId = toast.loading("LiveKit Egress స్టార్ట్ అవుతోంది. YouTube కి కనెక్ట్ చేస్తున్నాము...");
        
        const res = await startEgressFn({
          data: { roomName: safeRoomName, youtubeRtmpUrl: generatedRtmpUrl }
        });

        if (res?.egressId) {
          setCurrentEgressId(res.egressId);
          setIsEgressActive(true);
          toast.success("SUCCESS: మీ స్ట్రీమ్ ఇప్పుడు YouTube Live లో నడుస్తోంది!", { id: tId });
        }
      } catch (err: any) {
        toast.error(`Egress pipeline failed: ${err.message}`);
      } finally {
        setIsConnecting(false);
      }
    };

    if (room.localParticipant?.isLocalTrackPublished) {
      pipelineExecution();
    } else {
      room.once(RoomEvent.LocalTrackPublished, () => {
        setTimeout(pipelineExecution, 1000);
      });
    }
  }, [isConnected, room, generatedRtmpUrl, safeRoomName, currentEgressId, isEgressActive]);

  useEffect(() => {
    if (liveKitToken && liveKitUrl && !isConnected) {
      connect();
    }
  }, [liveKitToken, liveKitUrl, isConnected, connect]);

  useEffect(() => {
    if (room && videoRef.current) {
      const localVideoPub = Array.from(room.localParticipant?.videoTrackPublications.values() ?? [])[0];
      const localVideoTrack = localVideoPub?.videoTrack;
      if (localVideoTrack) {
        localVideoTrack.attach(videoRef.current);
        return () => { if (videoRef.current) localVideoTrack.detach(videoRef.current); };
      }
    }
  }, [room, isCameraEnabled]);

  // COMPLETE PIPELINE FLOW TRIGGER
  const handleStartFullPipeline = async () => {
    if (!googleToken) {
      toast.error("దయచేసి మొదట Google తో లాగిన్ అవ్వండి.");
      return;
    }
    if (!streamTitle) {
      toast.error("Stream Title ఎంటర్ చేయండి.");
      return;
    }

    setIsConnecting(true);
    try {
      // STEP 1 & 2: YouTube లో Broadcast మరియు Stream ఆటోమేటిక్ గా క్రియేట్ చేసి RTMP పొందడం
      const ytId = toast.loading("YouTube Broadcast & Stream క్రియేట్ చేస్తున్నాము...");
      const ytPipeline = await createYouTubePipelineFn({
        data: { accessToken: googleToken, title: streamTitle, description: streamDescription, privacy: privacyStatus }
      });

      if (!ytPipeline?.youtubeRtmpUrl) {
        throw new Error("Could not fetch RTMP endpoints from YouTube API.");
      }
      setGeneratedRtmpUrl(ytPipeline.youtubeRtmpUrl);
      toast.success("YouTube RTMP URL విజయవంతంగా పొందింది!", { id: ytId });

      // STEP 3: LiveKit రూమ్ కోసం టోకెన్ తెచ్చుకోవడం
      const tokenResponse = await generateTokenFn({
        data: { roomName: safeRoomName, participantName },
      });

      if (tokenResponse?.token && tokenResponse?.url) {
        setLiveKitToken(tokenResponse.token);
        setLiveKitUrl(tokenResponse.url);
      }
    } catch (err: any) {
      toast.error(`Pipeline Failed: ${err.message}`);
      setIsConnecting(false);
    }
  };

  const handleStopPipeline = async () => {
    setIsConnecting(true);
    try {
      if (currentEgressId) {
        await stopEgressFn({ data: { egressId: currentEgressId } });
      }
    } catch (e) {
      console.error(e);
    }
    if (isConnected) {
      await disconnect();
    }
    setLiveKitToken(null);
    setLiveKitUrl(null);
    setCurrentEgressId(null);
    setGeneratedRtmpUrl(null);
    setIsEgressActive(false);
    setIsConnecting(false);
    toast.success("Streaming Studio Session Closed.");
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-[#f1f1f1] flex flex-col lg:flex-row p-6 gap-6">
      
      {/* LEFT: CONFIGURATION FORM */}
      <div className="w-full lg:w-5/12 bg-[#1f1f1f] border border-[#2f2f2f] rounded-xl p-6 shadow-2xl flex flex-col gap-4">
        <div className="flex items-center gap-2 border-b border-[#2f2f2f] pb-3">
          <Tv className="text-red-500 w-5 h-5" />
          <h2 className="text-lg font-bold tracking-wide">YouTube Live Automatons</h2>
        </div>

        {/* GOOGLE LOGIN STEP */}
        {!googleToken ? (
          <button
            onClick={handleGoogleLogin}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center gap-2 font-semibold text-sm transition"
          >
            <LogIn className="w-4 h-4" /> Step 1: Login with Google (YouTube Scopes)
          </button>
        ) : (
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-xs text-blue-400 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-blue-500 flex-shrink-0" />
            <span>Google Authentic Integration Active (Token Synchronized)</span>
          </div>
        )}

        <div>
          <label className="text-xs font-semibold text-gray-400 block mb-1">Stream Title (YouTube)</label>
          <div className="relative">
            <FileText className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Enter live video event title"
              className="w-full bg-[#121212] border border-[#333] rounded-lg pl-10 pr-4 py-2.5 text-sm focus:border-red-500 outline-none text-white"
              value={streamTitle}
              onChange={(e) => setStreamTitle(e.target.value)}
              disabled={isConnected}
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-400 block mb-1">Description</label>
          <textarea
            rows={3}
            placeholder="Describe what this live stream is about..."
            className="w-full bg-[#121212] border border-[#333] rounded-lg px-4 py-2 text-sm focus:border-red-500 outline-none resize-none text-white"
            value={streamDescription}
            onChange={(e) => setStreamDescription(e.target.value)}
            disabled={isConnected}
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-400 block mb-1">Privacy Visibility</label>
          <select
            className="w-full bg-[#121212] border border-[#333] rounded-lg px-3 py-2.5 text-sm text-gray-300 outline-none"
            value={privacyStatus}
            onChange={(e) => setPrivacyStatus(e.target.value)}
            disabled={isConnected}
          >
            <option value="public">🌐 Public (Everyone can view)</option>
            <option value="unlisted">🔗 Unlisted (Only via link)</option>
            <option value="private">🔒 Private (Only you can view)</option>
          </select>
        </div>

        {generatedRtmpUrl && (
          <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg">
            <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Auto-Generated Target Endpoints</p>
            <p className="text-xs text-red-400 font-mono break-all select-all">{generatedRtmpUrl}</p>
          </div>
        )}
      </div>

      {/* RIGHT: LIVE STUDIO MONITOR */}
      <div className="w-full lg:w-7/12 bg-[#1f1f1f] border border-[#2f2f2f] rounded-xl p-6 shadow-2xl flex flex-col gap-4 justify-between">
        <div className="flex items-center justify-between border-b border-[#2f2f2f] pb-3">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${isEgressActive ? "bg-red-500 animate-pulse" : "bg-gray-600"}`}></span>
            <span className="text-xs font-bold uppercase tracking-wider text-gray-300">
              {isEgressActive ? "LIVE TO YOUTUBE" : "STUDIO IDLE"}
            </span>
          </div>
        </div>

        <div className="relative aspect-video bg-black rounded-xl border border-[#2f2f2f] overflow-hidden flex items-center justify-center">
          {isConnecting && (
            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-10 gap-2 text-xs">
              <Loader2 className="animate-spin text-red-500 w-6 h-6" />
              <p className="text-gray-400 font-medium">Executing Pipeline: Creating YouTube Broadcast & LiveKit Egress...</p>
            </div>
          )}
          {isConnected && !isCameraEnabled && (
            <div className="absolute inset-0 bg-[#121212] flex flex-col items-center justify-center text-gray-500 text-xs gap-1">
              <VideoOff className="w-8 h-8" /> Camera Feed Suspended
            </div>
          )}
          {isConnected && isCameraEnabled && (
            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover"></video>
          )}
          {!isConnected && !isConnecting && (
            <div className="text-center text-gray-600 flex flex-col items-center gap-1.5 text-xs">
              <Radio className="w-10 h-10 text-[#2e2e2e]" />
              <p>Complete configurations to activate pipeline</p>
            </div>
          )}
        </div>

        <div className="flex justify-center gap-4">
          <button
            onClick={() => { toggleCameraTrack(!isCameraEnabled); setIsCameraEnabled(!isCameraEnabled); }}
            disabled={!isConnected}
            className={`p-3 rounded-full border transition ${isCameraEnabled ? "border-[#333] text-white" : "bg-red-600/20 border-red-500/40 text-red-500"}`}
          >
            {isCameraEnabled ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
          </button>
          <button
            onClick={() => { toggleMicTrack(!isMicEnabled); setIsMicEnabled(!isMicEnabled); }}
            disabled={!isConnected}
            className={`p-3 rounded-full border transition ${isMicEnabled ? "border-[#333] text-white" : "bg-red-600/20 border-red-500/40 text-red-500"}`}
          >
            {isMicEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
          </button>
        </div>

        <div>
          {!isConnected ? (
            <button
              onClick={handleStartFullPipeline}
              disabled={isConnecting || !googleToken || !streamTitle}
              className="w-full py-3.5 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 disabled:bg-gray-800 disabled:text-gray-500 flex items-center justify-center gap-2 transition uppercase tracking-wider"
            >
              <Radio className="w-4 h-4" /> Trigger Automation Pipeline
            </button>
          ) : (
            <button
              onClick={handleStopPipeline}
              className="w-full py-3.5 rounded-xl text-xs font-bold text-white bg-transparent border border-red-600/40 hover:bg-red-600/10 flex items-center justify-center gap-2 transition uppercase tracking-wider"
            >
              <PowerOff className="w-4 h-4 text-red-500" /> Disconnect Stream
            </button>
          )}
        </div>

        {error && (
          <div className="flex items-center p-2.5 rounded-lg bg-red-500/10 text-red-400 text-xs">
            <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
            <span>{error.message}</span>
          </div>
        )}
        {isEgressActive && (
          <div className="flex items-center p-2.5 rounded-lg bg-green-500/10 text-green-400 text-xs">
            <CheckCircle2 className="w-4 h-4 mr-2 flex-shrink-0" />
            <span>Egress Pipeline running! Data feeding directly into YouTube Live Control Room.</span>
          </div>
        )}
      </div>

    </div>
  );
        }
