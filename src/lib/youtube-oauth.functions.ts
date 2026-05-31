import { createServerFn } from "@tanstack/react-start";

// Types for YouTube OAuth and Channel data
export type YouTubeOAuthTokens = {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope: string;
};

export type YouTubeChannelInfo = {
  channelId: string;
  title: string;
  description: string;
  customUrl?: string;
  profileImageUrl: string;
  bannerImageUrl?: string;
  subscriberCount: string;
  viewCount: string;
  videoCount: string;
  publishedAt: string;
};

export type YouTubeVideo = {
  videoId: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  publishedAt: string;
  viewCount: string;
  likeCount: string;
  commentCount: string;
  duration: string;
};

export type YouTubeLiveStreamStatus = {
  isLive: boolean;
  liveStreamId?: string;
  title?: string;
  description?: string;
  startTime?: string;
  viewerCount?: number;
};

type YouTubeVideoStatsItem = {
  id: string;
  statistics?: {
    viewCount?: string;
    likeCount?: string;
    commentCount?: string;
  };
  contentDetails?: {
    duration?: string;
  };
};

function maskToken(token: string | undefined) {
  if (!token) return { received: false };
  return {
    received: true,
    length: token.length,
    prefix: token.slice(0, 8),
    suffix: token.slice(-4),
  };
}

// Validate OAuth code
const validateOAuthCode = (data: { code: string; redirectUri: string }) => {
  if (!data?.code || typeof data.code !== "string") {
    throw new Error("Invalid OAuth code");
  }
  if (!data?.redirectUri || typeof data.redirectUri !== "string") {
    throw new Error("Invalid redirect URI");
  }
  return data;
};

// Exchange OAuth code for tokens
export const exchangeOAuthCode = createServerFn({ method: "POST" })
  .inputValidator(validateOAuthCode)
  .handler(async ({ data }): Promise<YouTubeOAuthTokens> => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error("Google OAuth credentials not configured");
    }

    console.log("[exchangeOAuthCode] Exchanging Google OAuth code", {
      redirectUri: data.redirectUri,
      codeLength: data.code.length,
      hasClientId: Boolean(clientId),
      hasClientSecret: Boolean(clientSecret),
    });

    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code: data.code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: data.redirectUri,
        grant_type: "authorization_code",
      }).toString(),
    });

    console.log("[exchangeOAuthCode] Google token endpoint responded", {
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("[exchangeOAuthCode] OAuth token exchange failed", error);
      throw new Error(`OAuth token exchange failed: ${error.error_description || error.error}`);
    }

    const tokens = await response.json();
    console.log("[exchangeOAuthCode] OAuth tokens received", {
      accessToken: maskToken(tokens.access_token),
      refreshToken: maskToken(tokens.refresh_token),
      expiresIn: tokens.expires_in,
      tokenType: tokens.token_type,
      scope: tokens.scope,
    });
    return {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_in: tokens.expires_in,
      token_type: tokens.token_type,
      scope: tokens.scope,
    };
  });

// Refresh OAuth token
const validateRefreshToken = (data: { refresh_token: string }) => {
  if (!data?.refresh_token || typeof data.refresh_token !== "string") {
    throw new Error("Invalid refresh token");
  }
  return data;
};

