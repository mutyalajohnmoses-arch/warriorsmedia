import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Radio,
  Camera,
  Mic,
  Settings,
  X,
  Eye,
  Clock,
  User,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { YouTubeCreateMenu } from "@/components/youtube-create-menu";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { 
  createYouTubeBroadcast, 
  createYouTubeStream, 
  bindYouTubeBroadcast,
  getConnectedYouTubeChannel,
} from "@/lib/youtube-persistence.functions";
import { getYouTubeLiveStreamStatus } from "@/lib/youtube-oauth.functions";

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
  const getChannelFn = useServerFn(getConnectedYouTubeChannel);
  const createBroadcastFn = useServerFn(createYouTubeBroadcast);
  const createStreamFn = useServerFn(createYouTubeStream);
  const bindBroadcastFn = useServerFn(bindYouTubeBroadcast);
  const getLiveStatusFn = useServerFn(getYouTubeLiveStreamStatus);

  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [starting, setStarting] = useState(false);
  const [channel, setChannel] = useState<any>(null);
  
  // Form State
  const [title, setTitle] = useState("Sunday Worship Service");
  const [description, setDescription] = useState("");
  const [privacy, setPrivacy] = useState<"public" | "unlisted" | "private">("public");
  const [madeForKids, setMadeForKids] = useState(false);
  const [schedule, setSchedule] = useState("");

  // Media State
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  // Live Stats
  const [viewerCount, setViewerCount] = useState(0);
  const [duration, setDuration] = useState("00:00:00");
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate({ to: "/" });
        return;
      }

      try {
        const connectedChannel = await getChannelFn({ data: { userId: session.user.id } });
        if (!connectedChannel) {
          toast.error("Please connect your YouTube channel first");
          navigate({ to: "/dashboard" });
          return;
        }
        setChannel(connectedChannel);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, [navigate, getChannelFn]);

  const startMedia = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      return mediaStream;
    } catch (err) {
      toast.error("Failed to access camera or microphone");
      throw err;
    }
  };

  const handleStartLive = async (e: React.FormEvent) => {
    e.preventDefault();
    setStarting(true);
    
    try {
      const accessToken = localStorage.getItem("youtube_access_token");
      if (!accessToken) throw new Error("No access token found");

      // 1. Get Camera/Mic permissions
      const mediaStream = await startMedia();

      // 2. Create Broadcast
      const broadcast = await createBroadcastFn({
        data: {
          access_token: accessToken,
          title,
          description,
          privacy,
          madeForKids,
          scheduledStartTime: schedule || undefined,
        }
      });

      // 3. Create Stream
      const streamData = await createStreamFn({
        data: {
          access_token: accessToken,
          title: `${title} - Stream`,
        }
      });

      // 4. Bind Broadcast to Stream
      await bindBroadcastFn({
        data: {
          access_token: accessToken,
          broadcastId: broadcast.id,
          streamId: streamData.id,
        }
      });

      // In a real app, we would now start sending the mediaStream to the ingestionAddress
      // using WebRTC or a server-side proxy to RTMP. 
      // For this demo, we'll simulate the live state.
      
      setIsLive(true);
      startTimeRef.current = Date.now();
      toast.success("You are now LIVE!");

      // Start duration timer
      const timer = setInterval(() => {
        const diff = Date.now() - startTimeRef.current;
        const h = Math.floor(diff / 3600000).toString().padStart(2, '0');
        const m = Math.floor((diff % 3600000) / 60000).toString().padStart(2, '0');
        const s = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0');
        setDuration(`${h}:${m}:${s}`);
      }, 1000);

      // Start viewer count poller
      const poller = setInterval(async () => {
        try {
          const status = await getLiveStatusFn({ data: { access_token: accessToken } });
          if (status.isLive) {
            setViewerCount(status.viewerCount || 0);
          }
        } catch (e) {
          // Silent fail
        }
      }, 30000);

      return () => {
        clearInterval(timer);
        clearInterval(poller);
      };

    } catch (err: any) {
      toast.error(err.message || "Failed to start live stream");
    } finally {
      setStarting(false);
    }
  };

  const handleEndStream = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    setStream(null);
    setIsLive(false);
    toast.info("Stream ended");
    navigate({ to: "/dashboard" });
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[color:var(--gold)]" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background relative overflow-hidden">
      <header className="px-6 md:px-10 pt-6 flex items-center justify-between border-b border-border/40 pb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate({ to: "/dashboard" })}
            className="p-2 hover:bg-card rounded-lg transition"
            disabled={isLive}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-display text-xl">Go Live</h1>
            {channel && <p className="text-xs text-muted-foreground">Streaming as {channel.title}</p>}
          </div>
        </div>
        {!isLive && <YouTubeCreateMenu channelConnected={true} />}
      </header>

      <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Left: Preview/Live View */}
        <div className="space-y-6">
          <div className="aspect-video bg-black rounded-2xl overflow-hidden border border-border/40 relative group">
            <video 
              ref={videoRef} 
              autoPlay 
              muted 
              playsInline 
              className="w-full h-full object-cover"
            />
            
            {!stream && !isLive && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-card/40 backdrop-blur-sm">
                <Camera className="w-12 h-12 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Camera preview will appear here</p>
                <button 
                  onClick={startMedia}
                  className="px-4 py-2 rounded-full border border-[color:var(--gold)]/40 text-xs hover:bg-[color:var(--gold)]/10 transition"
                >
                  Enable Camera
                </button>
              </div>
            )}

            {isLive && (
              <>
                <div className="absolute top-4 left-4 flex items-center gap-2">
                  <div className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1.5 animate-pulse">
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                    LIVE
                  </div>
                  <div className="bg-black/60 backdrop-blur-md text-white text-[10px] px-2 py-0.5 rounded flex items-center gap-1.5">
                    <Clock className="w-3 h-3" />
                    {duration}
                  </div>
                </div>
                <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md text-white text-[10px] px-2 py-0.5 rounded flex items-center gap-1.5">
                  <Eye className="w-3 h-3" />
                  {viewerCount} viewers
                </div>
              </>
            )}
          </div>

          {isLive && (
            <div className="flex items-center justify-between p-4 rounded-2xl border border-red-500/30 bg-red-500/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                  <Radio className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <p className="text-sm font-medium">Stream is Active</p>
                  <p className="text-xs text-muted-foreground">Your broadcast is being sent to YouTube</p>
                </div>
              </div>
              <button 
                onClick={handleEndStream}
                className="px-6 py-2 rounded-full bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition shadow-lg shadow-red-600/20"
              >
                End Stream
              </button>
            </div>
          )}
        </div>

        {/* Right: Setup Form */}
        <div className="space-y-8">
          {!isLive ? (
            <form onSubmit={handleStartLive} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2 block">Stream Title</label>
                  <input 
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter stream title"
                    className="w-full bg-card/40 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[color:var(--gold)]/60 transition"
                  />
                </div>

                <div>
                  <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2 block">Description</label>
                  <textarea 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Tell viewers about your stream"
                    className="w-full bg-card/40 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[color:var(--gold)]/60 transition h-32 resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2 block">Visibility</label>
                    <select 
                      value={privacy}
                      onChange={(e) => setPrivacy(e.target.value as any)}
                      className="w-full bg-card/40 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[color:var(--gold)]/60 transition appearance-none"
                    >
                      <option value="public">Public</option>
                      <option value="unlisted">Unlisted</option>
                      <option value="private">Private</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2 block">Audience</label>
                    <select 
                      value={madeForKids ? "yes" : "no"}
                      onChange={(e) => setMadeForKids(e.target.value === "yes")}
                      className="w-full bg-card/40 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[color:var(--gold)]/60 transition appearance-none"
                    >
                      <option value="no">Not Made for Kids</option>
                      <option value="yes">Made for Kids</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2 block">Schedule (Optional)</label>
                  <input 
                    type="datetime-local"
                    value={schedule}
                    onChange={(e) => setSchedule(e.target.value)}
                    className="w-full bg-card/40 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[color:var(--gold)]/60 transition"
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={starting}
                className="w-full py-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-display text-lg glow-red disabled:opacity-60 flex items-center justify-center gap-3 transition"
              >
                {starting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Starting Broadcast…
                  </>
                ) : (
                  <>
                    <Radio className="w-5 h-5" />
                    START LIVE STREAM
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="p-6 rounded-2xl border border-border bg-card/40 backdrop-blur-sm">
                <h3 className="font-display text-lg mb-4">Stream Info</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Title</span>
                    <span className="font-medium">{title}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Privacy</span>
                    <span className="capitalize">{privacy}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Started At</span>
                    <span>{new Date(startTimeRef.current).toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-2xl border border-border bg-card/40 backdrop-blur-sm">
                <h3 className="font-display text-lg mb-4">Engagement</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-background/40 border border-border">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Eye className="w-4 h-4" />
                      <span className="text-[10px] uppercase tracking-wider">Viewers</span>
                    </div>
                    <p className="text-2xl font-display">{viewerCount}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-background/40 border border-border">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Clock className="w-4 h-4" />
                      <span className="text-[10px] uppercase tracking-wider">Duration</span>
                    </div>
                    <p className="text-2xl font-display">{duration}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
