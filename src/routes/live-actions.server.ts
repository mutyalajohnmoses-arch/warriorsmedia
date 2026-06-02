import { createServerFn } from "@tanstack/react-start";
import { AccessToken, EgressClient } from "livekit-server-sdk";

function validateLiveKitEnv() {
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  const url = process.env.LIVEKIT_URL;

  if (!apiKey || !apiSecret || !url) {
    throw new Error("Missing LiveKit Environment variables on server side.");
  }
  return { apiKey, apiSecret, url };
}

// 1. Generate WebRTC token
export const generateLiveKitToken = createServerFn({ method: "POST" })
  .inputValidator((data: any) => {
    if (!data?.roomName || !data?.participantName) throw new Error("Room & Participant Name required");
    return data;
  })
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

    return { token: await token.toJwt(), url, roomName: data.roomName };
  });

// 2. Trigger Egress directly to YouTube RTMP (Using standard object mapping to prevent SDK serialization errors)
export const startLiveKitEgress = createServerFn({ method: "POST" })
  .inputValidator((data: any) => {
    if (!data?.roomName || !data?.youtubeStreamKey) throw new Error("Missing Room Name or Stream Key");
    return data;
  })
  .handler(async ({ data }) => {
    try {
      const { apiKey, apiSecret, url } = validateLiveKitEnv();
      const egressClient = new EgressClient(url, apiKey, apiSecret);
      const youtubeRtmpUrl = `rtmps://a.rtmp.youtube.com/live2/${data.youtubeStreamKey}`;

      // Call via standard raw parameters to completely bypass browser-bundler structure corruption
      const response = await egressClient.startRoomCompositeEgress(
        data.roomName,
        {
          layout: "single",
          rtmpOutputs: [{
            urls: [youtubeRtmpUrl]
          }]
        },
        {
          width: 1280,
          height: 720,
          framerate: 30,
          videoBitrate: 2500,
          audioBitrate: 128
        }
      );

      return { egressId: response.egressId, status: response.status };
    } catch (error: any) {
      throw new Error(error.message || "LiveKit Egress failed to initialize");
    }
  });

// 3. Stop Egress
export const stopLiveKitEgress = createServerFn({ method: "POST" })
  .inputValidator((data: any) => {
    if (!data?.egressId) throw new Error("Egress ID is required");
    return data;
  })
  .handler(async ({ data }) => {
    const { apiKey, apiSecret, url } = validateLiveKitEnv();
    const egressClient = new EgressClient(url, apiKey, apiSecret);
    const response = await egressClient.stopEgress(data.egressId);
    return { egressId: response.egressId, status: response.status };
  });