export const refreshOAuthToken = createServerFn({ method: "POST" })
  .inputValidator(validateRefreshToken)
  .handler(async ({ data }): Promise<YouTubeOAuthTokens> => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error("Google OAuth credentials not configured");
    }

    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: data.refresh_token,
        grant_type: "refresh_token",
      }).toString(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Token refresh failed: ${error.error_description || error.error}`);
    }

    const tokens = await response.json();
    return {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token || data.refresh_token,
      expires_in: tokens.expires_in,
      token_type: tokens.token_type,
      scope: tokens.scope,
    };
  });

// Helper to handle token refresh on 401
async function handleTokenRefresh(refreshToken: string | undefined): Promise<string> {
  if (!refreshToken) {
    throw new Error("No refresh token available");
  }
  const tokens = await refreshOAuthToken({ data: { refresh_token: refreshToken } });
  return tokens.access_token;
}

// Fetch YouTube channel information
const validateAccessToken = (data: { access_token: string }) => {
  if (!data?.access_token || typeof data.access_token !== "string") {
    throw new Error("Invalid access token");
  }
  return data;
};

export const getYouTubeChannelInfo = createServerFn({ method: "GET" })
  .inputValidator(validateAccessToken)
  .handler(async ({ data }): Promise<YouTubeChannelInfo> => {
    console.log("[getYouTubeChannelInfo] Requesting YouTube channel details");
    const response = await fetch(
      "https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,brandingSettings&mine=true",
      {
        headers: {
          Authorization: `Bearer ${data.access_token}`,
          Accept: "application/json",
        },
      },
    );

    console.log("[getYouTubeChannelInfo] YouTube channel API responded", {
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
    });

    if (!response.ok) {
      let errorBody: unknown = null;
      try {
        errorBody = await response.json();
      } catch {
        errorBody = await response.text();
      }
      console.error("[getYouTubeChannelInfo] Failed YouTube channel API response", errorBody);
      if (response.status === 401) {
        throw new Error("Unauthorized: Token may have expired");
      }
      throw new Error("Failed to fetch channel information");
    }

    const result = await response.json();
    console.log("[getYouTubeChannelInfo] YouTube channel API response parsed", {
      itemCount: result.items?.length ?? 0,
      firstChannelId: result.items?.[0]?.id,
      firstChannelTitle: result.items?.[0]?.snippet?.title,
    });
    if (!result.items || result.items.length === 0) {
      throw new Error("No YouTube channel found");
    }

    const channel = result.items[0];
    return {
      channelId: channel.id,
      title: channel.snippet.title,
      description: channel.snippet.description || "",
      customUrl: channel.snippet.customUrl,
      profileImageUrl: channel.snippet.thumbnails.default.url,
      bannerImageUrl: channel.brandingSettings?.image?.bannerExternalUrl,
      subscriberCount: channel.statistics.subscriberCount || "0",
      viewCount: channel.statistics.viewCount || "0",
      videoCount: channel.statistics.videoCount || "0",
      publishedAt: channel.snippet.publishedAt,
    };
  });

// Fetch latest videos
const validateVideoParams = (data: { access_token: string; maxResults?: number }) => {
  if (!data?.access_token || typeof data.access_token !== "string") {
    throw new Error("Invalid access token");
  }
  return data;
};

export const getYouTubeLatestVideos = createServerFn({ method: "GET" })
  .inputValidator(validateVideoParams)
  .handler(async ({ data }): Promise<YouTubeVideo[]> => {
    const maxResults = data.maxResults || 10;

    // First, get the uploads playlist ID
    const channelResponse = await fetch(
      "https://www.googleapis.com/youtube/v3/channels?part=contentDetails&mine=true",
      {
        headers: {
          Authorization: `Bearer ${data.access_token}`,
          Accept: "application/json",
        },
      },
    );

    if (!channelResponse.ok) {
      throw new Error("Failed to fetch channel details");
    }

    const channelData = await channelResponse.json();
    if (!channelData.items || channelData.items.length === 0) {
      throw new Error("No YouTube channel found");
    }

    const uploadsPlaylistId = channelData.items[0].contentDetails.relatedPlaylists.uploads;

    // Get videos from uploads playlist
    const videosResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${uploadsPlaylistId}&maxResults=${maxResults}&order=date`,
      {
        headers: {
          Authorization: `Bearer ${data.access_token}`,
          Accept: "application/json",
        },
      },
    );

    if (!videosResponse.ok) {
      throw new Error("Failed to fetch videos");
    }

    const videosData = await videosResponse.json();
    if (!videosData.items) {
      return [];
    }

    // Get video statistics
    const videoIds = videosData.items.map((item: any) => item.contentDetails.videoId).join(",");

    const statsResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=statistics,contentDetails&id=${videoIds}`,
      {
        headers: {
          Authorization: `Bearer ${data.access_token}`,
          Accept: "application/json",
        },
      },
    );

    if (!statsResponse.ok) {
      throw new Error("Failed to fetch video statistics");
    }

    const statsData = (await statsResponse.json()) as { items?: YouTubeVideoStatsItem[] };
    console.log("[getYouTubeLatestVideos] YouTube video statistics fetched", {
      requestedCount: videoIds.split(",").filter(Boolean).length,
      returnedCount: statsData.items?.length ?? 0,
    });
    const statsMap = new Map((statsData.items ?? []).map((item) => [item.id, item]));

    return videosData.items.map((item: any) => {
      const stats = statsMap.get(item.contentDetails.videoId);
      return {
        videoId: item.contentDetails.videoId,
        title: item.snippet.title,
        description: item.snippet.description || "",
        thumbnailUrl: item.snippet.thumbnails.medium.url,
        publishedAt: item.snippet.publishedAt,
        viewCount: stats?.statistics?.viewCount || "0",
        likeCount: stats?.statistics?.likeCount || "0",
        commentCount: stats?.statistics?.commentCount || "0",
        duration: stats?.contentDetails?.duration || "PT0S",
      };
    });
  });

// Fetch live stream status
export const getYouTubeLiveStreamStatus = createServerFn({ method: "GET" })
  .inputValidator(validateAccessToken)
  .handler(async ({ data }): Promise<YouTubeLiveStreamStatus> => {
    const response = await fetch(
      "https://www.googleapis.com/youtube/v3/liveBroadcasts?part=snippet,status,statistics&broadcastStatus=active&mine=true",
      {
        headers: {
          Authorization: `Bearer ${data.access_token}`,
          Accept: "application/json",
        },
      },
    );

    if (!response.ok) {
      throw new Error("Failed to fetch live stream status");
    }

    const result = await response.json();
    if (!result.items || result.items.length === 0) {
      return { isLive: false };
    }

    const broadcast = result.items[0];
    return {
      isLive: true,
      liveStreamId: broadcast.id,
      title: broadcast.snippet.title,
      description: broadcast.snippet.description,
      startTime: broadcast.snippet.actualStartTime,
      viewerCount: broadcast.statistics?.concurrentViewers || 0,
    };
  });

// Format ISO 8601 duration to readable format
export function formatDuration(duration: string): string {
  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  if (!match) return "0s";

  const hours = match[1] ? parseInt(match[1]) : 0;
  const minutes = match[2] ? parseInt(match[2]) : 0;
  const seconds = match[3] ? parseInt(match[3]) : 0;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

// Format numbers with commas
export function formatNumber(num: string | number): string {
  const n = typeof num === "string" ? parseInt(num) : num;
  if (isNaN(n)) return "0";
  return n.toLocaleString("en-IN");
}

// Create YouTube Broadcast and Stream
export const createYouTubeLiveStream = createServerFn({ method: "POST" })
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
  .handler(async ({ data }) => {
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
            scheduledStartTime: new Date(Date.now() + 5000).toISOString(), // Start in 5 seconds
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

    // 2. Create Stream
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

    return {
      broadcastId: broadcast.id,
      streamId: stream.id,
      ingestionAddress: stream.cdn.ingestionInfo.ingestionAddress,
      streamName: stream.cdn.ingestionInfo.streamName,
    };
  });
