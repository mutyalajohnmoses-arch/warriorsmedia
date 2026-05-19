import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Copy,
  Sparkles,
  Hash,
  Youtube,
  RefreshCw,
  ImageIcon,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import {
  fetchYouTubeChannels,
  createYouTubeBroadcast,
  createYouTubeStream,
  bindStreamToBroadcast,
} from "@/lib/youtube";
import { generateThumbnail, generateHashtags } from "@/lib/ai.functions";

export const Route = createFileRoute("/live-streaming-setup")({
  head: () => ({
    meta: [
      { title: "YouTube Live Streaming Setup — Warriors Media" },
      { name: "description", content: "Set up your YouTube live stream." },
    ],
  }),
  component: LiveStreamingSetup,
});

interface YTChannel {
  id: string;
  title: string;
  thumbnail: string;
}

interface StreamInfo {
  rtmpUrl: string;
  streamKey: string;
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [meta, b64] = dataUrl.split(",");
  const mime = /data:(.*?);base64/.exec(meta)?.[1] ?? "image/png";
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

function LiveStreamingSetup() {
  const navigate = useNavigate();
  const genThumb = useServerFn(generateThumbnail);
  const genTags = useServerFn(generateHashtags);

  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [providerToken, setProviderToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [channelsLoading, setChannelsLoading] = useState(false);
  const [channels, setChannels] = useState<YTChannel[]>([]);
  const [channelError, setChannelError] = useState<string | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<string>("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [scheduledStart, setScheduledStart] = useState("");
  const [scheduledEnd, setScheduledEnd] = useState("");
  const [privacy, setPrivacy] = useState<"public" | "private" | "unlisted">("public");
  const [autoStart, setAutoStart] = useState(false);
  const [autoStop, setAutoStop] = useState(false);
  const [enableDvr, setEnableDvr] = useState(true);
  const [enableEmbedding, setEnableEmbedding] = useState(true);
  const [isReusable, setIsReusable] = useState(false);

  const [thumbPrompt, setThumbPrompt] = useState("");
  const [thumbLoading, setThumbLoading] = useState(false);
  const [thumbDataUrl, setThumbDataUrl] = useState<string | null>(null);

  const [hashtags, setHashtags] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [tagsLoading, setTagsLoading] = useState(false);
  const tagTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [streamInfo, setStreamInfo] = useState<StreamInfo | null>(null);

  const loadChannels = async (token: string) => {
    setChannelsLoading(true);
    setChannelError(null);
    try {
      const list = await fetchYouTubeChannels(token);
      setChannels(list);
      if (list.length > 0) setSelectedChannel(list[0].id);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load channels";
      setChannelError(msg);
    } finally {
      setChannelsLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        navigate({ to: "/" });
        return;
      }
      setUserId(session.user.id);
      setUserEmail(session.user.email ?? null);
      const token = session.provider_token ?? null;
      setProviderToken(token);
      if (token) await loadChannels(token);
      setLoading(false);
    })();
  }, [navigate]);

