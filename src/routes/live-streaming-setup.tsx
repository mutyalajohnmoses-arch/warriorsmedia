import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2, AlertCircle, CheckCircle2, Copy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  fetchYouTubeChannels,
  createYouTubeBroadcast,
  createYouTubeStream,
  bindStreamToBroadcast,
} from "@/lib/youtube";

export const Route = createFileRoute("/live-streaming-setup")({
  head: () => ({
    meta: [
      { title: "YouTube Live Streaming Setup — Warriors Media" },
      { name: "description", content: "Set up your YouTube live stream." },
    ],
  }),
  component: LiveStreamingSetup,
});

interface LiveStreamDetails {
  title: string;
  description: string;
  scheduledStartTime?: string;
  scheduledEndTime?: string;
  privacyStatus: "public" | "private" | "unlisted";
  enableAutoStart: boolean;
  enableAutoStop: boolean;
  enableDvr: boolean;
  enableEmbedding: boolean;
  isReusable: boolean;
}

interface StreamInfo {
  rtmpUrl: string;
  streamKey: string;
}

function LiveStreamingSetup() {
  const navigate = useNavigate();
  const [session, setSession] = useState<{ user: { id: string }; provider_token: string } | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [youtubeChannels, setYoutubeChannels] = useState<
    { id: string; snippet: { title: string; thumbnails: { default: { url: string } } } }[]
  >([]);
  const [selectedChannel, setSelectedChannel] = useState<string>("");
  const [streamDetails, setStreamDetails] = useState<LiveStreamDetails>({
    title: "",
    description: "",
    privacyStatus: "public",
    enableAutoStart: false,
    enableAutoStop: false,
    enableDvr: true,
    enableEmbedding: true,
    isReusable: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [streamInfo, setStreamInfo] = useState<StreamInfo | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) {
          navigate({ to: "/" });
          return;
        }
        setSession(session);

        // Fetch YouTube channels
        if (session.provider_token) {
          await fetchYoutubeChannels(session.provider_token);
        }
      } catch (err) {
        console.error("Auth check error:", err);
        navigate({ to: "/" });
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, [navigate]);

  const fetchYoutubeChannels = async (accessToken: string) => {
    try {
      const channels = await fetchYouTubeChannels(accessToken);
      setYoutubeChannels(
        channels.map((ch) => ({
          id: ch.id,
          snippet: { title: ch.title, thumbnails: { default: { url: ch.thumbnail } } },
        })),
      );

      if (channels.length > 0) {
        setSelectedChannel(channels[0].id);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to fetch channels";
      setError(errorMsg);
      toast.error(errorMsg);
    }
  };

  const handleCreateStream = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChannel || !session?.provider_token) {
      toast.error("Please select a channel and ensure you're authenticated");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // Create broadcast
      const broadcastId = await createYouTubeBroadcast(
        session.provider_token,
        streamDetails.title,
        streamDetails.description,
        streamDetails.privacyStatus,
        streamDetails.scheduledStartTime,
        streamDetails.scheduledEndTime,
        {
          enableAutoStart: streamDetails.enableAutoStart,
          enableAutoStop: streamDetails.enableAutoStop,
          enableDvr: streamDetails.enableDvr,
          enableEmbedding: streamDetails.enableEmbedding,
          isReusable: streamDetails.isReusable,
        },
      );

      // Create stream
      const { streamId, rtmpUrl, streamKey } = await createYouTubeStream(
        session.provider_token,
        selectedChannel,
        streamDetails.title,
        streamDetails.description,
        streamDetails.isReusable,
      );

      // Bind stream to broadcast
      await bindStreamToBroadcast(session.provider_token, broadcastId, streamId);

      // Save stream info for display
      setStreamInfo({ rtmpUrl, streamKey });
      setSuccess(true);
      toast.success("Live stream created successfully!");

      // Save to database
      await supabase.from("live_streams").insert({
        user_id: session.user.id,
        broadcast_id: broadcastId,
        stream_id: streamId,
        channel_id: selectedChannel,
        title: streamDetails.title,
        description: streamDetails.description,
        privacy_status: streamDetails.privacyStatus,
        status: "ready",
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "An error occurred";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[color:var(--gold)]" />
      </main>
    );
  }

  return (
    <main className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-[radial-gradient(circle,oklch(0.78_0.16_80/0.12),transparent_70%)]" />
      </div>

      {/* Header */}
      <header className="px-6 md:px-10 pt-6 flex items-center gap-4">
        <button
          onClick={() => navigate({ to: "/dashboard" })}
          className="p-2 hover:bg-card rounded-lg transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-display text-2xl">YouTube Live Streaming Setup</h1>
      </header>

      {/* Content */}
      <section className="px-6 md:px-10 py-12 max-w-2xl mx-auto">
        {error && (
          <div className="mb-6 p-4 rounded-lg border border-red-500/50 bg-red-500/10 flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-red-500">Error</p>
              <p className="text-sm text-red-400">{error}</p>
            </div>
          </div>
        )}

        {success && streamInfo && (
          <div className="mb-6 p-4 rounded-lg border border-green-500/50 bg-green-500/10">
            <div className="flex gap-3 mb-4">
              <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-green-500">Success!</p>
                <p className="text-sm text-green-400">
                  Your live stream has been created. Use the details below to start streaming.
                </p>
              </div>
            </div>

            <div className="space-y-3 mt-4 bg-background/40 p-3 rounded">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--gold-soft)] mb-2">
                  RTMP URL
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs bg-background/60 p-2 rounded border border-border overflow-auto">
                    {streamInfo.rtmpUrl}
                  </code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(streamInfo.rtmpUrl);
                      toast.success("RTMP URL copied!");
                    }}
                    className="p-2 hover:bg-card rounded transition"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--gold-soft)] mb-2">
                  Stream Key
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs bg-background/60 p-2 rounded border border-border overflow-auto">
                    {streamInfo.streamKey}
                  </code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(streamInfo.streamKey);
                      toast.success("Stream key copied!");
                    }}
                    className="p-2 hover:bg-card rounded transition"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={() => navigate({ to: "/dashboard" })}
              className="w-full mt-4 py-2 rounded-lg bg-gold-gradient text-[color:var(--primary-foreground)] font-medium text-sm hover:scale-[1.01] transition"
            >
              Back to Dashboard
            </button>
          </div>
        )}

        {!success && (
          <form onSubmit={handleCreateStream} className="space-y-6">
            {/* Channel Selection */}
            <div>
              <label className="text-xs uppercase tracking-[0.2em] text-[color:var(--gold-soft)] mb-3 block">
                YouTube Channel
              </label>
              <select
                value={selectedChannel}
                onChange={(e) => setSelectedChannel(e.target.value)}
                className="w-full bg-background/60 border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[color:var(--gold)]/60 transition"
              >
                <option value="">Select a channel...</option>
                {youtubeChannels.map((channel) => (
                  <option key={channel.id} value={channel.id}>
                    {channel.snippet.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Title */}
            <div>
              <label className="text-xs uppercase tracking-[0.2em] text-[color:var(--gold-soft)] mb-3 block">
                Stream Title
              </label>
              <input
                type="text"
                required
                value={streamDetails.title}
                onChange={(e) => setStreamDetails({ ...streamDetails, title: e.target.value })}
                placeholder="e.g., Sunday Worship Service"
                className="w-full bg-background/60 border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[color:var(--gold)]/60 transition"
              />
            </div>

            {/* Description */}
            <div>
              <label className="text-xs uppercase tracking-[0.2em] text-[color:var(--gold-soft)] mb-3 block">
                Description
              </label>
              <textarea
                value={streamDetails.description}
                onChange={(e) =>
                  setStreamDetails({ ...streamDetails, description: e.target.value })
                }
                placeholder="Describe your live stream..."
                rows={4}
                className="w-full bg-background/60 border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[color:var(--gold)]/60 transition resize-none"
              />
            </div>

            {/* Scheduled Start Time */}
            <div>
              <label className="text-xs uppercase tracking-[0.2em] text-[color:var(--gold-soft)] mb-3 block">
                Scheduled Start Time (Optional)
              </label>
              <input
                type="datetime-local"
                value={streamDetails.scheduledStartTime || ""}
                onChange={(e) =>
                  setStreamDetails({ ...streamDetails, scheduledStartTime: e.target.value })
                }
                className="w-full bg-background/60 border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[color:var(--gold)]/60 transition"
              />
            </div>

            {/* Scheduled End Time */}
            <div>
              <label className="text-xs uppercase tracking-[0.2em] text-[color:var(--gold-soft)] mb-3 block">
                Scheduled End Time (Optional)
              </label>
              <input
                type="datetime-local"
                value={streamDetails.scheduledEndTime || ""}
                onChange={(e) =>
                  setStreamDetails({ ...streamDetails, scheduledEndTime: e.target.value })
                }
                className="w-full bg-background/60 border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[color:var(--gold)]/60 transition"
              />
            </div>

            {/* Privacy Status */}
            <div>
              <label className="text-xs uppercase tracking-[0.2em] text-[color:var(--gold-soft)] mb-3 block">
                Privacy Status
              </label>
              <select
                value={streamDetails.privacyStatus}
                onChange={(e) =>
                  setStreamDetails({
                    ...streamDetails,
                    privacyStatus: e.target.value as "public" | "private" | "unlisted",
                  })
                }
                className="w-full bg-background/60 border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[color:var(--gold)]/60 transition"
              >
                <option value="public">Public</option>
                <option value="unlisted">Unlisted</option>
                <option value="private">Private</option>
              </select>
            </div>

            {/* Advanced Options */}
            <div className="space-y-4 p-4 rounded-lg border border-border bg-card/30">
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--gold-soft)]">
                Advanced Options
              </p>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={streamDetails.enableAutoStart}
                  onChange={(e) =>
                    setStreamDetails({ ...streamDetails, enableAutoStart: e.target.checked })
                  }
                  className="w-4 h-4 rounded border-border"
                />
                <span className="text-sm">Auto-start stream</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={streamDetails.enableAutoStop}
                  onChange={(e) =>
                    setStreamDetails({ ...streamDetails, enableAutoStop: e.target.checked })
                  }
                  className="w-4 h-4 rounded border-border"
                />
                <span className="text-sm">Auto-stop stream</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={streamDetails.enableDvr}
                  onChange={(e) =>
                    setStreamDetails({ ...streamDetails, enableDvr: e.target.checked })
                  }
                  className="w-4 h-4 rounded border-border"
                />
                <span className="text-sm">Enable DVR (allows rewinding)</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={streamDetails.enableEmbedding}
                  onChange={(e) =>
                    setStreamDetails({ ...streamDetails, enableEmbedding: e.target.checked })
                  }
                  className="w-4 h-4 rounded border-border"
                />
                <span className="text-sm">Allow embedding</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={streamDetails.isReusable}
                  onChange={(e) =>
                    setStreamDetails({ ...streamDetails, isReusable: e.target.checked })
                  }
                  className="w-4 h-4 rounded border-border"
                />
                <span className="text-sm">Reusable stream (for recurring broadcasts)</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting || !selectedChannel || !streamDetails.title}
              className="w-full py-3.5 rounded-lg bg-gold-gradient text-[color:var(--primary-foreground)] font-medium glow-gold flex items-center justify-center gap-2 hover:scale-[1.01] transition disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating Stream...
                </>
              ) : (
                "Create Live Stream"
              )}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
