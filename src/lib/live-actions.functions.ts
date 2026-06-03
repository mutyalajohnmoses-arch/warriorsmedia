import { createServerFn } from "@tanstack/react-start";
import { AccessToken, EgressClient, StreamOutput, StreamProtocol } from "livekit-server-sdk";

function validateLiveKitEnv() {
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  const url = process.env.LIVEKIT_URL;

  if (!apiKey || !apiSecret || !url) {
    throw new Error("Missing LiveKit environment configurations.");
  }
  return { apiKey, apiSecret, url };
}

export const generateLiveKitToken = createServerFn({ method: "POST" })
  .inputValidator((data: { roomName: string; participantName: string }) => data)
  .handler(async ({ data }) => {
    const { apiKey, apiSecret, url } = validateLiveKitEnv();

    const token = new AccessToken(apiKey, apiSecret, {
      identity: data.participantName,
      name: data.participantName,
    });

    (token as any).addGrant({
      room: data.roomName,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
    });

    return {
      token: await token.toJwt(),
      url,
    };
  });

async function ytFetch(accessToken: string, path: string, init: RequestInit = {}) {
  const res = await fetch(`https://www.googleapis.com/youtube/v3/${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
  const text = await res.text();
  let json: any;
  try { json = text ? JSON.parse(text) : {}; } catch { json = { raw: text }; }
  if (!res.ok) {
    throw new Error(`YouTube API ${res.status}: ${json?.error?.message || text}`);
  }
  return json;
}

export const createYouTubeLivePipeline = createServerFn({ method: "POST" })
  .inputValidator((data: { accessToken: string; title: string; description: string; privacy: string }) => data)
  .handler(async ({ data }) => {
    // A: broadcast
    const broadcast = await ytFetch(data.accessToken, "liveBroadcasts?part=snippet,status,contentDetails", {
      method: "POST",
      body: JSON.stringify({
        snippet: {
          title: data.title,
          description: data.description,
          scheduledStartTime: new Date().toISOString(),
        },
        status: {
          privacyStatus: data.privacy,
          selfDeclaredMadeForKids: false,
        },
        contentDetails: {
          enableAutoStart: true,
          enableAutoEnd: true,
        },
      }),
    });

    // B: stream
    const stream = await ytFetch(data.accessToken, "liveStreams?part=snippet,cdn", {
      method: "POST",
      body: JSON.stringify({
        snippet: { title: `${data.title} - Stream` },
        cdn: {
          frameRate: "30fps",
          ingestionType: "rtmp",
          resolution: "720p",
        },
      }),
    });

    const broadcastId = broadcast.id;
    const streamId = stream.id;
    const rtmpUrl = stream.cdn?.ingestionInfo?.ingestionAddress;
    const streamKey = stream.cdn?.ingestionInfo?.streamName;

    if (!broadcastId || !streamId || !rtmpUrl || !streamKey) {
      throw new Error("Failed to retrieve YouTube RTMP details.");
    }

    // C: bind
    await ytFetch(
      data.accessToken,
      `liveBroadcasts/bind?id=${broadcastId}&part=id,contentDetails&streamId=${streamId}`,
      { method: "POST" },
    );

    return {
      broadcastId,
      streamId,
      youtubeRtmpUrl: `${rtmpUrl}/${streamKey}`,
    };
  });

export const startLiveKitEgress = createServerFn({ method: "POST" })
  .inputValidator((data: { roomName: string; youtubeRtmpUrl: string }) => data)
  .handler(async ({ data }) => {
    const { apiKey, apiSecret, url } = validateLiveKitEnv();
    const egressClient = new EgressClient(url, apiKey, apiSecret);

    console.log("[startLiveKitEgress] Starting egress for room:", data.roomName);

    const response = await egressClient.startRoomCompositeEgress(
      data.roomName,
      {
        stream: new StreamOutput({
          protocol: StreamProtocol.RTMP,
          urls: [data.youtubeRtmpUrl],
        }),
      },
      { layout: "grid" },
    );

    console.log("[startLiveKitEgress] Egress started:", response.egressId);
    return { egressId: response.egressId };
  });

export const stopLiveKitEgress = createServerFn({ method: "POST" })
  .inputValidator((data: { egressId: string }) => data)
  .handler(async ({ data }) => {
    const { apiKey, apiSecret, url } = validateLiveKitEnv();
    const egressClient = new EgressClient(url, apiKey, apiSecret);
    const response = await egressClient.stopEgress(data.egressId);
    return { egressId: response.egressId };
  });
