/**
 * YouTube API utility functions for managing live streams
 */

export interface YouTubeChannel {
  id: string;
  title: string;
  thumbnail: string;
}

export interface YouTubeStream {
  broadcastId: string;
  streamId: string;
  rtmpUrl: string;
  streamKey: string;
}

/**
 * Fetch user's YouTube channels
 */
export async function fetchYouTubeChannels(accessToken: string): Promise<YouTubeChannel[]> {
  try {
    const response = await fetch(
      "https://www.googleapis.com/youtube/v3/channels?part=snippet,contentDetails&mine=true",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Failed to fetch YouTube channels");
    }

    const data = await response.json();
    return (data.items || []).map(
      (item: {
        id: string;
        snippet: { title: string; thumbnails: { default: { url: string } } };
      }) => ({
        id: item.id,
        title: item.snippet.title,
        thumbnail: item.snippet.thumbnails.default.url,
      }),
    );
  } catch (error) {
    console.error("Error fetching YouTube channels:", error);
    throw error;
  }
}

/**
 * Create a YouTube live broadcast
 */
export async function createYouTubeBroadcast(
  accessToken: string,
  title: string,
  description: string,
  privacyStatus: "public" | "private" | "unlisted",
  scheduledStartTime?: string,
  scheduledEndTime?: string,
  options?: {
    enableAutoStart?: boolean;
    enableAutoStop?: boolean;
    enableDvr?: boolean;
    enableEmbedding?: boolean;
    isReusable?: boolean;
  },
): Promise<string> {
  try {
    const response = await fetch(
      "https://www.googleapis.com/youtube/v3/liveBroadcasts?part=snippet,status,contentDetails",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          snippet: {
            title,
            description,
            scheduledStartTime: scheduledStartTime
              ? new Date(scheduledStartTime).toISOString()
              : new Date().toISOString(),
            ...(scheduledEndTime && {
              scheduledEndTime: new Date(scheduledEndTime).toISOString(),
            }),
          },
          status: {
            privacyStatus,
            selfDeclaredMadeForKids: false,
          },
          contentDetails: {
            autoStartConfig: {
              isEnabled: options?.enableAutoStart ?? false,
            },
            autoStopConfig: {
              isEnabled: options?.enableAutoStop ?? false,
            },
            dvr: options?.enableDvr ?? true,
            contentEncryption: {
              encryptionStatus: "unencrypted",
            },
            enableEmbedding: options?.enableEmbedding ?? true,
            isReusable: options?.isReusable ?? false,
          },
        }),
      },
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Failed to create broadcast");
    }

    const data = await response.json();
    return data.id;
  } catch (error) {
    console.error("Error creating YouTube broadcast:", error);
    throw error;
  }
}

/**
 * Create a YouTube live stream
 */
export async function createYouTubeStream(
  accessToken: string,
  channelId: string,
  title: string,
  description: string,
  isReusable: boolean = false,
): Promise<{ streamId: string; rtmpUrl: string; streamKey: string }> {
  try {
    const response = await fetch(
      "https://www.googleapis.com/youtube/v3/liveStreams?part=snippet,cdn,contentDetails",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          snippet: {
            title: `${title} - Stream`,
            description,
            channelId,
          },
          cdn: {
            frameRate: "30fps",
            ingestionType: "rtmp",
            resolution: "1080p",
          },
          contentDetails: {
            isReusable,
          },
        }),
      },
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Failed to create stream");
    }

    const data = await response.json();
    return {
      streamId: data.id,
      rtmpUrl: data.cdn.ingestionInfo.rtmpsIngestUrl,
      streamKey: data.cdn.ingestionInfo.streamName,
    };
  } catch (error) {
    console.error("Error creating YouTube stream:", error);
    throw error;
  }
}

/**
 * Bind a stream to a broadcast
 */
export async function bindStreamToBroadcast(
  accessToken: string,
  broadcastId: string,
  streamId: string,
): Promise<void> {
  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/liveBroadcasts/bind?part=contentDetails&id=${broadcastId}&streamId=${streamId}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Failed to bind stream to broadcast");
    }
  } catch (error) {
    console.error("Error binding stream to broadcast:", error);
    throw error;
  }
}

/**
 * Get broadcast details
 */
export async function getBroadcastDetails(
  accessToken: string,
  broadcastId: string,
): Promise<unknown> {
  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/liveBroadcasts?part=snippet,status,contentDetails&id=${broadcastId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Failed to get broadcast details");
    }

    const data = await response.json();
    return data.items?.[0] || null;
  } catch (error) {
    console.error("Error getting broadcast details:", error);
    throw error;
  }
}

/**
 * Transition broadcast to live
 */
export async function transitionBroadcastToLive(
  accessToken: string,
  broadcastId: string,
): Promise<void> {
  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/liveBroadcasts/transition?part=status&id=${broadcastId}&broadcastStatus=live`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Failed to transition broadcast to live");
    }
  } catch (error) {
    console.error("Error transitioning broadcast to live:", error);
    throw error;
  }
}

/**
 * End a live broadcast
 */
export async function endBroadcast(accessToken: string, broadcastId: string): Promise<void> {
  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/liveBroadcasts/transition?part=status&id=${broadcastId}&broadcastStatus=complete`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Failed to end broadcast");
    }
  } catch (error) {
    console.error("Error ending broadcast:", error);
    throw error;
  }
}
