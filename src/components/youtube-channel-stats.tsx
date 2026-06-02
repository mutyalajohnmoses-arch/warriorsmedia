import { useState, useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { Youtube, Loader2, Eye, Users, Video, RefreshCw, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import {
  getConnectedYouTubeChannel,
  getYouTubeChannelVideos,
} from "@/lib/youtube-persistence.functions";
import { formatNumber } from "@/lib/youtube-oauth.functions";

type YouTubeChannelRow = {
  id: string;
  channel_id: string;
  title: string | null;
  description?: string | null;
  profile_image_url?: string | null;
  subscriber_count?: string | number | null;
  view_count?: string | number | null;
  video_count?: string | number | null;
};

type YouTubeVideoRow = {
  id: string;
  video_id: string | null;
  title: string | null;
  thumbnail_url?: string | null;
  view_count?: string | number | null;
  published_at?: string | null;
};

interface YouTubeChannelStatsProps {
  userId?: string;
  channel?: YouTubeChannelRow;
  onChannelFound?: (hasChannel: boolean) => void;
}

export function YouTubeChannelStats({
  userId: propUserId,
  channel: propChannel,
  onChannelFound,
}: YouTubeChannelStatsProps) {
  const [channel, setChannel] = useState<YouTubeChannelRow | null>(propChannel ?? null);
  const [videos, setVideos] = useState<YouTubeVideoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const getChannelFn = useServerFn(getConnectedYouTubeChannel);
  const getVideosFn = useServerFn(getYouTubeChannelVideos);

  useEffect(() => {
    const loadChannelData = async () => {
      try {
        if (propChannel) {
          console.log("[YouTubeChannelStats] Using channel provided by parent", {
            dbChannelId: propChannel.id,
            channelId: propChannel.channel_id,
            title: propChannel.title,
          });
          setChannel(propChannel);
          if (onChannelFound) onChannelFound(true);
          try {
            const videosData = await getVideosFn({ data: { channelId: propChannel.id } });
            setVideos(videosData || []);
          } catch (error) {
            console.error(
              "[YouTubeChannelStats] Failed to fetch videos for provided channel:",
              error,
            );
            setVideos([]);
          }
          setLoading(false);
          return;
        }

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          setLoading(false);
          if (onChannelFound) onChannelFound(false);
          return;
        }

        const userId = propUserId || session.user.id;

        // Fetch connected channel
        const channelData = await getChannelFn({ data: { userId } });

        if (channelData) {
          setChannel(channelData);

          // Fetch videos for this channel
          try {
            const videosData = await getVideosFn({ data: { channelId: channelData.id } });
            setVideos(videosData || []);
          } catch (error) {
            console.error("Failed to fetch videos:", error);
            setVideos([]);
          }

          if (onChannelFound) onChannelFound(true);
        } else {
          setChannel(null);
          setVideos([]);
          if (onChannelFound) onChannelFound(false);
        }
      } catch (error) {
        console.error("Failed to load channel data:", error);
        setChannel(null);
        setVideos([]);
        if (onChannelFound) onChannelFound(false);
      } finally {
        setLoading(false);
      }
    };

    loadChannelData();
  }, [propUserId, propChannel, getChannelFn, getVideosFn, onChannelFound]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session || !channel) {
        throw new Error("No session or channel");
      }

      const channelData = await getChannelFn({ data: { userId: session.user.id } });

      if (channelData) {
        setChannel(channelData);

        try {
          const videosData = await getVideosFn({ data: { channelId: channelData.id } });
          setVideos(videosData || []);
        } catch (error) {
          console.error("Failed to fetch videos:", error);
        }
      }

      toast.success("Channel data refreshed!");
    } catch (error) {
      toast.error("Failed to refresh channel data");
      console.error(error);
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 rounded-2xl border border-[color:var(--gold)]/30 bg-card/40 flex items-center justify-center gap-3">
        <Loader2 className="w-5 h-5 animate-spin text-[color:var(--gold)]" />
        <p className="text-sm text-muted-foreground">Loading channel data...</p>
      </div>
    );
  }

  if (!channel) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Channel Header */}
      <div className="p-6 rounded-2xl border border-[color:var(--gold)]/30 bg-card/40 backdrop-blur-xl">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4 flex-1 min-w-0">
            <img
              src={channel.profile_image_url ?? ""}
              alt={channel.title ?? ""}
              className="w-16 h-16 rounded-full border border-[color:var(--gold)]/30 flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Youtube className="w-4 h-4 text-red-500 flex-shrink-0" />
                <h3 className="font-display text-xl truncate">{channel.title}</h3>
              </div>
              <p className="text-xs text-muted-foreground mb-3">Channel ID: {channel.channel_id}</p>
              {channel.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">{channel.description}</p>
              )}
            </div>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 rounded-lg border border-border hover:border-[color:var(--gold)]/50 transition disabled:opacity-60 flex-shrink-0"
            title="Refresh data"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Channel Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-[color:var(--gold)]/20 bg-card/40">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-[color:var(--gold)]" />
            <span className="text-xs text-muted-foreground">Subscribers</span>
          </div>
          <p className="font-display text-2xl text-[color:var(--gold)]">
            {formatNumber(channel.subscriber_count ?? 0)}
          </p>
        </div>

        <div className="p-4 rounded-xl border border-[color:var(--gold)]/20 bg-card/40">
          <div className="flex items-center gap-2 mb-2">
            <Eye className="w-4 h-4 text-[color:var(--gold)]" />
            <span className="text-xs text-muted-foreground">Total Views</span>
          </div>
          <p className="font-display text-2xl text-[color:var(--gold)]">
            {formatNumber(channel.view_count ?? 0)}
          </p>
        </div>

        <div className="p-4 rounded-xl border border-[color:var(--gold)]/20 bg-card/40">
          <div className="flex items-center gap-2 mb-2">
            <Video className="w-4 h-4 text-[color:var(--gold)]" />
            <span className="text-xs text-muted-foreground">Videos</span>
          </div>
          <p className="font-display text-2xl text-[color:var(--gold)]">
            {formatNumber(channel.video_count ?? 0)}
          </p>
        </div>
      </div>

      {/* Latest Videos */}
      {videos.length > 0 && (
        <div className="p-6 rounded-2xl border border-[color:var(--gold)]/30 bg-card/40">
          <h3 className="font-medium mb-4 text-sm">Latest Videos</h3>
          <div className="space-y-3">
            {videos.slice(0, 5).map((video) => (
              <a
                key={video.id}
                href={`https://youtube.com/watch?v=${video.video_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex gap-3 p-3 rounded-lg border border-border hover:border-[color:var(--gold)]/50 bg-background/40 transition group"
              >
                <img
                  src={video.thumbnail_url ?? ""}
                  alt={video.title}
                  className="w-20 h-20 rounded object-cover flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium group-hover:text-[color:var(--gold)] transition line-clamp-2">
                    {video.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatNumber(video.view_count ?? 0)} views •{" "}
                    {video.published_at
                      ? new Date(video.published_at).toLocaleDateString()
                      : "Unknown date"}
                  </p>
                </div>
                <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-[color:var(--gold)] transition flex-shrink-0 mt-1" />
              </a>
            ))}
          </div>
          {videos.length > 5 && (
            <p className="text-xs text-muted-foreground mt-3 text-center">
              +{videos.length - 5} more videos
            </p>
          )}
        </div>
      )}

      {/* View Channel Button */}
      <a
        href={`https://youtube.com/channel/${channel.channel_id}`}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full py-3 rounded-lg border border-[color:var(--gold)]/50 hover:border-[color:var(--gold)] hover:bg-[color:var(--gold)]/5 text-center text-sm font-medium transition flex items-center justify-center gap-2"
      >
        <Youtube className="w-4 h-4" />
        View Full Channel
        <ExternalLink className="w-3 h-3" />
      </a>
    </div>
  );
}
