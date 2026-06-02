import { createServerFn } from "@tanstack/react-start";
import { AccessToken, EgressClient } from "livekit-server-sdk";

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

export const startLiveKitEgress = createServerFn({ method: "POST" })
  .input((data: { roomName: string; youtubeStreamKey: string }) => data)
  .handler(async ({ data }) => {
    const { apiKey, apiSecret, url } = validateLiveKitEnv();
    const egressClient = new EgressClient(url, apiKey, apiSecret);
    const youtubeRtmpUrl = `rtmps://a.rtmp.youtube.com/live2/${data.youtubeStreamKey}`;

    // Layout config missing అవ్వడం వల్లే 'file' crash వచ్చింది. దీన్ని ఇక్కడ ఫిక్స్ చేశాను.
    const response = await egressClient.startRoomCompositeEgress(data.roomName, {
      layout: "single", 
      rtmp: {
        urls: [youtubeRtmpUrl],
      }
    });

    return { egressId: response.egressId };
  });

export const stopLiveKitEgress = createServerFn({ method: "POST" })
  .input((data: { egressId: string }) => data)
  .handler(async ({ data }) => {
    const { apiKey, apiSecret, url } = validateLiveKitEnv();
    const egressClient = new EgressClient(url, apiKey, apiSecret);
    const response = await egressClient.stopEgress(data.egressId);
    return { egressId: response.egressId };
  });
