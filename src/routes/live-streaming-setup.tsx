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
  Signal,
  Radio,
  PowerOff,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

/**
 * LiveKit Server Functions
 * Handles server-side LiveKit operations: token generation, room management, and egress
 */

import { createServerFn } from "@tanstack/react-start";
import { AccessToken } from "livekit-server-sdk";
import { EgressClient, RoomCompositeEgressRequest, EncodingOptions } from "livekit-server-sdk";

// Validate environment variables
function validateLiveKitEnv() {
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  const url = process.env.LIVEKIT_URL;

  console.log("[LiveKit] Environment validation:", {
    hasApiKey: !!apiKey,
    hasApiSecret: !!apiSecret,
    hasUrl: !!url,
    url: url,
  });

  if (!apiKey) throw new Error("LIVEKIT_API_KEY environment variable not set");
  if (!apiSecret) throw new Error("LIVEKIT_API_SECRET environment variable not set");
  if (!url) throw new Error("LIVEKIT_URL environment variable not set");

  return { apiKey, apiSecret, url };
}

/**
 * Generate a LiveKit access token for a participant
 */
export const generateLiveKitToken = createServerFn({ method: "POST" })
  .inputValidator(
    (data: {
      roomName: string;
      participantName: string;
      canPublish?: boolean;
      canSubscribe?: boolean;
    }) => {
      if (!data?.roomName) throw new Error("Room name is required");
      if (!data?.participantName) throw new Error("Participant name is required");
      return data;
    },
  )
  .handler(async ({ data }) => {
    try {
      const { apiKey, apiSecret, url } = validateLiveKitEnv();

      console.log("[LiveKit] Generating token for room:", {
        roomName: data.roomName,
        participantName: data.participantName,
        canPublish: data.canPublish !== false,
        canSubscribe: data.canSubscribe !== false,
      });

      // Create access token with explicit permissions
      const token = new AccessToken(apiKey, apiSecret, {
        identity: data.participantName,
        name: data.participantName,
        metadata: JSON.stringify({
          timestamp: new Date().toISOString(),
          roomName: data.roomName,
        }),
      } as any);
      (token as any).addGrant({
        room: data.roomName,
        roomJoin: true,
        canPublish: data.canPublish !== false,
        canPublishData: true,
        canSubscribe: data.canSubscribe !== false,
      });

      const jwt = await token.toJwt();

      console.log("[LiveKit] Token generated successfully", {
        roomName: data.roomName,
        participantName: data.participantName,
        tokenLength: jwt.length,
      });

      return {
        token: jwt,
        url: url,
        roomName: data.roomName,
      };
    } catch (error) {
      console.error("[LiveKit] Token generation failed:", error);
      throw new Error(
        error instanceof Error ? error.message : "Failed to generate LiveKit token",
      );
    }
  });

/**
 * Start LiveKit Egress to YouTube Live
 */
export const startLiveKitEgress = createServerFn({ method: "POST" })
  .inputValidator(
    (data: {
      roomName: string;
      youtubeStreamKey: string;
      title: string;
    }) => {
      if (!data?.roomName) throw new Error("Room name is required");
      if (!data?.youtubeStreamKey) throw new Error("YouTube stream key is required");
      if (!data?.title) throw new Error("Stream title is required");
      return data;
    },
  )
  .handler(async ({ data }) => {
    try {
      const { apiKey, apiSecret, url } = validateLiveKitEnv();

      console.log("[LiveKit Egress] Starting egress for room:", {
        roomName: data.roomName,
        youtubeStreamKey: data.youtubeStreamKey.substring(0, 10) + "...",
        title: data.title,
        liveKitUrl: url,
      });

      const egressClient = new EgressClient(url, apiKey, apiSecret);

      // Create YouTube RTMP output URL
      const youtubeRtmpUrl = `rtmps://a.rtmp.youtube.com/live2/${data.youtubeStreamKey}`;

      // Configure egress request
      const request = new RoomCompositeEgressRequest({
        roomName: data.roomName,
        output: {
          case: "rtmpOutput",
          value: {
            urls: [youtubeRtmpUrl],
          },
        },
        options: {
          audioCodec: 1, // OPUS
          videoCodec: 1, // H264
          width: 1280,
          height: 720,
          depth: 24,
          framerate: 30,
          audioBitrate: 128,
          videoBitrate: 2500,
        },
      });

      // Start egress
      const response = await egressClient.startRoomCompositeEgress(request);

      console.log("[LiveKit Egress] Egress started successfully:", {
        egressId: response.egressId,
        status: response.status,
        roomName: data.roomName,
      });

      return {
        egressId: response.egressId,
        status: response.status,
      };
    } catch (error) {
      console.error("[LiveKit Egress] Failed to start egress:", error);
      throw new Error(
        error instanceof Error ? error.message : "Failed to start LiveKit egress",
      );
    }
  });

