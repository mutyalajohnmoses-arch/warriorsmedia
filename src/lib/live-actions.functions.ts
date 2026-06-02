import { createServerFn } from "@tanstack/react-start";
import { AccessToken, EgressClient, StreamProtocol } from "livekit-server-sdk";

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

export const startLiveKitEgress = createServerFn({ method: "POST" })
  .inputValidator((data: { roomName: string; youtubeStreamKey: string }) => data)
  .handler(async ({ data }) => {
    const { apiKey, apiSecret, url } = validateLiveKitEnv();
    const egressClient = new EgressClient(url, apiKey, apiSecret);
    const youtubeRtmpUrl = `rtmp://a.rtmp.youtube.com/live2/${data.youtubeStreamKey}`;

    console.log("[startLiveKitEgress] Starting egress", {
      roomName: data.roomName,
      rtmpHost: "rtmp://a.rtmp.youtube.com/live2/***",
    });

    const response = await egressClient.startRoomCompositeEgress(
      data.roomName,
      {
        stream: {
          protocol: StreamProtocol.RTMP,
          urls: [youtubeRtmpUrl],
        },
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
