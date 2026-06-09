/**
 * LiveKit Server Functions
 * Handles server-side LiveKit operations: token generation, room management, and egress
 */

import { createServerFn } from "@tanstack/react-start";
import { AccessToken } from "livekit-server-sdk";
import { EgressClient, RoomCompositeEgressRequest, EncodingOptions } from "livekit-server-sdk";

// Validate environment variables
function validateLiveKitEnv() {
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  const url = process.env.LIVEKIT_URL;

  if (!apiKey) throw new Error("LIVEKIT_API_KEY environment variable not set");
  if (!apiSecret) throw new Error("LIVEKIT_API_SECRET environment variable not set");
  if (!url) throw new Error("LIVEKIT_URL environment variable not set");

  return { apiKey, apiSecret, url };
}

/**
 * Generate a LiveKit access token for a participant
 */
export const generateLiveKitToken = createServerFn({ method: "POST" })
  .inputValidator(
    (data: {
      roomName: string;
      participantName: string;
      canPublish?: boolean;
      canSubscribe?: boolean;
    }) => {
      if (!data?.roomName) throw new Error("Room name is required");
      if (!data?.participantName) throw new Error("Participant name is required");
      return data;
    },
  )
  .handler(async ({ data }) => {
    try {
      const { apiKey, apiSecret, url } = validateLiveKitEnv();

      console.log("[LiveKit] Generating token", {
        roomName: data.roomName,
        participantName: data.participantName,
        url,
        canPublish: data.canPublish !== false,
        canSubscribe: data.canSubscribe !== false,
      });

      // Create access token
      const token = new AccessToken(apiKey, apiSecret, {
        identity: data.participantName,
        ttl: 60 * 60, // 1 hour
      } as any);
      (token as any).addGrant({
        room: data.roomName,
        roomJoin: true,
        canPublish: data.canPublish !== false,
        canPublishData: true,
        canSubscribe: data.canSubscribe !== false,
      });

      const jwt = await token.toJwt();

      console.log("[LiveKit] Token generated successfully (length:", jwt.length, ")");

      return {
        token: jwt,
        url: url,
        roomName: data.roomName,
      };
    } catch (error) {
      console.error("[LiveKit] Token generation failed:", error);
      throw new Error(error instanceof Error ? error.message : "Failed to generate LiveKit token");
    }
  });

/**
 * Start LiveKit Egress to YouTube Live
 */
export const startLiveKitEgress = createServerFn({ method: "POST" })
  .inputValidator((data: { roomName: string; youtubeStreamKey: string; title: string }) => {
    if (!data?.roomName) throw new Error("Room name is required");
    if (!data?.youtubeStreamKey) throw new Error("YouTube stream key is required");
    if (!data?.title) throw new Error("Stream title is required");
    return data;
  })
  .handler(async ({ data }) => {
    try {
      const { apiKey, apiSecret, url } = validateLiveKitEnv();

      console.log("[LiveKit Egress] Starting egress for room:", data.roomName);

      const egressClient = new EgressClient(url, apiKey, apiSecret);

      // Create YouTube RTMP output URL
      const youtubeRtmpUrl = `rtmps://a.rtmp.youtube.com/live2/${data.youtubeStreamKey}`;

      // Configure egress request
      const request = new RoomCompositeEgressRequest({
        roomName: data.roomName,
        output: {
          case: "rtmpOutput",
          value: {
            urls: [youtubeRtmpUrl],
          },
        } as any,
        options: {
          audioCodec: 1,
          videoCodec: 1,
          width: 1280,
          height: 720,
          depth: 24,
          framerate: 30,
          audioBitrate: 128,
          videoBitrate: 2500,
        } as any,
      });

      // Start egress
      const response = await (egressClient as any).startRoomCompositeEgress(request);

      console.log("[LiveKit Egress] Egress started successfully:", response.egressId);

      return {
        egressId: response.egressId,
        status: response.status,
      };
    } catch (error) {
      console.error("[LiveKit Egress] Failed to start egress:", error);
      throw new Error(error instanceof Error ? error.message : "Failed to start LiveKit egress");
    }
  });

/**
 * Stop LiveKit Egress
 */
export const stopLiveKitEgress = createServerFn({ method: "POST" })
  .inputValidator((data: { egressId: string }) => {
    if (!data?.egressId) throw new Error("Egress ID is required");
    return data;
  })
  .handler(async ({ data }) => {
    try {
      const { apiKey, apiSecret, url } = validateLiveKitEnv();

      console.log("[LiveKit Egress] Stopping egress:", data.egressId);

      const egressClient = new EgressClient(url, apiKey, apiSecret);

      // Stop egress
      const response = await (egressClient as any).stopEgress(data.egressId);

      console.log("[LiveKit Egress] Egress stopped successfully");

      return {
        egressId: response.egressId,
        status: response.status,
      };
    } catch (error) {
      console.error("[LiveKit Egress] Failed to stop egress:", error);
      throw new Error(error instanceof Error ? error.message : "Failed to stop LiveKit egress");
    }
  });

/**
 * Get egress status
 */
export const getLiveKitEgressStatus = createServerFn({ method: "GET" })
  .inputValidator((data: { egressId: string }) => {
    if (!data?.egressId) throw new Error("Egress ID is required");
    return data;
  })
  .handler(async ({ data }) => {
    try {
      const { apiKey, apiSecret, url } = validateLiveKitEnv();

      console.log("[LiveKit Egress] Getting status for egress:", data.egressId);

      const egressClient = new EgressClient(url, apiKey, apiSecret);

      // Get egress info
      const response = await (egressClient as any).listEgress({
        egressId: data.egressId,
      });

      if (!response || response.length === 0) {
        throw new Error("Egress not found");
      }

      const egress = response[0];

      console.log("[LiveKit Egress] Status retrieved:", egress.status);

      return {
        egressId: egress.egressId,
        status: egress.status,
        startedAt: egress.startedAt?.toString(),
        updatedAt: egress.updatedAt?.toString(),
      };
    } catch (error) {
      console.error("[LiveKit Egress] Failed to get status:", error);
      throw new Error(
        error instanceof Error ? error.message : "Failed to get LiveKit egress status",
      );
    }
  });
