
import { createFileRoute, useSearch, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useLiveKitRoom } from "@/hooks/useLiveKitRoom";
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
  Image as ImageIcon,
  Tv,
  Key
} from "lucide-react";

/**
 * ============================================================================
 * LIVEKIT SERVER FUNCTIONS (TanStack Server Boundary)
 * ============================================================================
 */
import { createServerFn } from "@tanstack/react-start";
import { AccessToken, EgressClient, RoomCompositeEgressRequest } from "livekit-server-sdk";

function validateLiveKitEnv() {
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  const url = process.env.LIVEKIT_URL;

  if (!apiKey || !apiSecret || !url) {
    throw new Error("Missing LiveKit Environment variables on server side.");
  }
  return { apiKey, apiSecret, url };
}

// 1. Server Function to generate WebRTC token to join LiveKit Room
export const generateLiveKitToken = createServerFn({ method: "POST" })
  .inputValidator((data: any) => {
    if (!data?.roomName || !data?.participantName) throw new Error("Room & Participant Name required");
    return data;
  })
  .handler(async ({ data }) => {
    try {
      const { apiKey, apiSecret, url } = validateLiveKitEnv();
      const token = new AccessToken(apiKey, apiSecret, {
        identity: data.participantName,
        name: data.participantName,
      } as any);
      
      (token as any).addGrant({
        room: data.roomName,
        roomJoin: true,
        canPublish: true,
        canSubscribe: true,
      });

      return { token: await token.toJwt(), url, roomName: data.roomName };
    } catch (error: any) {
      throw new Error(error.message || "Failed to generate LiveKit token");
    }
  });

// 2. Server Function to trigger the Egress pipeline to YouTube RTMP endpoint (CRITICAL FIX)
export const startLiveKitEgress = createServerFn({ method: "POST" })
  .inputValidator((data: any) => {
    if (!data?.roomName || !data?.youtubeStreamKey) throw new Error("Missing Room Name or Stream Key");
    return data;
  })
  .handler(async ({ data }) => {
    try {
      const { apiKey, apiSecret, url } = validateLiveKitEnv();
      const egressClient = new EgressClient(url, apiKey, apiSecret);
      const youtubeRtmpUrl = `rtmps://a.rtmp.youtube.com/live2/${data.youtubeStreamKey}`;

      const request = new RoomCompositeEgressRequest({
        roomName: data.roomName,
        output: { case: "rtmpOutput", value: { urls: [youtubeRtmpUrl] } } as any,
        options: {
          audioCodec: 1, // AAC
          videoCodec: 1, // H264
          width: 1280,
          height: 720,
          framerate: 30,
          audioBitrate: 128,
          videoBitrate: 2500,
        } as any,
      });

      const response = await (egressClient as any).startRoomCompositeEgress(request);
      return { egressId: response.egressId, status: response.status };
    } catch (error: any) {
      throw new Error(error.message || "LiveKit Egress failed to start");
    }
  });

// 3. Server Function to stop the YouTube stream safely
export const stopLiveKitEgress = createServerFn({ method: "POST" })
  .inputValidator((data: any) => {
    if (!data?.egressId) throw new Error("Egress ID is required");
    return data;
  })
  .handler(async ({ data }) => {
    try {
      const { apiKey, apiSecret, url } = validateLiveKitEnv();
      const egressClient = new EgressClient(url, apiKey, apiSecret);
      const response = await egressClient.stopEgress(data.egressId);
      return { egressId: response.egressId, status: response.status };
    } catch (error) {
      throw new Error("Failed to stop egress pipeline");
    }
  });

/**
 * ============================================================================
 * ROUTE COMPONENT (UI & CLIENT LOGIC)
 * ============================================================================
 */
export const Route = createFileRoute("/live-streaming-setup")({
  component: LiveStreamingSetupPage,
});

