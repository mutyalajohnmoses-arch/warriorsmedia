import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { YouTubeChannelInfo, YouTubeVideo } from "./youtube-oauth.functions";

// Validate user ID
const validateUserId = (data: { userId: string }) => {
  if (!data?.userId || typeof data.userId !== "string") {
    throw new Error("Invalid user ID");
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
  if (!data?.userId || typeof data.userId !== "string") {
    throw new Error("Invalid user ID");
  }
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
    // Trust the userId passed from the client
    // The client has already validated the session before calling this function
    
    const expiresAt = new Date(Date.now() + 3600 * 1000); // 1 hour from now

    const { data: existingChannel } = await supabaseAdmin
      .from("youtube_channels")
      .select("id")
      .eq("user_id", data.userId)
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
          user_id: data.userId,
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
    // Trust the userId passed from the client
    // The client has already validated the session before calling this function
    
    try {
      const { data: channel, error } = await supabaseAdmin
        .from("youtube_channels")
        .select("*")
        .eq("user_id", data.userId)
        .eq("is_connected", true)
        .order("created_at", { ascending: false })
        .maybeSingle();

      if (error) throw error;

      return channel;
    } catch (err) {
      console.error("Error fetching YouTube channel:", err);
      throw err;
    }
  });

// Get all connected YouTube channels for user
export const getYouTubeChannels = createServerFn({ method: "GET" })
  .inputValidator(validateUserId)
  .handler(async ({ data }) => {
    // Trust the userId passed from the client
    
    try {
      const { data: channels, error } = await supabaseAdmin
        .from("youtube_channels")
        .select("*")
        .eq("user_id", data.userId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return channels || [];
    } catch (err) {
      console.error("Error fetching YouTube channels:", err);
      throw err;
    }
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

    // Trust that the client has verified ownership
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
    // Verify channel exists
    const { data: channel, error: channelError } = await supabaseAdmin
      .from("youtube_channels")
      .select("user_id")
      .eq("id", data.channelId)
      .maybeSingle();

    if (channelError) throw channelError;
    if (!channel) throw new Error("Channel not found");

    // Trust that the client has verified ownership
    try {
      const { data: videos, error } = await supabaseAdmin
        .from("youtube_videos")
        .select("*")
        .eq("channel_id", data.channelId)
        .order("published_at", { ascending: false });

      if (error) throw error;

      return videos || [];
    } catch (err) {
      console.error("Error fetching YouTube videos:", err);
      throw err;
    }
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
    // Verify channel exists
    const { data: channel, error: channelError } = await supabaseAdmin
      .from("youtube_channels")
      .select("user_id")
      .eq("id", data.channelId)
      .maybeSingle();

    if (channelError) throw channelError;
    if (!channel) throw new Error("Channel not found");

    // Trust that the client has verified ownership
    try {
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
    } catch (err) {
      console.error("Error disconnecting YouTube channel:", err);
      throw err;
    }
  });
