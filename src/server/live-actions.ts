import { createServerFn } from "@tanstack/react-start";
import { AccessToken, EgressClient } from "livekit-server-sdk";
import { google } from "googleapis";

function validateLiveKitEnv() {
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  const url = process.env.LIVEKIT_URL;

  if (!apiKey || !apiSecret || !url) {
    throw new Error("LiveKit environment variables missing.");
  }
  return { apiKey, apiSecret, url };
}

// 1. LiveKit టోకెన్ జనరేట్ చేయడం
export const generateLiveKitToken = createServerFn({ method: "POST" })
  .input((data: { roomName: string; participantName: string }) => data)
  .handler(async ({ data }) => {
    const { apiKey, apiSecret, url } = validateLiveKitEnv();
    
    const token = new AccessToken(apiKey, apiSecret, {
      identity: data.participantName,
      name: data.participantName,
    });

    token.addGrant({
      room: data.roomName,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
    });

    return {
      token: await token.toJwt(),
      url: url,
    };
  });

// 2. YouTube లో ఆటోమేటిక్‌గా Broadcast & Stream క్రియేట్ చేయడం
export const createYouTubeLivePipeline = createServerFn({ method: "POST" })
  .input((data: { accessToken: string; title: string; description: string; privacy: string }) => data)
  .handler(async ({ data }) => {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: data.accessToken });

    const youtube = google.youtube({ version: "v3", auth });

    try {
      // Step A: Create YouTube Broadcast
      const broadcastRes = await youtube.liveBroadcasts.insert({
        part: ["snippet", "status", "contentDetails"],
        requestBody: {
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
          }
        },
      });

      // Step B: Create YouTube Stream (RTMP)
      const streamRes = await youtube.liveStreams.insert({
        part: ["snippet", "cdn"],
        requestBody: {
          snippet: { title: `${data.title} - Stream` },
          cdn: {
            frameRate: "30fps",
            ingestionType: "rtmp",
            resolution: "720p",
          },
        },
      });

      const broadcastId = broadcastRes.data.id;
      const streamId = streamRes.data.id;
      const rtmpUrl = streamRes.data.cdn?.ingestionInfo?.ingestionAddress;
      const streamKey = streamRes.data.cdn?.ingestionInfo?.streamName;

      if (!broadcastId || !streamId || !rtmpUrl || !streamKey) {
        throw new Error("Failed to retrieve YouTube RTMP details.");
      }

      // Step C: Bind Broadcast and Stream
      await youtube.liveBroadcasts.bind({
        id: broadcastId,
        part: ["id", "contentDetails"],
        streamId: streamId,
      });

      return {
        broadcastId,
        streamId,
        youtubeRtmpUrl: `${rtmpUrl}/${streamKey}`,
      };
    } catch (err: any) {
      console.error("YouTube API Error:", err);
      throw new Error(`YouTube Pipeline Error: ${err.message}`);
    }
  });

// 3. LiveKit Egress స్టార్ట్ చేయడం
export const startLiveKitEgress = createServerFn({ method: "POST" })
  .input((data: { roomName: string; youtubeRtmpUrl: string }) => data)
  .handler(async ({ data }) => {
    const { apiKey, apiSecret, url } = validateLiveKitEnv();
    const egressClient = new EgressClient(url, apiKey, apiSecret);

    const response = await egressClient.startRoomCompositeEgress(data.roomName, {
      layout: "single", 
      rtmp: {
        urls: [data.youtubeRtmpUrl],
      }
    });

    return { egressId: response.egressId };
  });

// 4. Egress ని ఆపడం
export const stopLiveKitEgress = createServerFn({ method: "POST" })
  .input((data: { egressId: string }) => data)
  .handler(async ({ data }) => {
    const { apiKey, apiSecret, url } = validateLiveKitEnv();
    const egressClient = new EgressClient(url, apiKey, apiSecret);
    const response = await egressClient.stopEgress(data.egressId);
    return { egressId: response.egressId };
  });
