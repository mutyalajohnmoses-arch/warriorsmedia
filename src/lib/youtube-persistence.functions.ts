import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { supabase } from "@/integrations/supabase/client";
import type { YouTubeChannelInfo, YouTubeVideo } from "./youtube-oauth.functions";

// Validate user ID
const validateUserId = (data: { userId: string }) => {
  if (!data?.userId && typeof data?.userId !== "string") {
    // We allow empty userId if session is available
    return data;
  }
  return data;
};

// Validate channel info
const validateChannelInfo = (data: {
  userId: string;
  channelInfo: YouTubeChannelInfo;
  accessToken: string;
  refreshToken?: string;
}) => {
  if (!data?.channelInfo) {
    throw new Error("Invalid channel info");
  }
  if (!data?.accessToken || typeof data.accessToken !== "string") {
    throw new Error("Invalid access token");
  }
  return data;
};

// Validate video data
const validateVideoData = (data: {
  channelId: string;
  videos: YouTubeVideo[];
}) => {
  if (!data?.channelId || typeof data.channelId !== "string") {
    throw new Error("Invalid channel ID");
  }
  if (!Array.isArray(data?.videos)) {
    throw new Error("Invalid videos array");
  }
  return data;
};

// Save or update YouTube channel connection
export const saveYouTubeChannel = createServerFn({ method: "POST" })
  .inputValidator(validateChannelInfo)
  .handler(async ({ data }) => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const userId = session?.user.id || data.userId;
    if (!userId) {
      throw new Error("Unauthorized: No user session found");
    }

    const expiresAt = new Date(Date.now() + 3600 * 1000); // 1 hour from now

    const { data: existingChannel } = await supabaseAdmin
      .from("youtube_channels")
      .select("id")
      .eq("user_id", userId)
      .eq("channel_id", data.channelInfo.channelId)
      .maybeSingle();

    if (existingChannel) {
      // Update existing channel
      const { error } = await supabaseAdmin
        .from("youtube_channels")
        .update({
          title: data.channelInfo.title,
          description: data.channelInfo.description,
          custom_url: data.channelInfo.customUrl,
          profile_image_url: data.channelInfo.profileImageUrl,
          banner_image_url: data.channelInfo.bannerImageUrl,
          subscriber_count: data.channelInfo.subscriberCount,
          view_count: data.channelInfo.viewCount,
          video_count: data.channelInfo.videoCount,
          published_at: data.channelInfo.publishedAt,
          access_token: data.accessToken,
          refresh_token: data.refreshToken || null,
          token_expires_at: expiresAt.toISOString(),
          is_connected: true,
          last_synced_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingChannel.id);

      if (error) throw error;

      return {
        success: true,
        message: "YouTube channel updated successfully",
        channelId: existingChannel.id,
      };
    } else {
      // Insert new channel
      const { data: newChannel, error } = await supabaseAdmin
        .from("youtube_channels")
        .insert({
          user_id: userId,
          channel_id: data.channelInfo.channelId,
          title: data.channelInfo.title,
          description: data.channelInfo.description,
          custom_url: data.channelInfo.customUrl,
          profile_image_url: data.channelInfo.profileImageUrl,
          banner_image_url: data.channelInfo.bannerImageUrl,
          subscriber_count: data.channelInfo.subscriberCount,
          view_count: data.channelInfo.viewCount,
          video_count: data.channelInfo.videoCount,
          published_at: data.channelInfo.publishedAt,
          access_token: data.accessToken,
          refresh_token: data.refreshToken || null,
          token_expires_at: expiresAt.toISOString(),
          is_connected: true,
          last_synced_at: new Date().toISOString(),
        })
        .select("id")
        .single();

      if (error) throw error;

      return {
        success: true,
        message: "YouTube channel connected successfully",
        channelId: newChannel.id,
      };
    }
  });

// Get connected YouTube channel
export const getConnectedYouTubeChannel = createServerFn({ method: "GET" })
  .inputValidator(validateUserId)
  .handler(async ({ data }) => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const userId = session?.user.id || data.userId;
    if (!userId) {
      return null;
    }

    const { data: channel, error } = await supabaseAdmin
      .from("youtube_channels")
      .select("*")
      .eq("user_id", userId)
      .eq("is_connected", true)
      .order("created_at", { ascending: false })
      .maybeSingle();

    if (error) throw error;

    return channel;
  });

// Get all connected YouTube channels for user
export const getYouTubeChannels = createServerFn({ method: "GET" })
  .inputValidator(validateUserId)
  .handler(async ({ data }) => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const userId = session?.user.id || data.userId;
    if (!userId) {
      return [];
    }

    const { data: channels, error } = await supabaseAdmin
      .from("youtube_channels")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return channels || [];
  });

