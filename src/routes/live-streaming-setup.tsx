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
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { YouTubeCreateMenu } from "@/components/youtube-create-menu";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { createYouTubeLiveStream, getYouTubeLiveStreamStatus } from "@/lib/youtube-oauth.functions";
import { getConnectedYouTubeChannel } from "@/lib/youtube-persistence.functions";

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
  const createStreamFn = useServerFn(createYouTubeLiveStream);
  const getStatusFn = useServerFn(getYouTubeLiveStreamStatus);
  const getChannelFn = useServerFn(getConnectedYouTubeChannel);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [channel, setChannel] = useState<any>(null);

  // Stream Configuration
  const [title, setTitle] = useState("Sunday Worship Service");
  const [description, setDescription] = useState("");
  const [privacy, setPrivacy] = useState<"public" | "private" | "unlisted">("public");
  const [madeForKids, setMadeForKids] = useState(false);
  const [scheduleTime, setScheduleTime] = useState("");

  // Media State
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [micEnabled, setMicEnabled] = useState(true);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Live Stats
  const [viewerCount, setViewerCount] = useState(0);
  const [duration, setDuration] = useState("00:00:00");
  const startTimeRef = useRef<number | null>(null);
  const [broadcastId, setBroadcastId] = useState<string | null>(null);
  const initRef = useRef(false);

  // Initialize on mount
  useEffect(() => {
    if (initRef.current) return; // Prevent double initialization
    initRef.current = true;

    const init = async () => {
      try {
        setLoading(true);
        setError(null);

        // Check authentication
        console.log("Checking authentication...");
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("Session error:", sessionError);
          throw new Error("Failed to get session");
        }
        
        if (!session) {
          console.log("No session found, redirecting to login");
          navigate({ to: "/" });
          return;
        }

        console.log("Session found for user:", session.user.id);

        // Fetch connected YouTube channel
        try {
          console.log("Fetching YouTube channel for user:", session.user.id);
          const channelData = await getChannelFn({ data: { userId: session.user.id } });
          console.log("Channel data received:", channelData);
          
          if (!channelData) {
            console.log("No YouTube channel connected");
            setError("YouTube channel not connected");
            setLoading(false);
            return;
          }
          
          setChannel(channelData);
          setLoading(false);
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : "Failed to fetch YouTube channel";
          console.error("Error fetching YouTube channel:", err);
          setError(errorMsg);
          setLoading(false);
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "An error occurred";
        console.error("Initialization error:", err);
        setError(errorMsg);
        setLoading(false);
      }
    };

    init();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [navigate, getChannelFn]);

  // Timer and stats polling when live
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    let statsInterval: ReturnType<typeof setInterval> | null = null;

    if (isLive) {
      startTimeRef.current = Date.now();
      
      // Update duration every second
      interval = setInterval(() => {
        const diff = Date.now() - (startTimeRef.current || Date.now());
        const h = Math.floor(diff / 3600000).toString().padStart(2, "0");
        const m = Math.floor((diff % 3600000) / 60000).toString().padStart(2, "0");
        const s = Math.floor((diff % 60000) / 1000).toString().padStart(2, "0");
        setDuration(`${h}:${m}:${s}`);
      }, 1000);

      // Poll viewer count every 30 seconds
      const pollStats = async () => {
        try {
          const accessToken = localStorage.getItem("youtube_access_token");
          if (accessToken) {
            const status = await getStatusFn({ data: { access_token: accessToken } });
            if (status.isLive) {
              setViewerCount(status.viewerCount || 0);
            }
          }
        } catch (e) {
          console.error("Failed to poll stats:", e);
        }
      };
      
      statsInterval = setInterval(pollStats, 30000);
    }

    return () => {
      if (interval) clearInterval(interval);
      if (statsInterval) clearInterval(statsInterval);
    };
  }, [isLive, getStatusFn]);

  const startMedia = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: true,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
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
      const accessToken = localStorage.getItem("youtube_access_token");
      if (!accessToken) throw new Error("YouTube access token not found");

      // 1. Request media permissions and start preview
      await startMedia();

      // 2. Create YouTube Broadcast & Stream
      const result = await createStreamFn({
        data: {
          access_token: accessToken,
          title,
          description,
          privacy,
          madeForKids,
        }
      });

      setBroadcastId(result.broadcastId);

      // 3. Save to database
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await supabase.from("live_streams").insert({
          user_id: session.user.id,
          broadcast_id: result.broadcastId,
          stream_id: result.streamId,
          channel_id: channel.channel_id,
          title,
          description,
          privacy_status: privacy,
          status: "live",
        });
      }

      setIsLive(true);
      toast.success("Live stream started! You're now broadcasting.");
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Failed to start stream");
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
    } finally {
      setStarting(false);
    }
  };

  const handleEndStream = async () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    setIsLive(false);
    toast.success("Live stream ended");
    setTimeout(() => navigate({ to: "/dashboard" }), 1500);
  };

  const toggleCamera = () => {
    if (stream) {
      const track = stream.getVideoTracks()[0];
      if (track) {
        track.enabled = !track.enabled;
        setCameraEnabled(track.enabled);
      }
    }
  };

  const toggleMic = () => {
    if (stream) {
      const track = stream.getAudioTracks()[0];
      if (track) {
        track.enabled = !track.enabled;
        setMicEnabled(track.enabled);
      }
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
              <h1 className="font-display text-2xl">Unable to Load</h1>
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
  if (!channel) {
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

  return (
    <main className="min-h-screen relative overflow-hidden bg-background">
      <div className="absolute inset-0 -z-10">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-accent/5 blur-[120px]" />
      </div>

      <header className="px-6 md:px-10 pt-6 flex items-center justify-between sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="flex items-center gap-4">
          {!isLive && (
            <button
              onClick={() => navigate({ to: "/dashboard" })}
              className="p-2 hover:bg-card rounded-lg transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <h1 className="font-display text-2xl">
            {isLive ? "Streaming Live" : "Go Live"}
          </h1>
        </div>
        {isLive && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/30">
              <Circle className="w-2 h-2 fill-red-500 text-red-500 animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-red-500">Live</span>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                {viewerCount.toLocaleString()}
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                {duration}
              </div>
            </div>
          </div>
        )}
      </header>

      <section className="px-6 md:px-10 py-10 max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Camera Preview - Left Column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="relative aspect-video rounded-2xl overflow-hidden bg-card/40 border border-border shadow-2xl">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className={`w-full h-full object-cover ${!cameraEnabled ? "hidden" : ""}`}
            />
            {!cameraEnabled && (
              <div className="absolute inset-0 flex items-center justify-center bg-card">
                <VideoOff className="w-16 h-16 text-muted-foreground" />
              </div>
            )}
            {!stream && !isLive && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-card/80 backdrop-blur-sm">
                <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
                  <Camera className="w-8 h-8 text-red-500" />
                </div>
                <p className="text-sm text-muted-foreground font-medium">Camera preview will appear here</p>
              </div>
            )}

            {/* Controls Overlay */}
            {stream && isLive && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 p-3 rounded-full bg-background/60 backdrop-blur-md border border-white/10">
                <button
                  onClick={toggleCamera}
                  className={`p-3 rounded-full transition ${cameraEnabled ? "bg-white/10 hover:bg-white/20" : "bg-red-500 text-white"}`}
                  title={cameraEnabled ? "Turn off camera" : "Turn on camera"}
                >
                  {cameraEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                </button>
                <button
                  onClick={toggleMic}
                  className={`p-3 rounded-full transition ${micEnabled ? "bg-white/10 hover:bg-white/20" : "bg-red-500 text-white"}`}
                  title={micEnabled ? "Mute microphone" : "Unmute microphone"}
                >
                  {micEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                </button>
              </div>
            )}
          </div>

          {isLive && (
            <button
              onClick={handleEndStream}
              className="w-full py-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold uppercase tracking-widest transition shadow-lg shadow-red-600/20"
            >
              End Stream
            </button>
          )}
        </div>

        {/* Configuration Panel - Right Column */}
        <div className="space-y-6">
          {!isLive ? (
            <div className="p-6 rounded-2xl border border-border bg-card/40 backdrop-blur-xl space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
              {/* Stream Title */}
              <div>
                <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2 block font-medium">
                  Stream Title *
                </label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter stream title..."
                  maxLength={100}
                  className="w-full bg-background/60 border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[color:var(--gold)]/60 transition"
                />
                <p className="text-[10px] text-muted-foreground mt-1">{title.length}/100</p>
              </div>

              {/* Description */}
              <div>
                <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2 block font-medium">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tell viewers about your stream..."
                  maxLength={5000}
                  className="w-full bg-background/60 border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[color:var(--gold)]/60 transition resize-none"
                  rows={3}
                />
                <p className="text-[10px] text-muted-foreground mt-1">{description.length}/5000</p>
              </div>

              {/* Thumbnail Upload */}
              <div>
                <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2 block font-medium">
                  Thumbnail
                </label>
                {thumbnailPreview ? (
                  <div className="relative">
                    <img
                      src={thumbnailPreview}
                      alt="Thumbnail preview"
                      className="w-full h-32 object-cover rounded-lg border border-border"
                    />
                    <button
                      onClick={() => {
                        setThumbnailFile(null);
                        setThumbnailPreview(null);
                      }}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex items-center justify-center w-full h-32 rounded-lg border-2 border-dashed border-border hover:border-[color:var(--gold)]/50 bg-card/40 cursor-pointer transition">
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

              {/* Visibility */}
              <div>
                <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2 block font-medium">
                  Visibility
                </label>
                <select
                  value={privacy}
                  onChange={(e) => setPrivacy(e.target.value as any)}
                  className="w-full bg-background/60 border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[color:var(--gold)]/60 transition"
                >
                  <option value="public">Public</option>
                  <option value="unlisted">Unlisted</option>
                  <option value="private">Private</option>
                </select>
              </div>

              {/* Audience */}
              <div>
                <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2 block font-medium">
                  Audience
                </label>
                <select
                  value={madeForKids ? "yes" : "no"}
                  onChange={(e) => setMadeForKids(e.target.value === "yes")}
                  className="w-full bg-background/60 border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[color:var(--gold)]/60 transition"
                >
                  <option value="no">Not Made for Kids</option>
                  <option value="yes">Made for Kids</option>
                </select>
              </div>

              {/* Schedule (Optional) */}
              <div>
                <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2 block font-medium">
                  Schedule (Optional)
                </label>
                <input
                  type="datetime-local"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                  className="w-full bg-background/60 border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[color:var(--gold)]/60 transition"
                />
              </div>

              {/* Start Button */}
              <button
                onClick={handleStartStream}
                disabled={starting || !title.trim()}
                className="w-full py-4 rounded-lg bg-gold-gradient text-[color:var(--primary-foreground)] font-bold uppercase tracking-widest shadow-lg shadow-gold/20 disabled:opacity-50 transition flex items-center justify-center gap-3"
              >
                {starting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Starting…
                  </>
                ) : (
                  <>
                    <Radio className="w-5 h-5" />
                    Start Live Stream
                  </>
                )}
              </button>
            </div>
          ) : (
            /* Live Mode Info Panel */
            <div className="p-6 rounded-2xl border border-[color:var(--gold)]/30 bg-card/40 backdrop-blur-xl space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <img
                  src={channel.profile_image_url}
                  alt={channel.title}
                  className="w-12 h-12 rounded-full border border-[color:var(--gold)]/30"
                />
                <div>
                  <p className="text-sm font-bold">{channel.title}</p>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Broadcasting Now</p>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-border">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 font-medium">Title</p>
                  <p className="text-sm font-medium line-clamp-2">{title}</p>
                </div>
                {description && (
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 font-medium">Description</p>
                    <p className="text-xs text-muted-foreground line-clamp-3">{description}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 font-medium">Visibility</p>
                    <p className="text-xs font-bold uppercase text-[color:var(--gold-soft)]">{privacy}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 font-medium">Audience</p>
                    <p className="text-xs font-bold uppercase text-[color:var(--gold-soft)]">
                      {madeForKids ? "For Kids" : "General"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
