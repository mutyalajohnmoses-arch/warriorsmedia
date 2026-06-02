import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { YouTubeChannelInfo, YouTubeVideo } from "./youtube-oauth.functions";

function maskSecret(value: string | undefined) {
  if (!value) return { received: false };
  return {
    received: true,
    length: value.length,
    prefix: value.slice(0, 8),
    suffix: value.slice(-4),
  };
}

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
const validateVideoData = (data: { channelId: string; videos: YouTubeVideo[] }) => {
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
    console.log("[saveYouTubeChannel] Starting save for user:", data.userId);
    console.log("[saveYouTubeChannel] Channel info:", {
      channelId: data.channelInfo.channelId,
      title: data.channelInfo.title,
      accessToken: maskSecret(data.accessToken),
      refreshToken: maskSecret(data.refreshToken),
    });

    try {
      const expiresAt = new Date(Date.now() + 3600 * 1000); // 1 hour from now

      // Check if channel already exists
      const { data: existingChannel, error: checkError } = await supabaseAdmin
        .from("youtube_channels")
        .select("id")
        .eq("user_id", data.userId)
        .eq("channel_id", data.channelInfo.channelId)
        .maybeSingle();

      if (checkError) {
        console.error("[saveYouTubeChannel] Error checking existing channel:", checkError);
        throw checkError;
      }

      console.log(
        "[saveYouTubeChannel] Existing channel:",
        existingChannel ? "Found" : "Not found",
      );

      if (existingChannel) {
        // Update existing channel
        console.log("[saveYouTubeChannel] Updating existing channel:", existingChannel.id);
        const { data: updatedChannel, error } = await supabaseAdmin
          .from("youtube_channels")
          .update({
            title: data.channelInfo.title,
            description: data.channelInfo.description,
            custom_url: data.channelInfo.customUrl,
            profile_image_url: data.channelInfo.profileImageUrl,
            banner_image_url: data.channelInfo.bannerImageUrl,
            subscriber_count: Number(data.channelInfo.subscriberCount) || 0,
            view_count: Number(data.channelInfo.viewCount) || 0,
            video_count: Number(data.channelInfo.videoCount) || 0,
            published_at: data.channelInfo.publishedAt,
            access_token: data.accessToken,
            refresh_token: data.refreshToken || null,
            token_expires_at: expiresAt.toISOString(),
            is_connected: true,
            last_synced_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingChannel.id)
          .select("id, user_id, channel_id, title, is_connected, updated_at")
          .single();

        if (error) {
          console.error("[saveYouTubeChannel] Error updating channel:", error);
          throw error;
        }

        console.log("[saveYouTubeChannel] Channel updated successfully", updatedChannel);
        return {
          success: true,
          message: "YouTube channel updated successfully",
          channelId: existingChannel.id,
        };
      } else {
        // Insert new channel
        console.log("[saveYouTubeChannel] Creating new channel for user:", data.userId);
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
            subscriber_count: Number(data.channelInfo.subscriberCount) || 0,
            view_count: Number(data.channelInfo.viewCount) || 0,
            video_count: Number(data.channelInfo.videoCount) || 0,
            published_at: data.channelInfo.publishedAt,
            access_token: data.accessToken,
            refresh_token: data.refreshToken || null,
            token_expires_at: expiresAt.toISOString(),
            is_connected: true,
            last_synced_at: new Date().toISOString(),
          })
          .select("id, user_id, channel_id, title, is_connected, created_at")
          .single();

        if (error) {
          console.error("[saveYouTubeChannel] Error inserting channel:", error);
          throw error;
        }

        console.log("[saveYouTubeChannel] Channel created successfully", newChannel);
        return {
          success: true,
          message: "YouTube channel connected successfully",
          channelId: newChannel?.id,
        };
      }
    } catch (err) {
      console.error("[saveYouTubeChannel] Unexpected error:", err);
      throw err;
    }
  });

// Get connected YouTube channel
export const getConnectedYouTubeChannel = createServerFn({ method: "GET" })
  .inputValidator(validateUserId)
  .handler(async ({ data }) => {
    console.log("[getConnectedYouTubeChannel] Fetching channel for user:", data.userId);

    try {
      // First, verify the user exists and has a valid session
      console.log("[getConnectedYouTubeChannel] Querying youtube_channels table");

      const { data: channel, error } = await supabaseAdmin
        .from("youtube_channels")
        .select("*")
        .eq("user_id", data.userId)
        .eq("is_connected", true)
        .order("updated_at", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("[getConnectedYouTubeChannel] Query error:", error);
        throw error;
      }

      if (!channel) {
        console.log(
          "[getConnectedYouTubeChannel] No connected channel found for user:",
          data.userId,
        );
        return null;
      }

      console.log("[getConnectedYouTubeChannel] Channel found:", {
        id: channel.id,
        userId: channel.user_id,
        title: channel.title,
        channelId: channel.channel_id,
        isConnected: channel.is_connected,
        lastSyncedAt: channel.last_synced_at,
        updatedAt: channel.updated_at,
      });

      return channel;
    } catch (err) {
      console.error("[getConnectedYouTubeChannel] Unexpected error:", err);
      throw err;
    }
  });

