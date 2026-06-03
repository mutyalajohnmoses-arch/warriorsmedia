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

// --- మీ పాత కోడ్ పైన ఉంది, ఈ క్రింది ఫంక్షన్‌ను కింద యాడ్ చేశాను ---

export const generateAIThumbnailServerFn = createServerFn({
  method: "POST",
})
  .validator((data: { prompt: string; streamTitle: string; baseImageB64?: string | null }) => data)
  .handler(async ({ data }) => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("Missing OPENAI_API_KEY environment variable on the server.");
    }

    // 1. Fallback Rule: If custom prompt is empty, use the stream title
    const userCorePrompt = data.prompt.trim() || data.streamTitle.trim();
    if (!userCorePrompt) {
      throw new Error("Cannot generate image: Both prompt and stream title are empty.");
    }

    // 2. Build a high-quality systemized prompt wrapper (Anti-text rule included)
    let finalPromptDescription = `Create a professional, high-quality vibrant 16:9 cinematic YouTube live stream thumbnail. Subject: ${userCorePrompt}. Style: Clean digital art, immersive graphic composition, vivid studio lighting. Strict Rule: DO NOT include any text, typography, letters, or words on the canvas.`;

    try {
      // 3. Multi-modal logic: Context via OpenAI GPT-4o Vision
      if (data.baseImageB64) {
        const visionResponse = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-4o",
            messages: [
              {
                role: "user",
                content: [
                  { type: "text", text: "Describe the visual subject, art style, character framing, and color palette of this image in detail so it can be re-created or heavily referenced in a new DALL-E 3 prompt." },
                  { type: "image_url", image_url: { url: data.baseImageB64 } }
                ]
              }
            ]
          }),
        });

        if (visionResponse.ok) {
          const visionData = await visionResponse.json();
          const visualContext = visionData.choices[0]?.message?.content || "";
          finalPromptDescription += ` Heavily adapt and incorporate the visual elements, subject framing, and character reference features described here: ${visualContext}`;
        }
      }

      // 4. Hit DALL-E 3 with proper 16:9 landscape dimensions
      const response = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "dall-e-3",
          prompt: finalPromptDescription,
          n: 1,
          size: "1792x1024", // Fixed landscape orientation for perfect YouTube framing
          quality: "standard",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "OpenAI API returned an error status.");
      }

      const result = await response.json();
      const imageUrl = result.data[0]?.url;

      if (!imageUrl) {
        throw new Error("No image URL received from OpenAI.");
      }

      return { imageUrl };
    } catch (error: any) {
      console.error("Server API Error during image creation:", error);
      throw new Error(error.message || "Failed to process image creation workflow.");
    }
  });
