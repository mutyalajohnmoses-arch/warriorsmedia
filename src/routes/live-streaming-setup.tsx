import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  Radio,
  Camera,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Users,
  Clock,
  Circle,
  Upload,
  X,
  Play,
  Wifi,
  WifiOff,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { Room } from "livekit-client";
import {
  connectToLiveKitRoom,
  publishTracksToRoom,
  disconnectFromLiveKitRoom,
  toggleCamera,
  toggleMicrophone,
} from "@/lib/livekit-client";
import {
  generateLiveKitToken,
  startLiveKitEgress,
  stopLiveKitEgress,
} from "@/lib/livekit.functions";
import { getConnectedYouTubeChannel } from "@/lib/youtube-persistence.functions";
import { getOrRefreshYouTubeToken } from "@/lib/youtube-token-manager.functions";
import { createYouTubeBroadcast } from "@/lib/youtube-broadcast.functions";

type ConnectedYouTubeChannel = {
  id: string;
  channel_id: string;
  title: string;
  description?: string | null;
  profile_image_url?: string | null;
};

export const Route = createFileRoute("/live-streaming-setup")({
  head: () => ({
    meta: [
      { title: "Go Live — Warriors Media" },
      { name: "description", content: "Start your YouTube live stream instantly." },
    ],
  }),
  component: LiveStreamingSetup,
});