// Get all connected YouTube channels for user
export const getYouTubeChannels = createServerFn({ method: "GET" })
  .inputValidator(validateUserId)
  .handler(async ({ data }) => {
    console.log("[getYouTubeChannels] Fetching all channels for user:", data.userId);

    try {
      const { data: channels, error } = await supabaseAdmin
        .from("youtube_channels")
        .select("*")
        .eq("user_id", data.userId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("[getYouTubeChannels] Query error:", error);
        throw error;
      }

      console.log("[getYouTubeChannels] Found channels:", channels?.length || 0);
      return channels || [];
    } catch (err) {
      console.error("[getYouTubeChannels] Unexpected error:", err);
      throw err;
    }
  });

// Save YouTube videos for a channel
export const saveYouTubeVideos = createServerFn({ method: "POST" })
  .inputValidator(validateVideoData)
  .handler(async ({ data }) => {
    console.log("[saveYouTubeVideos] Saving videos for channel:", data.channelId);

    try {
      // Get the channel record to verify ownership
      const { data: channel, error: channelError } = await supabaseAdmin
        .from("youtube_channels")
        .select("id, user_id")
        .eq("id", data.channelId)
        .maybeSingle();

      if (channelError) {
        console.error("[saveYouTubeVideos] Error fetching channel:", channelError);
        throw channelError;
      }

      if (!channel) {
        console.error("[saveYouTubeVideos] Channel not found:", data.channelId);
        throw new Error("Channel not found");
      }

      console.log("[saveYouTubeVideos] Channel found, deleting old videos");

      // Delete existing videos for this channel
      const { error: deleteError } = await supabaseAdmin
        .from("youtube_videos")
        .delete()
        .eq("channel_id", data.channelId);

      if (deleteError) {
        console.error("[saveYouTubeVideos] Error deleting old videos:", deleteError);
        throw deleteError;
      }

      // Insert new videos
      if (data.videos.length > 0) {
        console.log("[saveYouTubeVideos] Inserting", data.videos.length, "videos");
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
          .insert(videosToInsert as any);

        if (insertError) {
          console.error("[saveYouTubeVideos] Error inserting videos:", insertError);
          throw insertError;
        }
      }

      console.log("[saveYouTubeVideos] Videos saved successfully", {
        channelId: data.channelId,
        count: data.videos.length,
      });
      return {
        success: true,
        message: `Saved ${data.videos.length} videos`,
        count: data.videos.length,
      };
    } catch (err) {
      console.error("[saveYouTubeVideos] Unexpected error:", err);
      throw err;
    }
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
    console.log("[getYouTubeChannelVideos] Fetching videos for channel:", data.channelId);

    try {
      // Verify channel exists
      const { data: channel, error: channelError } = await supabaseAdmin
        .from("youtube_channels")
        .select("user_id")
        .eq("id", data.channelId)
        .maybeSingle();

      if (channelError) {
        console.error("[getYouTubeChannelVideos] Error fetching channel:", channelError);
        throw channelError;
      }

      if (!channel) {
        console.error("[getYouTubeChannelVideos] Channel not found:", data.channelId);
        throw new Error("Channel not found");
      }

      const { data: videos, error } = await supabaseAdmin
        .from("youtube_videos")
        .select("*")
        .eq("channel_id", data.channelId)
        .order("published_at", { ascending: false });

      if (error) {
        console.error("[getYouTubeChannelVideos] Query error:", error);
        throw error;
      }

      console.log("[getYouTubeChannelVideos] Found videos:", videos?.length || 0);
      return videos || [];
    } catch (err) {
      console.error("[getYouTubeChannelVideos] Unexpected error:", err);
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
    console.log("[disconnectYouTubeChannel] Disconnecting channel:", data.channelId);

    try {
      // Verify channel exists
      const { data: channel, error: channelError } = await supabaseAdmin
        .from("youtube_channels")
        .select("user_id")
        .eq("id", data.channelId)
        .maybeSingle();

      if (channelError) {
        console.error("[disconnectYouTubeChannel] Error fetching channel:", channelError);
        throw channelError;
      }

      if (!channel) {
        console.error("[disconnectYouTubeChannel] Channel not found:", data.channelId);
        throw new Error("Channel not found");
      }

      // Update channel to disconnected
      const { error } = await supabaseAdmin
        .from("youtube_channels")
        .update({
          is_connected: false,
          updated_at: new Date().toISOString(),
        })
        .eq("id", data.channelId);

      if (error) {
        console.error("[disconnectYouTubeChannel] Error updating channel:", error);
        throw error;
      }

      console.log("[disconnectYouTubeChannel] Channel disconnected successfully");
      return {
        success: true,
        message: "YouTube channel disconnected",
      };
    } catch (err) {
      console.error("[disconnectYouTubeChannel] Unexpected error:", err);
      throw err;
    }
  });