  const reconnectYouTube = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.href,
        scopes:
          "openid email profile https://www.googleapis.com/auth/youtube https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/youtube.upload",
        queryParams: {
          access_type: "offline",
          prompt: "consent",
          include_granted_scopes: "true",
        },
      },
    });
    if (error) toast.error(error.message ?? "Reconnect failed.");
  };

  // Debounced hashtag generation on title change
  useEffect(() => {
    if (tagTimer.current) clearTimeout(tagTimer.current);
    if (title.trim().length < 4) {
      setHashtags([]);
      return;
    }
    tagTimer.current = setTimeout(async () => {
      setTagsLoading(true);
      try {
        const res = await genTags({ data: { title: title.trim() } });
        setHashtags(res.hashtags);
        setSelectedTags(new Set(res.hashtags));
      } catch (err) {
        console.error(err);
      } finally {
        setTagsLoading(false);
      }
    }, 700);
    return () => {
      if (tagTimer.current) clearTimeout(tagTimer.current);
    };
  }, [title, genTags]);

  const toggleTag = (t: string) => {
    setSelectedTags((prev) => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next;
    });
  };

  const handleGenerateThumb = async () => {
    if (thumbPrompt.trim().length < 3) {
      toast.error("Enter a thumbnail prompt");
      return;
    }
    setThumbLoading(true);
    try {
      const res = await genThumb({ data: { prompt: thumbPrompt.trim(), title } });
      setThumbDataUrl(res.imageDataUrl);
      toast.success("Thumbnail generated! It will be uploaded with the stream.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setThumbLoading(false);
    }
  };

  const uploadThumbnail = async (token: string, videoId: string, dataUrl: string) => {
    const blob = dataUrlToBlob(dataUrl);
    const res = await fetch(
      `https://www.googleapis.com/upload/youtube/v3/thumbnails/set?videoId=${videoId}&uploadType=media`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": blob.type },
        body: blob,
      },
    );
    if (!res.ok) {
      const t = await res.text();
      throw new Error(`Thumbnail upload failed: ${t.slice(0, 200)}`);
    }
  };

  const finalDescription = () => {
    const tagLine = Array.from(selectedTags)
      .map((t) => `#${t}`)
      .join(" ");
    return tagLine ? `${description}\n\n${tagLine}` : description;
  };

  const handleCreateStream = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!providerToken || !selectedChannel || !userId) {
      toast.error("Connect YouTube and select a channel first");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const desc = finalDescription();
      const broadcastId = await createYouTubeBroadcast(
        providerToken,
        title,
        desc,
        privacy,
        scheduledStart || undefined,
        scheduledEnd || undefined,
        { enableAutoStart: autoStart, enableAutoStop: autoStop, enableDvr, enableEmbedding, isReusable },
      );
      const { streamId, rtmpUrl, streamKey } = await createYouTubeStream(
        providerToken,
        selectedChannel,
        title,
        desc,
        isReusable,
      );
      await bindStreamToBroadcast(providerToken, broadcastId, streamId);

      if (thumbDataUrl) {
        try {
          await uploadThumbnail(providerToken, broadcastId, thumbDataUrl);
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "Thumbnail upload failed");
        }
      }

      setStreamInfo({ rtmpUrl, streamKey });
      setSuccess(true);
      toast.success("Live stream created!");

      await supabase.from("live_streams").insert({
        user_id: userId,
        broadcast_id: broadcastId,
        stream_id: streamId,
        channel_id: selectedChannel,
        title,
        description: desc,
        privacy_status: privacy,
        status: "ready",
        thumbnail_url: thumbDataUrl ? "uploaded" : null,
        hashtags: Array.from(selectedTags),
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "An error occurred";
      setError(msg);
      toast.error(msg);
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
    <main className="min-h-screen relative overflow-hidden pb-20">
      <div className="absolute inset-0 -z-10">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-[radial-gradient(circle,oklch(0.78_0.16_80/0.12),transparent_70%)]" />
      </div>

      <header className="px-6 md:px-10 pt-6 flex items-center gap-4">
        <button
          onClick={() => navigate({ to: "/dashboard" })}
          className="p-2 hover:bg-card rounded-lg transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-display text-2xl">YouTube Live Streaming Setup</h1>
      </header>

      <section className="px-6 md:px-10 py-10 max-w-2xl mx-auto">
        {error && (
          <div className="mb-6 p-4 rounded-lg border border-red-500/50 bg-red-500/10 flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-red-500">Error</p>
              <p className="text-sm text-red-400 break-all">{error}</p>
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
                  Your live stream is ready. Use the details below to start streaming.
                </p>
              </div>
            </div>
            <div className="space-y-3 mt-4 bg-background/40 p-3 rounded">
              {(
                [
                  ["RTMP URL", streamInfo.rtmpUrl],
                  ["Stream Key", streamInfo.streamKey],
                ] as const
              ).map(([label, val]) => (
                <div key={label}>
                  <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--gold-soft)] mb-2">
                    {label}
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-xs bg-background/60 p-2 rounded border border-border overflow-auto break-all">
                      {val}
                    </code>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(val);
                        toast.success(`${label} copied!`);
                      }}
                      className="p-2 hover:bg-card rounded transition"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => navigate({ to: "/dashboard" })}
              className="w-full mt-4 py-2 rounded-lg bg-gold-gradient text-[color:var(--primary-foreground)] font-medium text-sm"
            >
              Back to Dashboard
            </button>
          </div>
        )}

        {!success && (
          <form onSubmit={handleCreateStream} className="space-y-8">
            {/* CHANNELS */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs uppercase tracking-[0.2em] text-[color:var(--gold-soft)] flex items-center gap-2">
                  <Youtube className="w-3.5 h-3.5" /> YouTube Channels
                </label>
                {providerToken && (
                  <button
                    type="button"
                    onClick={() => providerToken && loadChannels(providerToken)}
                    className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground hover:text-[color:var(--gold)] inline-flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" /> Refresh
                  </button>
                )}
              </div>

              {userEmail && (
                <p className="text-xs text-muted-foreground mb-3">
                  Signed in as <span className="text-[color:var(--gold-soft)]">{userEmail}</span>
                </p>
              )}

              {channelsLoading ? (
                <div className="p-6 rounded-lg border border-border bg-card/40 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" /> Fetching your YouTube channels…
                </div>
              ) : !providerToken ? (
                <div className="p-5 rounded-lg border border-[color:var(--gold)]/40 bg-card/40">
                  <p className="text-sm mb-3">
                    To access your YouTube channels, connect your Google account with YouTube
                    permissions.
                  </p>
                  <button
                    type="button"
                    onClick={reconnectYouTube}
                    className="text-sm px-4 py-2 rounded-lg bg-gold-gradient text-[color:var(--primary-foreground)] font-medium"
                  >
                    Connect YouTube
                  </button>
                </div>
              ) : channels.length === 0 ? (
                <div className="p-5 rounded-lg border border-red-500/40 bg-red-500/5">
                  <p className="text-sm text-red-300 mb-1 font-medium">
                    No YouTube channels found
                  </p>
                  <p className="text-xs text-muted-foreground mb-3">
                    {channelError ??
                      `The account ${userEmail ?? ""} does not have any YouTube channels. Create one on YouTube, or reconnect with a different Google account.`}
                  </p>
                  <button
                    type="button"
                    onClick={reconnectYouTube}
                    className="text-xs px-3 py-1.5 rounded border border-[color:var(--gold)]/40 hover:bg-card transition"
                  >
                    Reconnect Google
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {channels.map((ch) => {
                    const active = selectedChannel === ch.id;
                    return (
                      <button
                        key={ch.id}
                        type="button"
                        onClick={() => setSelectedChannel(ch.id)}
                        className={`flex items-center gap-3 p-3 rounded-lg border text-left transition ${
                          active
                            ? "border-[color:var(--gold)] bg-[color:var(--gold)]/10"
                            : "border-border bg-card/40 hover:border-[color:var(--gold)]/40"
                        }`}
                      >
                        <img
                          src={ch.thumbnail}
                          alt={ch.title}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{ch.title}</p>
                          <p className="text-[10px] text-muted-foreground truncate">{ch.id}</p>
                        </div>
                        {active && (
                          <CheckCircle2 className="w-4 h-4 text-[color:var(--gold)] flex-shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* TITLE */}
            <div>
              <label className="text-xs uppercase tracking-[0.2em] text-[color:var(--gold-soft)] mb-3 block">
                Stream Title
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Sunday Worship Service"
                className="w-full bg-background/60 border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[color:var(--gold)]/60 transition"
              />
            </div>

            {/* AI HASHTAGS */}
            <div className="p-4 rounded-lg border border-[color:var(--gold)]/30 bg-card/30">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--gold-soft)] flex items-center gap-2">
                  <Hash className="w-3.5 h-3.5" /> AI Hashtags
                </p>
                {tagsLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              </div>
              {title.trim().length < 4 ? (
                <p className="text-xs text-muted-foreground">
                  Type a title above — hashtags will auto-generate based on YouTube search trends.
                </p>
              ) : hashtags.length === 0 && !tagsLoading ? (
                <p className="text-xs text-muted-foreground">No hashtags yet.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {hashtags.map((t) => {
                    const active = selectedTags.has(t);
                    return (
                      <button
                        type="button"
                        key={t}
                        onClick={() => toggleTag(t)}
                        className={`text-xs px-2.5 py-1 rounded-full border transition ${
                          active
                            ? "border-[color:var(--gold)] bg-[color:var(--gold)]/15 text-[color:var(--gold)]"
                            : "border-border text-muted-foreground hover:border-[color:var(--gold)]/40"
                        }`}
                      >
                        #{t}
                      </button>
                    );
                  })}
                </div>
              )}
              {selectedTags.size > 0 && (
                <p className="text-[10px] text-muted-foreground mt-3">
                  Selected tags will be appended to your description on publish.
                </p>
              )}
            </div>

            {/* DESCRIPTION */}
            <div>
              <label className="text-xs uppercase tracking-[0.2em] text-[color:var(--gold-soft)] mb-3 block">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your live stream..."
                rows={4}
                className="w-full bg-background/60 border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[color:var(--gold)]/60 transition resize-none"
              />
            </div>

            {/* AI THUMBNAIL */}
            <div className="p-4 rounded-lg border border-[color:var(--gold)]/30 bg-card/30">
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--gold-soft)] flex items-center gap-2 mb-3">
                <Sparkles className="w-3.5 h-3.5" /> AI Thumbnail Generator
              </p>
              <textarea
                value={thumbPrompt}
                onChange={(e) => setThumbPrompt(e.target.value)}
                placeholder="Describe the thumbnail (e.g., 'worship singer with hands raised, golden light, cinematic stage')"
                rows={2}
                className="w-full bg-background/60 border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[color:var(--gold)]/60 transition resize-none"
              />
              <button
                type="button"
                onClick={handleGenerateThumb}
                disabled={thumbLoading}
                className="mt-3 w-full py-2.5 rounded-lg bg-gold-gradient text-[color:var(--primary-foreground)] font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {thumbLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Generating…
                  </>
                ) : (
                  <>
                    <ImageIcon className="w-4 h-4" />{" "}
                    {thumbDataUrl ? "Regenerate Thumbnail" : "Generate Thumbnail"}
                  </>
                )}
              </button>
              {thumbDataUrl && (
                <div className="mt-4">
                  <img
                    src={thumbDataUrl}
                    alt="Generated thumbnail"
                    className="w-full rounded-lg border border-[color:var(--gold)]/40"
                  />
                  <p className="text-[10px] text-muted-foreground mt-2 text-center">
                    Will auto-upload to YouTube when stream is created.
                  </p>
                </div>
              )}
            </div>

            {/* SCHEDULE */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs uppercase tracking-[0.2em] text-[color:var(--gold-soft)] mb-3 block">
                  Start (Optional)
                </label>
                <input
                  type="datetime-local"
                  value={scheduledStart}
                  onChange={(e) => setScheduledStart(e.target.value)}
                  className="w-full bg-background/60 border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[color:var(--gold)]/60 transition"
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-[0.2em] text-[color:var(--gold-soft)] mb-3 block">
                  End (Optional)
                </label>
                <input
                  type="datetime-local"
                  value={scheduledEnd}
                  onChange={(e) => setScheduledEnd(e.target.value)}
                  className="w-full bg-background/60 border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[color:var(--gold)]/60 transition"
                />
              </div>
            </div>

            {/* PRIVACY */}
            <div>
              <label className="text-xs uppercase tracking-[0.2em] text-[color:var(--gold-soft)] mb-3 block">
                Privacy
              </label>
              <select
                value={privacy}
                onChange={(e) => setPrivacy(e.target.value as "public" | "private" | "unlisted")}
                className="w-full bg-background/60 border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[color:var(--gold)]/60 transition"
              >
                <option value="public">Public</option>
                <option value="unlisted">Unlisted</option>
                <option value="private">Private</option>
              </select>
            </div>

            {/* ADVANCED */}
            <div className="space-y-3 p-4 rounded-lg border border-border bg-card/30">
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--gold-soft)]">
                Advanced
              </p>
              {(
                [
                  ["Auto-start stream", autoStart, setAutoStart],
                  ["Auto-stop stream", autoStop, setAutoStop],
                  ["Enable DVR", enableDvr, setEnableDvr],
                  ["Allow embedding", enableEmbedding, setEnableEmbedding],
                  ["Reusable stream", isReusable, setIsReusable],
                ] as const
              ).map(([label, val, setter]) => (
                <label key={label} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={val}
                    onChange={(e) => setter(e.target.checked)}
                    className="w-4 h-4 rounded border-border"
                  />
                  <span className="text-sm">{label}</span>
                </label>
              ))}
            </div>

            <button
              type="submit"
              disabled={submitting || !selectedChannel || !title || !providerToken}
              className="w-full py-3.5 rounded-lg bg-gold-gradient text-[color:var(--primary-foreground)] font-medium glow-gold flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Creating Stream…
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
