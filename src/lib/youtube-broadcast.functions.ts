/**
 * YouTube Broadcast Functions
 * Handles YouTube broadcast creation for LiveKit Egress integration
 * This replaces the old RTMP-based createYouTubeLiveStream function
 */

import { createServerFn } from "@tanstack/react-start";

export interface YouTubeBroadcastResult {
  broadcastId: string;
  streamKey: string;
  title: string;
  description: string;
}

/**
 * Create a YouTube Broadcast and Stream for LiveKit Egress
 * Returns the broadcast ID and stream key needed for egress configuration
 */
export const createYouTubeBroadcast = createServerFn({ method: "POST" })
  .inputValidator(
    (data: {
      access_token: string;
      title: string;
      description: string;
      privacy: "public" | "private" | "unlisted";
      madeForKids: boolean;
    }) => {
      if (!data?.access_token) throw new Error("Invalid access token");
      if (!data?.title) throw new Error("Title is required");
      return data;
    },
  )
  .handler(async ({ data }): Promise<YouTubeBroadcastResult> => {
    try {
      console.log("[YouTube] Creating broadcast for LiveKit egress");

      // 1. Create Broadcast
      const broadcastResponse = await fetch(
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
              scheduledStartTime: new Date(Date.now() + 5000).toISOString(),
            },
            status: {
              privacyStatus: data.privacy,
              selfDeclaredMadeForKids: data.madeForKids,
            },
            contentDetails: {
              enableAutoStart: true,
              enableAutoStop: true,
              monitorStream: { enableMonitorStream: false },
            },
          }),
        },
      );

      if (!broadcastResponse.ok) {
        const error = await broadcastResponse.json();
        throw new Error(`Failed to create broadcast: ${error.error?.message || "Unknown error"}`);
      }

      const broadcast = await broadcastResponse.json();
      console.log("[YouTube] Broadcast created:", broadcast.id);

      // 2. Create Stream (RTMP ingestion)
      const streamResponse = await fetch(
        "https://www.googleapis.com/youtube/v3/liveStreams?part=snippet,cdn,contentDetails",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${data.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            snippet: {
              title: `${data.title} - Stream`,
            },
            cdn: {
              frameRate: "variable",
              ingestionType: "rtmp",
              resolution: "variable",
            },
          }),
        },
      );

      if (!streamResponse.ok) {
        const error = await streamResponse.json();
        throw new Error(`Failed to create stream: ${error.error?.message || "Unknown error"}`);
      }

      const stream = await streamResponse.json();
      console.log("[YouTube] Stream created:", stream.id);

      // 3. Bind Broadcast to Stream
      const bindResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/liveBroadcasts/bind?id=${broadcast.id}&part=id,contentDetails&streamId=${stream.id}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${data.access_token}`,
            Accept: "application/json",
          },
        },
      );

      if (!bindResponse.ok) {
        const error = await bindResponse.json();
        throw new Error(`Failed to bind broadcast: ${error.error?.message || "Unknown error"}`);
      }

      console.log("[YouTube] Broadcast bound to stream");

      // Extract stream key from ingestion info
      const streamKey = stream.cdn.ingestionInfo.streamName;
      if (!streamKey) {
        throw new Error("Failed to retrieve stream key from YouTube");
      }

      console.log("[YouTube] Stream key retrieved successfully");

      return {
        broadcastId: broadcast.id,
        streamKey,
        title: data.title,
        description: data.description,
      };
    } catch (error) {
      console.error("[YouTube] Broadcast creation failed:", error);
      throw new Error(
        error instanceof Error ? error.message : "Failed to create YouTube broadcast",
      );
    }
  });

/**
 * Get the status of a YouTube broadcast
 */
export const getYouTubeBroadcastStatus = createServerFn({ method: "GET" })
  .inputValidator(
    (data: {
      access_token: string;
      broadcastId: string;
    }) => {
      if (!data?.access_token) throw new Error("Invalid access token");
      if (!data?.broadcastId) throw new Error("Broadcast ID is required");
      return data;
    },
  )
  .handler(async ({ data }) => {
    try {
      console.log("[YouTube] Fetching broadcast status:", data.broadcastId);

      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/liveBroadcasts?id=${data.broadcastId}&part=snippet,status,statistics`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${data.access_token}`,
            Accept: "application/json",
          },
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Failed to get broadcast status: ${error.error?.message || "Unknown error"}`);
      }

      const result = await response.json();
      if (!result.items || result.items.length === 0) {
        throw new Error("Broadcast not found");
      }

      const broadcast = result.items[0];

      console.log("[YouTube] Broadcast status retrieved:", broadcast.status.lifeCycleStatus);

      return {
        broadcastId: broadcast.id,
        status: broadcast.status.lifeCycleStatus,
        isLive: broadcast.status.lifeCycleStatus === "live",
        title: broadcast.snippet.title,
        viewerCount: broadcast.statistics?.concurrentViewers || 0,
        startTime: broadcast.snippet.actualStartTime,
      };
    } catch (error) {
      console.error("[YouTube] Failed to get broadcast status:", error);
      throw new Error(
        error instanceof Error ? error.message : "Failed to get YouTube broadcast status",
      );
    }
  });

/**
 * End a YouTube broadcast
 */
export const endYouTubeBroadcast = createServerFn({ method: "POST" })
  .inputValidator(
    (data: {
      access_token: string;
      broadcastId: string;
    }) => {
      if (!data?.access_token) throw new Error("Invalid access token");
      if (!data?.broadcastId) throw new Error("Broadcast ID is required");
      return data;
    },
  )
  .handler(async ({ data }) => {
    try {
      console.log("[YouTube] Ending broadcast:", data.broadcastId);

      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/liveBroadcasts/transition?id=${data.broadcastId}&broadcastStatus=complete&part=snippet,status`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${data.access_token}`,
            Accept: "application/json",
          },
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Failed to end broadcast: ${error.error?.message || "Unknown error"}`);
      }

      console.log("[YouTube] Broadcast ended successfully");

      return {
        broadcastId: data.broadcastId,
        status: "ended",
      };
    } catch (error) {
      console.error("[YouTube] Failed to end broadcast:", error);
      throw new Error(
        error instanceof Error ? error.message : "Failed to end YouTube broadcast",
      );
    }
  });