/**
 * Stop LiveKit Egress
 */
export const stopLiveKitEgress = createServerFn({ method: "POST" })
  .inputValidator(
    (data: {
      egressId: string;
    }) => {
      if (!data?.egressId) throw new Error("Egress ID is required");
      return data;
    },
  )
  .handler(async ({ data }) => {
    try {
      const { apiKey, apiSecret, url } = validateLiveKitEnv();

      console.log("[LiveKit Egress] Stopping egress:", {
        egressId: data.egressId,
        liveKitUrl: url,
      });

      const egressClient = new EgressClient(url, apiKey, apiSecret);

      // Stop egress
      const response = await (egressClient as any).stopEgress(data.egressId);

      console.log("[LiveKit Egress] Egress stopped successfully", {
        egressId: response.egressId,
        status: response.status,
      });

      return {
        egressId: response.egressId,
        status: response.status,
      };
    } catch (error) {
      console.error("[LiveKit Egress] Failed to stop egress:", error);
      throw new Error(
        error instanceof Error ? error.message : "Failed to stop LiveKit egress",
      );
    }
  });

/**
 * Get egress status
 */
export const getLiveKitEgressStatus = createServerFn({ method: "GET" })
  .inputValidator(
    (data: {
      egressId: string;
    }) => {
      if (!data?.egressId) throw new Error("Egress ID is required");
      return data;
    },
  )
  .handler(async ({ data }) => {
    try {
      const { apiKey, apiSecret, url } = validateLiveKitEnv();

      console.log("[LiveKit Egress] Getting status for egress:", {
        egressId: data.egressId,
        liveKitUrl: url,
      });

      const egressClient = new EgressClient(url, apiKey, apiSecret);

      // Get egress info
      const response = await egressClient.listEgress({
        egressId: data.egressId,
      });

      if (!response || response.length === 0) {
        throw new Error("Egress not found");
      }

      const egress = response[0];

      console.log("[LiveKit Egress] Status retrieved:", {
        egressId: egress.egressId,
        status: egress.status,
      });

      return {
        egressId: egress.egressId,
        status: egress.status,
        startedAt: egress.startedAt?.toString(),
        updatedAt: egress.updatedAt?.toString(),
      };
    } catch (error) {
      console.error("[LiveKit Egress] Failed to get status:", error);
      throw new Error(
        error instanceof Error ? error.message : "Failed to get LiveKit egress status",
      );
    }
  });

