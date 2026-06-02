
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
} from "lucide-react";

/**
 * LiveKit Server Functions
 */
import { createServerFn } from "@tanstack/react-start";
import { AccessToken } from "livekit-server-sdk";
import { EgressClient, RoomCompositeEgressRequest } from "livekit-server-sdk";

function validateLiveKitEnv() {
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  const url = process.env.LIVEKIT_URL;

  if (!apiKey) throw new Error("LIVEKIT_API_KEY environment variable not set");
  if (!apiSecret) throw new Error("LIVEKIT_API_SECRET environment variable not set");
  if (!url) throw new Error("LIVEKIT_URL environment variable not set");

  return { apiKey, apiSecret, url };
}

export const generateLiveKitToken = createServerFn({ method: "POST" })
  .inputValidator((data: any) => {
    if (!data?.roomName) throw new Error("Room name is required");
    if (!data?.participantName) throw new Error("Participant name is required");
    return data;
  })
  .handler(async ({ data }) => {
    try {
      const { apiKey, apiSecret, url } = validateLiveKitEnv();
      const token = new AccessToken(apiKey, apiSecret, {
        identity: data.participantName,
        name: data.participantName,
        metadata: JSON.stringify({ timestamp: new Date().toISOString(), roomName: data.roomName }),
      } as any);
      (token as any).addGrant({
        room: data.roomName,
        roomJoin: true,
        canPublish: true,
        canPublishData: true,
        canSubscribe: true,
      });
      return { token: await token.toJwt(), url, roomName: data.roomName };
    } catch (error: any) {
      throw new Error(error.message || "Failed to generate LiveKit token");
    }
  });

export const startLiveKitEgress = createServerFn({ method: "POST" })
  .inputValidator((data: any) => {
    if (!data?.roomName) throw new Error("Room name is required");
    if (!data?.youtubeStreamKey) throw new Error("YouTube stream key is required");
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
          audioCodec: 1, videoCodec: 1, width: 1280, height: 720,
          depth: 24, framerate: 30, audioBitrate: 128, videoBitrate: 2500,
        } as any,
      });

      const response = await (egressClient as any).startRoomCompositeEgress(request);
      return { egressId: response.egressId, status: response.status };
    } catch (error: any) {
      throw new Error(error.message || "Failed to start LiveKit egress");
    }
  });

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
      throw new Error("Failed to stop LiveKit egress");
    }
  });

// Route registration
export const Route = createFileRoute("/live-streaming-setup")({
  component: LiveStreamingSetupPage,
});