function LiveStreamingSetupPage() {
  const navigate = useNavigate();

  // YouTube Studio Input States (Matching Mobile Application layouts)
  const [streamTitle, setStreamTitle] = useState("");
  const [streamDescription, setStreamDescription] = useState("");
  const [youtubeStreamKey, setYoutubeStreamKey] = useState("");
  const [streamCategory, setStreamCategory] = useState("22");
  const [privacyStatus, setPrivacyStatus] = useState("public");
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);

  // Core Connection States
  const [isConnecting, setIsConnecting] = useState(false);
  const [isCameraEnabled, setIsCameraEnabled] = useState(true);
  const [isMicEnabled, setIsMicEnabled] = useState(true);
  const [liveKitToken, setLiveKitToken] = useState<string | null>(null);
  const [liveKitUrl, setLiveKitUrl] = useState<string | null>(null);
  const [currentEgressId, setCurrentEgressId] = useState<string | null>(null);
  const [participantName, setParticipantName] = useState("Host");
  const videoRef = useRef<HTMLVideoElement>(null);

  // TanStack Start Server Hooks
  const generateToken = useServerFn(generateLiveKitToken);
  const startEgress = useServerFn(startLiveKitEgress);
  const stopEgress = useServerFn(stopLiveKitEgress);

  // LiveKit Room Integration Hooks
  const { room, isConnected, error, connect, disconnect, toggleCameraTrack, toggleMicTrack } = useLiveKitRoom({
    url: liveKitUrl || "",
    token: liveKitToken || "",
    roomName: streamTitle ? streamTitle.replace(/\s+/g, "-") : "live-studio-room",
    onConnected: async () => {
      toast.success("Studio Room Connected! Activating YouTube Live Sync...");
      
      // 🔥 CRITICAL FIX: Triggering LiveKit Egress as soon as room is ready
      try {
        console.log("[Studio] Instantiating Egress pipeline straight to YouTube RTMP server...");
        const roomIdentifier = streamTitle.replace(/\s+/g, "-");
        
        const egressResp = await startEgress({
          data: { roomName: roomIdentifier, youtubeStreamKey }
        });

        if (egressResp?.egressId) {
          setCurrentEgressId(egressResp.egressId);
          toast.success("YouTube Live Stream is now ACTIVE! You are broadcasting.");
        }
      } catch (err: any) {
        console.error("[Egress Setup Error]", err);
        toast.error(`Egress Connection Failure: ${err.message}`);
      }
      setIsConnecting(false);
    },
    onDisconnected: () => {
      setIsConnecting(false);
      setCurrentEgressId(null);
      toast.info("Broadcast Studio Session Closed.");
    },
    onError: (err) => {
      setIsConnecting(false);
      toast.error(`LiveKit Error: ${err.message}`);
    },
  });

  // Automatically connect when WebRTC tokens hit local memory
  useEffect(() => {
    if (liveKitToken && liveKitUrl && !isConnected) {
      connect();
    }
  }, [liveKitToken, liveKitUrl, isConnected, connect]);

  // Auth Protection Check
  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data } = await supabase.from("profiles").select("full_name").eq("id", session.user.id).maybeSingle();
        if (data?.full_name) setParticipantName(data.full_name);
      } else {
        navigate({ to: "/" });
      }
    };
    fetchProfile();
  }, [navigate]);

  // Attach webcam stream to local UI box
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

  const handleStartBroadcasting = async () => {
    if (!streamTitle || !youtubeStreamKey) {
      toast.error("Please provide both a Stream Title and a YouTube Stream Key.");
      return;
    }

    setIsConnecting(true);
    try {
      const roomIdentifier = streamTitle.replace(/\s+/g, "-");
      const tokenResponse = await generateToken({
        data: { roomName: roomIdentifier, participantName },
      });

      if (tokenResponse?.token && tokenResponse?.url) {
        setLiveKitToken(tokenResponse.token);
        setLiveKitUrl(tokenResponse.url);
      } else {
        throw new Error("Invalid response boundary token payload.");
      }
    } catch (err: any) {
      toast.error(`Studio boot failed: ${err.message}`);
      setIsConnecting(false);
    }
  };

  const handleStopBroadcasting = async () => {
    try {
      if (currentEgressId) {
        await stopEgress({ data: { egressId: currentEgressId } });
      }
    } catch (err) {
      console.error("Egress stop error", err);
    }

    if (isConnected) {
      await disconnect();
      setLiveKitToken(null);
      setLiveKitUrl(null);
      setCurrentEgressId(null);
      setIsConnecting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-[#f1f1f1] flex flex-col lg:flex-row p-6 gap-6">
      
      {/* LEFT FORM PANEL: Mobile App Config Simulation */}
      <div className="w-full lg:w-5/12 bg-[#1f1f1f] border border-[#2f2f2f] rounded-xl p-6 shadow-2xl flex flex-col gap-4">
        <div className="flex items-center gap-2 border-b border-[#2f2f2f] pb-3">
          <Tv className="text-red-500 w-5 h-5" />
          <h2 className="text-lg font-bold tracking-wide">Stream Configuration</h2>
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-400 block mb-1">Stream Title</label>
          <div className="relative">
            <FileText className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="e.g., Live Morning Service"
              className="w-full bg-[#121212] border border-[#333] rounded-lg pl-10 pr-4 py-2.5 text-sm focus:border-red-500 outline-none"
              value={streamTitle}
              onChange={(e) => setStreamTitle(e.target.value)}
              disabled={isConnected}
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-400 block mb-1">Description</label>
          <textarea
            rows={2}
            placeholder="Tell your viewers about this live stream..."
            className="w-full bg-[#121212] border border-[#333] rounded-lg px-4 py-2 text-sm focus:border-red-500 outline-none resize-none"
            value={streamDescription}
            onChange={(e) => setStreamDescription(e.target.value)}
            disabled={isConnected}
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-400 block mb-1">YouTube Stream Key</label>
          <div className="relative">
            <Key className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
            <input
              type="password"
              placeholder="Paste your standard YouTube RTMP Key here"
              className="w-full bg-[#121212] border border-[#333] rounded-lg pl-10 pr-4 py-2.5 text-sm focus:border-red-500 outline-none"
              value={youtubeStreamKey}
              onChange={(e) => setYoutubeStreamKey(e.target.value)}
              disabled={isConnected}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-gray-400 block mb-1">Category</label>
            <select
              className="w-full bg-[#121212] border border-[#333] rounded-lg px-3 py-2 text-sm text-gray-300 outline-none"
              value={streamCategory}
              onChange={(e) => setStreamCategory(e.target.value)}
              disabled={isConnected}
            >
              <option value="22">People & Blogs</option>
              <option value="29">Nonprofits & Activism</option>
              <option value="10">Music</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-400 block mb-1">Visibility</label>
            <select
              className="w-full bg-[#121212] border border-[#333] rounded-lg px-3 py-2 text-sm text-gray-300 outline-none"
              value={privacyStatus}
              onChange={(e) => setPrivacyStatus(e.target.value)}
              disabled={isConnected}
            >
              <option value="public">🌐 Public</option>
              <option value="unlisted">🔗 Unlisted</option>
              <option value="private">🔒 Private</option>
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-400 block mb-1">Stream Thumbnail</label>
          <div className="border border-dashed border-[#333] rounded-lg p-3 bg-[#121212] flex flex-col items-center justify-center relative min-h-[90px]">
            {thumbnailPreview ? (
              <img src={thumbnailPreview} alt="Preview" className="absolute inset-0 w-full h-full object-cover rounded-lg" />
            ) : (
              <>
                <ImageIcon className="w-6 h-6 text-gray-500 mb-1" />
                <span className="text-xs text-gray-400">Click to upload banner image</span>
              </>
            )}
            <input
              type="file"
              accept="image/*"
              className="absolute inset-0 opacity-0 cursor-pointer"
              onChange={(e) => {
                if (e.target.files?.[0]) setThumbnailPreview(URL.createObjectURL(e.target.files[0]));
              }}
              disabled={isConnected}
            />
          </div>
        </div>
      </div>

      {/* RIGHT PANEL: Live Video Display & Sync Control Monitor */}
      <div className="w-full lg:w-7/12 bg-[#1f1f1f] border border-[#2f2f2f] rounded-xl p-6 shadow-2xl flex flex-col gap-4 justify-between">
        
        <div className="flex items-center justify-between border-b border-[#2f2f2f] pb-3">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${isConnected ? "bg-red-500 animate-pulse" : "bg-gray-600"}`}></span>
            <span className="text-xs font-bold uppercase tracking-wider text-gray-300">
              {isConnected ? "STUDIO FEED ONLINE (LIVE TO YOUTUBE)" : "STUDIO FEED OFFLINE"}
            </span>
          </div>
        </div>

        <div className="relative aspect-video bg-black rounded-xl border border-[#2f2f2f] overflow-hidden flex items-center justify-center">
          {isConnecting && (
            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-10 gap-2 text-xs">
              <Loader2 className="animate-spin text-red-500 w-6 h-6" />
              <p className="text-gray-400 font-medium">Booting LiveKit Room & Routing Egress Pipeline...</p>
            </div>
          )}
          {isConnected && !isCameraEnabled && (
            <div className="absolute inset-0 bg-[#121212] flex flex-col items-center justify-center text-gray-500 text-xs gap-1">
              <VideoOff className="w-8 h-8" /> Video Feed Muted
            </div>
          )}
          {isConnected && isCameraEnabled && (
            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover"></video>
          )}
          {!isConnected && !isConnecting && (
            <div className="text-center text-gray-600 flex flex-col items-center gap-1.5 text-xs">
              <Radio className="w-10 h-10 text-[#2e2e2e]" />
              <p>Configure details and click "Start Stream Broadcast"</p>
            </div>
          )}
        </div>

        {/* Hardware Controls */}
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

        {/* Stream Action Buttons */}
        <div>
          {!isConnected ? (
            <button
              onClick={handleStartBroadcasting}
              disabled={isConnecting || !streamTitle || !youtubeStreamKey}
              className="w-full py-3 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 disabled:bg-gray-800 disabled:text-gray-500 flex items-center justify-center gap-2 transition"
            >
              <Radio className="w-3.5 h-3.5" /> Start Stream Broadcast
            </button>
          ) : (
            <button
              onClick={handleStopBroadcasting}
              className="w-full py-3 rounded-xl text-xs font-bold text-white bg-transparent border border-red-600/40 hover:bg-red-600/10 flex items-center justify-center gap-2 transition"
            >
              <PowerOff className="w-3.5 h-3.5 text-red-500" /> End Stream Broadcast
            </button>
          )}
        </div>

        {error && (
          <div className="flex items-center p-2.5 rounded-lg bg-red-500/10 text-red-400 text-xs">
            <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
            <span>{error.message}</span>
          </div>
        )}
        {isConnected && (
          <div className="flex items-center p-2.5 rounded-lg bg-green-500/10 text-green-400 text-xs">
            <CheckCircle2 className="w-4 h-4 mr-2 flex-shrink-0" />
            <span>LiveKit Room active. Stream Key routing to YouTube Live successfully!</span>
          </div>
        )}
      </div>

    </div>
  );
}
