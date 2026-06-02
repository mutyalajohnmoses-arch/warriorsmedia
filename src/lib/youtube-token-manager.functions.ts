import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { refreshOAuthToken } from "./youtube-oauth.functions";

export type YouTubeTokenInfo = {
  access_token: string;
  refresh_token?: string;
  expires_at: number;
};

/**
 * Get or refresh YouTube tokens for a user
 * This function serves as the single source of truth for token management
 */
export const getOrRefreshYouTubeToken = createServerFn({ method: "POST" })
  .inputValidator((data: { userId: string; channelId?: string }) => {
    if (!data?.userId || typeof data.userId !== "string") {
      throw new Error("Invalid user ID");
    }
    return data;
  })
  .handler(async ({ data }): Promise<YouTubeTokenInfo> => {
    console.log("[getOrRefreshYouTubeToken] Fetching token for user:", data.userId);

    try {
      // Find the connected YouTube channel for this user
      const { data: channel, error: channelError } = await supabaseAdmin
        .from("youtube_channels")
        .select("id, access_token, refresh_token, token_expires_at, is_connected")
        .eq("user_id", data.userId)
        .eq("is_connected", true)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (channelError) {
        console.error("[getOrRefreshYouTubeToken] Error fetching channel:", channelError);
        throw channelError;
      }

      if (!channel) {
        console.log("[getOrRefreshYouTubeToken] No connected channel found for user:", data.userId);
        throw new Error("No connected YouTube channel found");
      }

      console.log("[getOrRefreshYouTubeToken] Channel found:", {
        id: channel.id,
        hasAccessToken: Boolean(channel.access_token),
        hasRefreshToken: Boolean(channel.refresh_token),
        tokenExpiresAt: channel.token_expires_at,
      });

      // Check if token is expired or about to expire (within 5 minutes)
      const expiresAt = new Date(channel.token_expires_at ?? 0).getTime();
      const now = Date.now();
      const expirationBuffer = 5 * 60 * 1000; // 5 minutes

      if (expiresAt - now < expirationBuffer) {
        console.log("[getOrRefreshYouTubeToken] Token expired or expiring soon, attempting refresh", {
          expiresAt,
          now,
          timeUntilExpiry: expiresAt - now,
        });

        if (!channel.refresh_token) {
          throw new Error("Token expired and no refresh token available");
        }

        try {
          // Refresh the token
          const refreshedTokens = await refreshOAuthToken({
            data: { refresh_token: channel.refresh_token },
          });

          console.log("[getOrRefreshYouTubeToken] Token refreshed successfully");

          // Update the database with new tokens
          const newExpiresAt = new Date(Date.now() + refreshedTokens.expires_in * 1000);
          const { error: updateError } = await supabaseAdmin
            .from("youtube_channels")
            .update({
              access_token: refreshedTokens.access_token,
              refresh_token: refreshedTokens.refresh_token || channel.refresh_token,
              token_expires_at: newExpiresAt.toISOString(),
              last_synced_at: new Date().toISOString(),
            })
            .eq("id", channel.id);

          if (updateError) {
            console.error("[getOrRefreshYouTubeToken] Error updating channel with new tokens:", updateError);
            throw updateError;
          }

          console.log("[getOrRefreshYouTubeToken] Database updated with new tokens");

          return {
            access_token: refreshedTokens.access_token,
            refresh_token: refreshedTokens.refresh_token || channel.refresh_token,
            expires_at: newExpiresAt.getTime(),
          };
        } catch (refreshError) {
          console.error("[getOrRefreshYouTubeToken] Failed to refresh token:", refreshError);
          // Mark channel as disconnected if refresh fails
          await supabaseAdmin
            .from("youtube_channels")
            .update({
              is_connected: false,
              updated_at: new Date().toISOString(),
            })
            .eq("id", channel.id);
          throw new Error("Failed to refresh YouTube token. Please reconnect your channel.");
        }
      }

      console.log("[getOrRefreshYouTubeToken] Token is still valid");

      return {
        access_token: channel.access_token,
        refresh_token: channel.refresh_token,
        expires_at: expiresAt,
      };
    } catch (err) {
      console.error("[getOrRefreshYouTubeToken] Unexpected error:", err);
      throw err;
    }
  });