function LiveStreamingSetupPage() {
  const { auto } = Route.useSearch();
  const navigate = useNavigate();

  const [roomName, setRoomName] = useState("");
  const [youtubeStreamKey, setYoutubeStreamKey] = useState("");
  const [participantName, setParticipantName] = useState("Guest");
  const [isConnecting, setIsConnecting] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [isCameraEnabled, setIsCameraEnabled] = useState(true);
  const [isMicEnabled, setIsMicEnabled] = useState(true);
  const [liveKitToken, setLiveKitToken] = useState<string | null>(null);
  const [liveKitUrl, setLiveKitUrl] = useState<string | null>(null);
  const [currentEgressId, setCurrentEgressId] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Client Functions Binding (CRITICAL FIX)
  const generateToken = useServerFn(generateLiveKitToken);
  const startEgress = useServerFn(startLiveKitEgress);
  const stopEgress = useServerFn(stopLiveKitEgress);

  const { room, isConnected, error, connect, disconnect, toggleCameraTrack, toggleMicTrack } = useLiveKitRoom({
    url: liveKitUrl || "",
    token: liveKitToken || "",
    roomName: roomName,
    onConnected: async () => {
      setIsLive(true);
      setIsConnecting(false);
      toast.success("Connected to LiveKit room!");

      // Trigger YouTube streaming immediately after LiveKit room connects successfully
      try {
        console.log("Starting Egress to YouTube...");
        const egress = await startEgress({
          data: { roomName, youtubeStreamKey, title: roomName || "Live Stream" }
        });

        if (egress?.egressId) {
          setCurrentEgressId(egress.egressId);
          toast.success("YouTube Stream is now LIVE!");
        }
      } catch (err: any) {
        console.error("EGRESS INITIATION ERROR:", err);
        toast.error(`YouTube Streaming Failed: ${err.message || "Egress Drop"}`);
      }
    },
    onDisconnected: () => {
      setIsLive(false);
      setIsConnecting(false);
      setCurrentEgressId(null);
      toast.info("Disconnected from LiveKit room.");
    },
    onError: (err) => {
      setIsConnecting(false);
      toast.error(`LiveKit Error: ${err.message}`);
    },
  });

  useEffect(() => {
    if (liveKitToken && liveKitUrl && !isConnected) {
      connect();
    }
  }, [liveKitToken, liveKitUrl, isConnected, connect]);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", session.user.id)
          .maybeSingle();
        if (data?.full_name) {
          setParticipantName(data.full_name);
        }
      } else {
        navigate({ to: "/" });
      }
    };
    fetchProfile();
  }, [navigate]);

  useEffect(() => {
    if (room && videoRef.current) {
      const localVideoPub = Array.from(room.localParticipant?.videoTrackPublications.values() ?? [])[0];
      const localVideoTrack = localVideoPub?.videoTrack;
      if (localVideoTrack) {
        localVideoTrack.attach(videoRef.current);
        return () => {
          if (videoRef.current) localVideoTrack.detach(videoRef.current);
        };
      }
    }
  }, [room, isCameraEnabled]);

  const handleStartStream = async () => {
    if (!roomName || !youtubeStreamKey) {
      toast.error("Please fill in both Room Name and YouTube Stream Key.");
      return;
    }

    setIsConnecting(true);
    try {
      const tokenResponse = await generateToken({
        data: { roomName, participantName, canPublish: true, canSubscribe: true },
      });

      if (tokenResponse?.token && tokenResponse?.url) {
        setLiveKitToken(tokenResponse.token);
        setLiveKitUrl(tokenResponse.url);
      } else {
        throw new Error("Failed to get LiveKit token or URL.");
      }
    } catch (err: any) {
      toast.error(`Failed to start stream: ${err.message || "Unknown error"}`);
      setIsConnecting(false);
    }
  };

  const handleStopStream = async () => {
    try {
      if (currentEgressId) {
        await stopEgress({ data: { egressId: currentEgressId } });
        toast.info("YouTube stream stopped.");
      }
    } catch (err) {
      console.error(err);
    }

    if (isConnected) {
      await disconnect();
      setIsConnecting(false);
      setLiveKitToken(null);
      setLiveKitUrl(null);
      setCurrentEgressId(null);
    }
  };

  const handleToggleCamera = () => {
    toggleCameraTrack(!isCameraEnabled);
    setIsCameraEnabled((prev) => !prev);
  };

  const handleToggleMic = () => {
    toggleMicTrack(!isMicEnabled);
    setIsMicEnabled((prev) => !prev);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <h1 className="text-3xl font-bold text-foreground mb-4">Live Streaming Setup</h1>
      <div className="bg-card p-8 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-xl font-semibold text-foreground mb-4">Stream Configuration</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-muted-foreground">Room Name</label>
            <input
              type="text"
              className="mt-1 block w-full rounded-md bg-input text-foreground p-2 border border-gray-700"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              disabled={isConnecting || isConnected}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground">YouTube Stream Key</label>
            <input
              type="password"
              className="mt-1 block w-full rounded-md bg-input text-foreground p-2 border border-gray-700"
              value={youtubeStreamKey}
              onChange={(e) => setYoutubeStreamKey(e.target.value)}
              disabled={isConnecting || isConnected}
            />
          </div>

          <div className="relative w-full h-48 bg-black rounded-md overflow-hidden">
            {isConnecting && <div className="absolute inset-0 flex items-center justify-center bg-black/75 text-white"><Loader2 className="animate-spin mr-2" /> Connecting...</div>}
            {isConnected && !isCameraEnabled && <div className="absolute inset-0 flex items-center justify-center bg-black/75 text-white"><VideoOff className="mr-2" /> Camera Off</div>}
            {isConnected && isCameraEnabled && <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover"></video>}
            {!isConnected && !isConnecting && <div className="absolute inset-0 flex items-center justify-center bg-gray-800 text-gray-400">No Video Preview</div>}
          </div>

          <div className="flex justify-center gap-4">
            <button onClick={handleToggleCamera} disabled={!isConnected} className={`p-3 rounded-full ${isCameraEnabled ? "bg-indigo-600" : "bg-gray-600"} text-white`}>
              {isCameraEnabled ? <Video /> : <VideoOff />}
            </button>
            <button onClick={handleToggleMic} disabled={!isConnected} className={`p-3 rounded-full ${isMicEnabled ? "bg-indigo-600" : "bg-gray-600"} text-white`}>
              {isMicEnabled ? <Mic /> : <MicOff />}
            </button>
          </div>

          {!isConnected ? (
            <button onClick={handleStartStream} disabled={isConnecting || !roomName || !youtubeStreamKey} className="w-full py-2 px-4 rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 flex items-center justify-center gap-2">
              {isConnecting ? <Loader2 className="animate-spin mr-2" /> : <Radio className="mr-2" />}
              Start Stream
            </button>
          ) : (
            <button onClick={handleStopStream} className="w-full py-2 px-4 rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700 flex items-center justify-center gap-2">
              <PowerOff className="mr-2" /> Stop Stream
            </button>
          )}

          {error && (
            <div className="flex items-center p-3 rounded-md bg-red-500/10 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 mr-2" />
              <span>{error.message}</span>
            </div>
          )}
          {isConnected && !error && (
            <div className="flex items-center p-3 rounded-md bg-green-500/10 text-green-400 text-sm">
              <CheckCircle2 className="w-4 h-4 mr-2" />
              <span>LiveKit Room Connected. Live streaming active!</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