// TanStack Router route registration
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
  const videoRef = useRef<HTMLVideoElement>(null);

  const generateToken = useServerFn(generateLiveKitToken);

  const { room, isConnected, isPublishing, error, connect, disconnect, toggleCameraTrack, toggleMicTrack } = useLiveKitRoom({
    url: liveKitUrl || "",
    token: liveKitToken || "",
    roomName: roomName,
    onConnected: () => {
      setIsLive(true);
      setIsConnecting(false);
      toast.success("Connected to LiveKit room!");
    },
    onDisconnected: () => {
      setIsLive(false);
      setIsConnecting(false);
      toast.info("Disconnected from LiveKit room.");
    },
    onError: (err) => {
      setIsConnecting(false);
      toast.error(`LiveKit Error: ${err.message}`);
      console.error("LiveKit Room Error:", err);
    },
  });

  // Trigger connection when token and url are available
  useEffect(() => {
    if (liveKitToken && liveKitUrl && !isConnected && !isConnecting) {
      connect();
    }
  }, [liveKitToken, liveKitUrl, isConnected, isConnecting, connect]);

  // Fetch user profile for participant name
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
        navigate({ to: "/" }); // Redirect to login if no session
      }
    };
    fetchProfile();
  }, [navigate]);

  // Handle local video preview
  useEffect(() => {
    if (room && videoRef.current) {
      const localVideoTrack = room.localParticipant?.videoTrackPublications[0]?.videoTrack;
      if (localVideoTrack) {
        localVideoTrack.attach(videoRef.current);
        return () => {
          localVideoTrack.detach(videoRef.current);
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
      console.log("[LiveStreamingSetupPage] Attempting to generate LiveKit token...");
      const tokenResponse = await generateToken({
        data: { roomName, participantName, canPublish: true, canSubscribe: true },
      });

      if (tokenResponse?.token && tokenResponse?.url) {
        setLiveKitToken(tokenResponse.token);
        setLiveKitUrl(tokenResponse.url);
        console.log("[LiveStreamingSetupPage] LiveKit token generated. Triggering connection...");
      } else {
        throw new Error("Failed to get LiveKit token or URL.");
      }
    } catch (err: any) {
      console.error("[LiveStreamingSetupPage] Error starting stream:", err);
      toast.error(`Failed to start stream: ${err.message || "Unknown error"}`);
      setIsConnecting(false);
    }
  };

  const handleStopStream = async () => {
    if (isConnected) {
      await disconnect();
      setIsConnecting(false);
      setLiveKitToken(null);
      setLiveKitUrl(null);
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

  useEffect(() => {
    if (auto === "true" && !isConnecting && !isConnected) {
      console.log("Auto-starting live streaming setup...");
      // Optionally, you could pre-fill roomName or youtubeStreamKey here if available from search params
      // handleStartStream(); // Uncomment to auto-start immediately
      toast.info("Automatic setup initiated. Please configure and start your stream.");
    }
  }, [auto, isConnecting, isConnected]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <h1 className="text-3xl font-bold text-foreground mb-4">Live Streaming Setup</h1>
      <p className="text-muted-foreground mb-8 text-center">
        Configure your live stream settings and go live to your audience.
      </p>
      <div className="bg-card p-8 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-xl font-semibold text-foreground mb-4">Stream Configuration</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="roomName" className="block text-sm font-medium text-muted-foreground">Room Name</label>
            <input
              type="text"
              id="roomName"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 bg-input text-foreground"
              placeholder="My Awesome Stream"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              disabled={isConnecting || isConnected}
            />
          </div>
          <div>
            <label htmlFor="youtubeStreamKey" className="block text-sm font-medium text-muted-foreground">YouTube Stream Key</label>
            <input
              type="text"
              id="youtubeStreamKey"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 bg-input text-foreground"
              placeholder="Enter your YouTube stream key"
              value={youtubeStreamKey}
              onChange={(e) => setYoutubeStreamKey(e.target.value)}
              disabled={isConnecting || isConnected}
            />
          </div>

          <div className="relative w-full h-48 bg-black rounded-md overflow-hidden">
            {isConnecting && <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75 text-white"><Loader2 className="animate-spin mr-2" /> Connecting...</div>}
            {isConnected && !isCameraEnabled && <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75 text-white"><VideoOff className="mr-2" /> Camera Off</div>}
            {isConnected && isCameraEnabled && <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover"></video>}
            {!isConnected && !isConnecting && <div className="absolute inset-0 flex items-center justify-center bg-gray-800 text-gray-400">No Video Preview</div>}
          </div>

          <div className="flex justify-center gap-4">
            <button
              onClick={handleToggleCamera}
              disabled={!isConnected}
              className={`p-3 rounded-full ${isCameraEnabled ? "bg-indigo-600 hover:bg-indigo-700" : "bg-gray-600 hover:bg-gray-700"} text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
            >
              {isCameraEnabled ? <Video /> : <VideoOff />}
            </button>
            <button
              onClick={handleToggleMic}
              disabled={!isConnected}
              className={`p-3 rounded-full ${isMicEnabled ? "bg-indigo-600 hover:bg-indigo-700" : "bg-gray-600 hover:bg-gray-700"} text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
            >
              {isMicEnabled ? <Mic /> : <MicOff />}
            </button>
          </div>

          {!isConnected ? (
            <button
              onClick={handleStartStream}
              disabled={isConnecting || !roomName || !youtubeStreamKey}
              className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 flex items-center justify-center gap-2"
            >
              {isConnecting ? <Loader2 className="animate-spin mr-2" /> : <Radio className="mr-2" />}
              {isConnecting ? "Connecting..." : "Start Stream"}
            </button>
          ) : (
            <button
              onClick={handleStopStream}
              disabled={!isConnected}
              className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 flex items-center justify-center gap-2"
            >
              <PowerOff className="mr-2" />
              Stop Stream
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
              <span>LiveKit Room Connected. Ready to stream!</span>
            </div>
          )}
        </div>
      </div>
      {auto === "true" && !isConnected && !isConnecting && (
        <p className="mt-4 text-sm text-green-500">Automatic setup initiated. Please configure and start your stream.</p>
      )}
    </div>
  );
}