// Save YouTube videos for a channel
export const saveYouTubeVideos = createServerFn({ method: "POST" })
  .inputValidator(validateVideoData)
  .handler(async ({ data }) => {
    // Get the channel record to verify ownership
    const { data: channel, error: channelError } = await supabaseAdmin
      .from("youtube_channels")
      .select("id, user_id")
      .eq("id", data.channelId)
      .maybeSingle();

    if (channelError) throw channelError;
    if (!channel) throw new Error("Channel not found");

    // Verify user owns this channel
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session || session.user.id !== channel.user_id) {
      throw new Error("Unauthorized");
    }

    // Delete existing videos for this channel
    const { error: deleteError } = await supabaseAdmin
      .from("youtube_videos")
      .delete()
      .eq("channel_id", data.channelId);

    if (deleteError) throw deleteError;

    // Insert new videos
    if (data.videos.length > 0) {
      const videosToInsert = data.videos.map((video) => ({
        channel_id: data.channelId,
        video_id: video.videoId,
        title: video.title,
        description: video.description,
        thumbnail_url: video.thumbnailUrl,
        published_at: video.publishedAt,
        view_count: video.viewCount,
        like_count: video.likeCount,
        comment_count: video.commentCount,
        duration: video.duration,
      }));

      const { error: insertError } = await supabaseAdmin
        .from("youtube_videos")
        .insert(videosToInsert);

      if (insertError) throw insertError;
    }

    return {
      success: true,
      message: `Saved ${data.videos.length} videos`,
      count: data.videos.length,
    };
  });

// Get YouTube videos for a channel
export const getYouTubeChannelVideos = createServerFn({ method: "GET" })
  .inputValidator((data: { channelId: string }) => {
    if (!data?.channelId || typeof data.channelId !== "string") {
      throw new Error("Invalid channel ID");
    }
    return data;
  })
  .handler(async ({ data }) => {
    // Verify user owns this channel
    const { data: channel, error: channelError } = await supabaseAdmin
      .from("youtube_channels")
      .select("user_id")
      .eq("id", data.channelId)
      .maybeSingle();

    if (channelError) throw channelError;
    if (!channel) throw new Error("Channel not found");

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session || session.user.id !== channel.user_id) {
      throw new Error("Unauthorized");
    }

    const { data: videos, error } = await supabaseAdmin
      .from("youtube_videos")
      .select("*")
      .eq("channel_id", data.channelId)
      .order("published_at", { ascending: false });

    if (error) throw error;

    return videos || [];
  });

// Disconnect YouTube channel
export const disconnectYouTubeChannel = createServerFn({ method: "POST" })
  .inputValidator((data: { channelId: string }) => {
    if (!data?.channelId || typeof data.channelId !== "string") {
      throw new Error("Invalid channel ID");
    }
    return data;
  })
  .handler(async ({ data }) => {
    // Verify user owns this channel
    const { data: channel, error: channelError } = await supabaseAdmin
      .from("youtube_channels")
      .select("user_id")
      .eq("id", data.channelId)
      .maybeSingle();

    if (channelError) throw channelError;
    if (!channel) throw new Error("Channel not found");

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session || session.user.id !== channel.user_id) {
      throw new Error("Unauthorized");
    }

    // Update channel to disconnected
    const { error } = await supabaseAdmin
      .from("youtube_channels")
      .update({
        is_connected: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.channelId);

    if (error) throw error;

    return {
      success: true,
      message: "YouTube channel disconnected",
    };
  });

// Create YouTube Broadcast
export const createYouTubeBroadcast = createServerFn({ method: "POST" })
  .inputValidator((data: { 
    access_token: string; 
    title: string; 
    description: string; 
    privacy: "public" | "unlisted" | "private";
    madeForKids: boolean;
    scheduledStartTime?: string;
  }) => data)
  .handler(async ({ data }) => {
    const response = await fetch(
      "https://www.googleapis.com/youtube/v3/liveBroadcasts?part=snippet,status,contentDetails",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${data.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          snippet: {
            title: data.title,
            description: data.description,
            scheduledStartTime: data.scheduledStartTime || new Date().toISOString(),
          },
          status: {
            privacyStatus: data.privacy,
            selfDeclaredMadeForKids: data.madeForKids,
          },
          contentDetails: {
            enableAutoStart: true,
            enableAutoStop: true,
          }
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to create broadcast: ${error.error?.message || response.statusText}`);
    }

    return await response.json();
  });

// Create YouTube Stream
export const createYouTubeStream = createServerFn({ method: "POST" })
  .inputValidator((data: { access_token: string; title: string }) => data)
  .handler(async ({ data }) => {
    const response = await fetch(
      "https://www.googleapis.com/youtube/v3/liveStreams?part=snippet,cdn,contentDetails",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${data.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          snippet: {
            title: data.title,
          },
          cdn: {
            frameRate: "variable",
            ingestionType: "rtmp",
            resolution: "variable",
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to create stream: ${error.error?.message || response.statusText}`);
    }

    return await response.json();
  });

// Bind Broadcast to Stream
export const bindYouTubeBroadcast = createServerFn({ method: "POST" })
  .inputValidator((data: { access_token: string; broadcastId: string; streamId: string }) => data)
  .handler(async ({ data }) => {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/liveBroadcasts/bind?id=${data.broadcastId}&part=id,contentDetails&streamId=${data.streamId}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${data.access_token}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to bind broadcast: ${error.error?.message || response.statusText}`);
    }

    return await response.json();
  });