function LiveStreamingSetup() {
  const navigate = useNavigate();
  const generateTokenFn = useServerFn(generateLiveKitToken);
  const startEgressFn = useServerFn(startLiveKitEgress);
  const stopEgressFn = useServerFn(stopLiveKitEgress);
  const getChannelFn = useServerFn(getConnectedYouTubeChannel);
  const getTokenFn = useServerFn(getOrRefreshYouTubeToken);
  const createBroadcastFn = useServerFn(createYouTubeBroadcast);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [channel, setChannel] = useState<ConnectedYouTubeChannel | null>(null);
  const [channelNotConnected, setChannelNotConnected] = useState(false);

  // Stream Configuration
  const [title, setTitle] = useState("Sunday Worship Service");
  const [description, setDescription] = useState("");
  const [privacy, setPrivacy] = useState<"public" | "private" | "unlisted">("public");
  const [madeForKids, setMadeForKids] = useState(false);

  // Media State
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [micEnabled, setMicEnabled] = useState(true);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // LiveKit State
  const [room, setRoom] = useState<Room | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  // Live Stats
  const [viewerCount, setViewerCount] = useState(0);
  const [duration, setDuration] = useState("00:00:00");
  const startTimeRef = useRef<number | null>(null);
  const [broadcastId, setBroadcastId] = useState<string | null>(null);
  const [egressId, setEgressId] = useState<string | null>(null);
  const initRef = useRef(false);

  // Initialize on mount
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    const init = async () => {
      try {
        setLoading(true);
        setError(null);
        setChannelNotConnected(false);

        // Check authentication
        console.log("[LiveStreamingSetup] Checking authentication...");
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          console.error("[LiveStreamingSetup] Session error:", sessionError);
          throw new Error("Failed to get session");
        }

        if (!session) {
          console.log("[LiveStreamingSetup] No session found, redirecting to login");
          navigate({ to: "/" });
          return;
        }

        console.log("[LiveStreamingSetup] Session found for user:", session.user.id);

        // Fetch connected YouTube channel
        try {
          console.log(
            "[LiveStreamingSetup] Calling getConnectedYouTubeChannel for user:",
            session.user.id,
          );
          const channelData = await getChannelFn({ data: { userId: session.user.id } });
          console.log("[LiveStreamingSetup] Channel data received:", channelData);

          if (!channelData) {
            console.log("[LiveStreamingSetup] No YouTube channel connected for user");
            setChannelNotConnected(true);
            setLoading(false);
            return;
          }

          console.log("[LiveStreamingSetup] Channel loaded successfully:", channelData.title);

          // Verify and refresh token if needed
          try {
            console.log("[LiveStreamingSetup] Verifying YouTube token...");
            const tokenInfo = await getTokenFn({ data: { userId: session.user.id } });
            console.log("[LiveStreamingSetup] Token verified and refreshed if needed");
            // Store the fresh token in localStorage for immediate use
            localStorage.setItem("youtube_access_token", tokenInfo.access_token);
            if (tokenInfo.refresh_token) {
              localStorage.setItem("youtube_refresh_token", tokenInfo.refresh_token);
            }
            localStorage.setItem("youtube_token_expires", String(tokenInfo.expires_at));
          } catch (tokenError) {
            console.warn("[LiveStreamingSetup] Token verification failed:", tokenError);
            // If token refresh fails, channel is marked as disconnected in the token manager
            setChannelNotConnected(true);
            setLoading(false);
            return;
          }

          setChannel(channelData);

          try {
            await startMedia();
          } catch (err) {
            console.error("Camera initialization failed:", err);
          }

          setLoading(false);
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : "Failed to fetch YouTube channel";
          console.error("[LiveStreamingSetup] Error fetching YouTube channel:", err);
          // Don't show error, treat as no channel connected
          setChannelNotConnected(true);
          setLoading(false);
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "An error occurred";
        console.error("[LiveStreamingSetup] Initialization error:", err);
        setError(errorMsg);
        setLoading(false);
      }
    };

    init();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [navigate, getChannelFn, getTokenFn]);

  useEffect(() => {
    const refreshConnectedChannel = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) return;

        console.log("[LiveStreamingSetup] Refreshing channel after connection event", {
          userId: session.user.id,
        });
        const channelData = await getChannelFn({ data: { userId: session.user.id } });
        console.log("[LiveStreamingSetup] Channel refresh returned", {
          found: Boolean(channelData),
          dbChannelId: channelData?.id,
          channelId: channelData?.channel_id,
          title: channelData?.title,
        });

        if (channelData) {
          setChannel(channelData);
          setChannelNotConnected(false);
          setError(null);
        }
      } catch (error) {
        console.error("[LiveStreamingSetup] Failed to refresh connected channel", error);
      }
    };

    window.addEventListener("youtube-channel-connected", refreshConnectedChannel);
    window.addEventListener("storage", refreshConnectedChannel);
    return () => {
      window.removeEventListener("youtube-channel-connected", refreshConnectedChannel);
      window.removeEventListener("storage", refreshConnectedChannel);
    };
  }, [getChannelFn]);

  // Timer and stats polling when live
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    if (isLive) {
      startTimeRef.current = Date.now();

      interval = setInterval(() => {
        const diff = Date.now() - (startTimeRef.current || Date.now());
        const h = Math.floor(diff / 3600000)
          .toString()
          .padStart(2, "0");
        const m = Math.floor((diff % 3600000) / 60000)
          .toString()
          .padStart(2, "0");
        const s = Math.floor((diff % 60000) / 1000)
          .toString()
          .padStart(2, "0");
        setDuration(`${h}:${m}:${s}`);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLive]);

  const startMedia = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: true,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
      }
      setCameraEnabled(true);

      return mediaStream;
    } catch (err) {
      toast.error("Failed to access camera or microphone. Please check permissions.");
      throw err;
    }
  };

  const handleStartStream = async () => {
    if (!title.trim()) {
      toast.error("Please enter a stream title");
      return;
    }

    setStarting(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      // Get fresh YouTube token before starting stream
      console.log("[LiveStreamingSetup] Refreshing token before starting stream");
      const tokenInfo = await getTokenFn({ data: { userId: session.user.id } });
      const youtubeAccessToken = tokenInfo.access_token;

      if (!youtubeAccessToken) throw new Error("YouTube access token not found");
      if (!channel) throw new Error("YouTube channel not connected");

      // Update localStorage with fresh token
      localStorage.setItem("youtube_access_token", youtubeAccessToken);
      if (tokenInfo.refresh_token) {
        localStorage.setItem("youtube_refresh_token", tokenInfo.refresh_token);
      }
      localStorage.setItem("youtube_token_expires", String(tokenInfo.expires_at));

      // Ensure media is started
      if (!stream) {
        await startMedia();
      }

      // Step 1: Create YouTube Broadcast (to get broadcast ID for egress)
      console.log("[LiveStreamingSetup] Creating YouTube broadcast");
      const broadcastResult = await createBroadcastFn({
        data: {
          access_token: youtubeAccessToken,
          title,
          description,
          privacy,
          madeForKids,
        },
      });

      setBroadcastId(broadcastResult.broadcastId);
      console.log("[LiveStreamingSetup] Broadcast created:", broadcastResult.broadcastId);

      // Step 2: Generate LiveKit token
      console.log("[LiveStreamingSetup] Generating LiveKit token");
      const roomName = `broadcast-${broadcastResult.broadcastId}`;
      const tokenResult = await generateTokenFn({
        data: {
          roomName,
          participantName: session.user.id,
          canPublish: true,
          canSubscribe: false,
        },
      });

      console.log("[LiveStreamingSetup] LiveKit token generated");

      // Step 3: Connect to LiveKit room
      console.log("[LiveStreamingSetup] Connecting to LiveKit room");
      setIsConnected(true);
      const liveKitRoom = await connectToLiveKitRoom({
        url: tokenResult.url,
        token: tokenResult.token,
        roomName,
      });

      setRoom(liveKitRoom);
      console.log("[LiveStreamingSetup] Connected to LiveKit room");

      // Step 4: Publish tracks to LiveKit room
      console.log("[LiveStreamingSetup] Publishing tracks to LiveKit");
      setIsPublishing(true);
      await publishTracksToRoom(liveKitRoom);
      console.log("[LiveStreamingSetup] Tracks published");

      // Step 5: Start LiveKit Egress to YouTube
      console.log("[LiveStreamingSetup] Starting LiveKit egress to YouTube");
      const egressResult = await startEgressFn({
        data: {
          roomName,
          youtubeStreamKey: broadcastResult.streamKey,
          title,
        },
      });

      setEgressId(egressResult.egressId);
      console.log("[LiveStreamingSetup] Egress started:", egressResult.egressId);

      // Step 6: Save to database
      if (session) {
        await supabase.from("live_streams").insert({
          user_id: session.user.id,
          broadcast_id: broadcastResult.broadcastId,
          channel_id: channel.channel_id,
          title,
          description,
          privacy_status: privacy,
          status: "live",
          livekit_room_name: roomName,
          livekit_egress_id: egressResult.egressId,
        });
      }

      setIsLive(true);
      toast.success("Live stream started! You're now broadcasting.");
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Failed to start stream");

      // Cleanup on error
      if (room) {
        try {
          await disconnectFromLiveKitRoom(room);
        } catch (e) {
          console.error("Error disconnecting room on failure:", e);
        }
      }
      setIsConnected(false);
      setIsPublishing(false);
      setRoom(null);
    } finally {
      setStarting(false);
    }
  };

  const handleEndStream = async () => {
    try {
      // Stop LiveKit egress
      if (egressId) {
        console.log("[LiveStreamingSetup] Stopping LiveKit egress");
        try {
          await stopEgressFn({ data: { egressId } });
          console.log("[LiveStreamingSetup] Egress stopped");
        } catch (e) {
          console.error("Error stopping egress:", e);
        }
      }

      // Disconnect from LiveKit room
      if (room) {
        console.log("[LiveStreamingSetup] Disconnecting from LiveKit room");
        await disconnectFromLiveKitRoom(room);
        console.log("[LiveStreamingSetup] Disconnected from room");
      }

      // Stop media tracks
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        setStream(null);
      }

      // Reset state
      setRoom(null);
      setIsConnected(false);
      setIsPublishing(false);
      setCameraEnabled(false);
      setMicEnabled(false);
      setIsLive(false);
      setEgressId(null);
      setBroadcastId(null);

      toast.success("Live stream ended");
      setTimeout(() => navigate({ to: "/dashboard" }), 1500);
    } catch (err) {
      console.error("Error ending stream:", err);
      toast.error("Error ending stream, but redirecting to dashboard");
      setTimeout(() => navigate({ to: "/dashboard" }), 1500);
    }
  };

  const handleToggleCamera = () => {
    if (room) {
      toggleCamera(room, !cameraEnabled);
      setCameraEnabled(!cameraEnabled);
    }
  };

  const handleToggleMic = () => {
    if (room) {
      toggleMicrophone(room, !micEnabled);
      setMicEnabled(!micEnabled);
    }
  };

  const handleThumbnailUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setThumbnailFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setThumbnailPreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Loading state
  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-[color:var(--gold)]" />
          <p className="text-sm text-muted-foreground">Loading live streaming setup...</p>
        </div>
      </main>
    );
  }

  // Error state
  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background px-6">
        <div className="max-w-md w-full space-y-6">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <div className="text-center space-y-2">
              <h1 className="font-display text-2xl">Error</h1>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          </div>
          <div className="space-y-3">
            <button
              onClick={() => navigate({ to: "/dashboard" })}
              className="w-full py-3 rounded-lg bg-gold-gradient text-[color:var(--primary-foreground)] font-bold uppercase tracking-widest transition"
            >
              Back to Dashboard
            </button>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-3 rounded-lg border border-border hover:bg-card transition font-bold uppercase tracking-widest"
            >
              Retry
            </button>
          </div>
        </div>
      </main>
    );
  }

  // No channel connected
  if (channelNotConnected || !channel) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background px-6">
        <div className="max-w-md w-full space-y-6">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-yellow-500/10 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-yellow-500" />
            </div>
            <div className="text-center space-y-2">
              <h1 className="font-display text-2xl">YouTube Not Connected</h1>
              <p className="text-sm text-muted-foreground">
                Please connect your YouTube channel first before going live.
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate({ to: "/dashboard" })}
            className="w-full py-3 rounded-lg bg-gold-gradient text-[color:var(--primary-foreground)] font-bold uppercase tracking-widest transition"
          >
            Connect YouTube Channel
          </button>
        </div>
      </main>
    );
  }

  // Mobile YouTube Live Stream UI
  return (
    <main className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="px-4 py-4 flex items-center justify-between sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="flex items-center gap-3">
          {!isLive && (
            <button
              onClick={() => navigate({ to: "/dashboard" })}
              className="p-2 hover:bg-card rounded-lg transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <h1 className="font-display text-xl">{isLive ? "Live Now" : "Go Live"}</h1>
        </div>
        {isLive && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/30">
              <Circle className="w-2 h-2 fill-red-500 text-red-500 animate-pulse" />
              <span className="text-[9px] font-bold uppercase tracking-widest text-red-500">
                Live
              </span>
            </div>
            <div
              className={`flex items-center gap-2 px-2.5 py-1 rounded-full border ${
                isConnected
                  ? "bg-green-500/10 border-green-500/30"
                  : "bg-yellow-500/10 border-yellow-500/30"
              }`}
            >
              {isConnected ? (
                <Wifi className="w-3 h-3 text-green-500" />
              ) : (
                <WifiOff className="w-3 h-3 text-yellow-500" />
              )}
              <span
                className={`text-[9px] font-bold uppercase tracking-widest ${
                  isConnected ? "text-green-500" : "text-yellow-500"
                }`}
              >
                {isConnected ? "Connected" : "Connecting"}
              </span>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto pb-6">
        {!isLive ? (
          // Setup Mode
          <div className="space-y-6 px-4 py-6">
            {/* Camera Preview */}
            <div className="relative aspect-video rounded-2xl overflow-hidden bg-card/40 border border-border shadow-lg">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />

              {!stream && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-card/80 backdrop-blur-sm">
                  <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
                    <Camera className="w-8 h-8 text-red-500" />
                  </div>
                  <p className="text-sm text-muted-foreground font-medium">
                    Camera preview will appear here
                  </p>
                </div>
              )}
            </div>

            {/* Stream Title */}
            <div className="space-y-3">
              <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-medium">
                Stream Title *
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter stream title..."
                maxLength={100}
                className="w-full bg-card/40 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[color:var(--gold)]/60 transition"
              />
              <p className="text-[10px] text-muted-foreground">{title.length}/100</p>
            </div>

            {/* Description */}
            <div className="space-y-3">
              <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-medium">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tell viewers about your stream..."
                maxLength={5000}
                className="w-full bg-card/40 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[color:var(--gold)]/60 transition resize-none"
                rows={3}
              />
              <p className="text-[10px] text-muted-foreground">{description.length}/5000</p>
            </div>

            {/* Visibility & Audience */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-medium">
                  Visibility
                </label>
                <select
                  value={privacy}
                  onChange={(e) => setPrivacy(e.target.value as "public" | "private" | "unlisted")}
                  className="w-full bg-card/40 border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[color:var(--gold)]/60 transition"
                >
                  <option value="public">Public</option>
                  <option value="unlisted">Unlisted</option>
                  <option value="private">Private</option>
                </select>
              </div>
              <div className="space-y-3">
                <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-medium">
                  Audience
                </label>
                <select
                  value={madeForKids ? "yes" : "no"}
                  onChange={(e) => setMadeForKids(e.target.value === "yes")}
                  className="w-full bg-card/40 border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[color:var(--gold)]/60 transition"
                >
                  <option value="no">General</option>
                  <option value="yes">For Kids</option>
                </select>
              </div>
            </div>

            {/* Thumbnail */}
            <div className="space-y-3">
              <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-medium">
                Thumbnail
              </label>
              {thumbnailPreview ? (
                <div className="relative">
                  <img
                    src={thumbnailPreview}
                    alt="Thumbnail"
                    className="w-full h-32 object-cover rounded-xl border border-border"
                  />
                  <button
                    onClick={() => {
                      setThumbnailFile(null);
                      setThumbnailPreview(null);
                    }}
                    className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="flex items-center justify-center w-full h-32 rounded-xl border-2 border-dashed border-border hover:border-[color:var(--gold)]/50 bg-card/20 cursor-pointer transition">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Upload className="w-5 h-5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Click to upload</span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleThumbnailUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Start Button */}
            <button
              onClick={handleStartStream}
              disabled={starting || !title.trim()}
              className="w-full py-4 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold uppercase tracking-widest shadow-lg shadow-red-600/20 transition flex items-center justify-center gap-3 mt-6"
            >
              {starting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Starting…
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  Start Live Stream
                </>
              )}
            </button>
          </div>
        ) : (
          // Live Mode
          <div className="space-y-6 px-4 py-6">
            {/* Live Camera */}
            <div className="relative aspect-video rounded-2xl overflow-hidden bg-card/40 border border-border shadow-lg">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />
              {!cameraEnabled && (
                <div className="absolute inset-0 flex items-center justify-center bg-card">
                  <VideoOff className="w-16 h-16 text-muted-foreground" />
                </div>
              )}

              {/* Live Stats Overlay */}
              <div className="absolute top-4 right-4 flex flex-col gap-2">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-background/60 backdrop-blur-md border border-white/10">
                  <Users className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-xs font-bold">{viewerCount.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-background/60 backdrop-blur-md border border-white/10">
                  <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-xs font-bold">{duration}</span>
                </div>
              </div>

              {/* Controls */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 p-2 rounded-full bg-background/60 backdrop-blur-md border border-white/10">
                <button
                  onClick={handleToggleCamera}
                  className={`p-2.5 rounded-full transition ${cameraEnabled ? "bg-white/10 hover:bg-white/20" : "bg-red-500 text-white"}`}
                >
                  {cameraEnabled ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                </button>
                <button
                  onClick={handleToggleMic}
                  className={`p-2.5 rounded-full transition ${micEnabled ? "bg-white/10 hover:bg-white/20" : "bg-red-500 text-white"}`}
                >
                  {micEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Channel Info */}
            <div className="p-4 rounded-xl border border-border bg-card/40 space-y-3">
              <div className="flex items-center gap-3">
                <img
                  src={channel.profile_image_url ?? ""}
                  alt={channel.title}
                  className="w-10 h-10 rounded-full border border-[color:var(--gold)]/30"
                />
                <div>
                  <p className="text-sm font-bold">{channel.title}</p>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Broadcasting
                  </p>
                </div>
              </div>
              <div className="pt-3 border-t border-border space-y-2">
                <p className="text-sm font-medium line-clamp-2">{title}</p>
                {description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">{description}</p>
                )}
              </div>
            </div>

            {/* End Stream Button */}
            <button
              onClick={handleEndStream}
              className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold uppercase tracking-widest transition"
            >
              End Stream
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
