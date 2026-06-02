import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useEffect } from "react";

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

  console.log("[LiveKit] Environment validation:", {
    hasApiKey: !!apiKey,
    hasApiSecret: !!apiSecret,
    hasUrl: !!url,
    url: url,
  });

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

      console.log("[LiveKit] Generating token for room:", {
        roomName: data.roomName,
        participantName: data.participantName,
        canPublish: data.canPublish !== false,
        canSubscribe: data.canSubscribe !== false,
      });

      // Create access token with explicit permissions
      const token = new AccessToken(apiKey, apiSecret, {
        identity: data.participantName,
        name: data.participantName,
        metadata: JSON.stringify({
          timestamp: new Date().toISOString(),
          roomName: data.roomName,
        }),
        grants: {
          room: data.roomName,
          roomJoin: true,
          canPublish: data.canPublish !== false,
          canPublishData: true,
          canSubscribe: data.canSubscribe !== false,
        },
      });

      const jwt = await token.toJwt();

      console.log("[LiveKit] Token generated successfully", {
        roomName: data.roomName,
        participantName: data.participantName,
        tokenLength: jwt.length,
      });

      return {
        token: jwt,
        url: url,
        roomName: data.roomName,
      };
    } catch (error) {
      console.error("[LiveKit] Token generation failed:", error);
      throw new Error(
        error instanceof Error ? error.message : "Failed to generate LiveKit token",
      );
    }
  });

/**
 * Start LiveKit Egress to YouTube Live
 */
export const startLiveKitEgress = createServerFn({ method: "POST" })
  .inputValidator(
    (data: {
      roomName: string;
      youtubeStreamKey: string;
      title: string;
    }) => {
      if (!data?.roomName) throw new Error("Room name is required");
      if (!data?.youtubeStreamKey) throw new Error("YouTube stream key is required");
      if (!data?.title) throw new Error("Stream title is required");
      return data;
    },
  )
  .handler(async ({ data }) => {
    try {
      const { apiKey, apiSecret, url } = validateLiveKitEnv();

      console.log("[LiveKit Egress] Starting egress for room:", {
        roomName: data.roomName,
        youtubeStreamKey: data.youtubeStreamKey.substring(0, 10) + "...",
        title: data.title,
        liveKitUrl: url,
      });

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
        },
        options: {
          audioCodec: 1, // OPUS
          videoCodec: 1, // H264
          width: 1280,
          height: 720,
          depth: 24,
          framerate: 30,
          audioBitrate: 128,
          videoBitrate: 2500,
        },
      });

      // Start egress
      const response = await egressClient.startRoomCompositeEgress(request);

      console.log("[LiveKit Egress] Egress started successfully:", {
        egressId: response.egressId,
        status: response.status,
        roomName: data.roomName,
      });

      return {
        egressId: response.egressId,
        status: response.status,
      };
    } catch (error) {
      console.error("[LiveKit Egress] Failed to start egress:", error);
      throw new Error(
        error instanceof Error ? error.message : "Failed to start LiveKit egress",
      );
    }
  });

/**
 * Stop LiveKit Egress
 */
export const stopLiveKitEgress = createServerFn({ method: "POST" })
  .inputValidator(
    (data: {
      egressId: string;
    }) => {
      if (!data?.egressId) throw new Error("Egress ID is required");
      return data;
    },
  )
  .handler(async ({ data }) => {
    try {
      const { apiKey, apiSecret, url } = validateLiveKitEnv();

      console.log("[LiveKit Egress] Stopping egress:", {
        egressId: data.egressId,
        liveKitUrl: url,
      });

      const egressClient = new EgressClient(url, apiKey, apiSecret);

      // Stop egress
      const response = await egressClient.stopEgress(data.egressId);

      console.log("[LiveKit Egress] Egress stopped successfully", {
        egressId: response.egressId,
        status: response.status,
      });

      return {
        egressId: response.egressId,
        status: response.status,
      };
    } catch (error) {
      console.error("[LiveKit Egress] Failed to stop egress:", error);
      throw new Error(
        error instanceof Error ? error.message : "Failed to stop LiveKit egress",
      );
    }
  });

/**
 * Get egress status
 */
export const getLiveKitEgressStatus = createServerFn({ method: "GET" })
  .inputValidator(
    (data: {
      egressId: string;
    }) => {
      if (!data?.egressId) throw new Error("Egress ID is required");
      return data;
    },
  )
  .handler(async ({ data }) => {
    try {
      const { apiKey, apiSecret, url } = validateLiveKitEnv();

      console.log("[LiveKit Egress] Getting status for egress:", {
        egressId: data.egressId,
        liveKitUrl: url,
      });

      const egressClient = new EgressClient(url, apiKey, apiSecret);

      // Get egress info
      const response = await egressClient.listEgress({
        egressId: data.egressId,
      });

      if (!response || response.length === 0) {
        throw new Error("Egress not found");
      }

      const egress = response[0];

      console.log("[LiveKit Egress] Status retrieved:", {
        egressId: egress.egressId,
        status: egress.status,
      });

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

// TanStack Router route registration
export const Route = createFileRoute("/live-streaming-setup")({
  component: LiveStreamingSetupPage,
});

function LiveStreamingSetupPage() {
  const { auto } = Route.useSearch();

  useEffect(() => {
    if (auto === "true") {
      console.log("Auto-starting live streaming setup...");
      // Logic to automatically start the live streaming setup can go here
      // For example, trigger a modal or a function to initiate the process
    }
  }, [auto]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <h1 className="text-3xl font-bold text-foreground mb-4">Live Streaming Setup</h1>
      <p className="text-muted-foreground mb-8 text-center">
        Configure your live stream settings and go live to your audience.
      </p>
      <div className="bg-card p-8 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-xl font-semibold text-foreground mb-4">Stream Configuration</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="roomName" className="block text-sm font-medium text-muted-foreground">Room Name</label>
            <input
              type="text"
              id="roomName"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 bg-input text-foreground"
              placeholder="My Awesome Stream"
            />
          </div>
          <div>
            <label htmlFor="youtubeStreamKey" className="block text-sm font-medium text-muted-foreground">YouTube Stream Key</label>
            <input
              type="text"
              id="youtubeStreamKey"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 bg-input text-foreground"
              placeholder="Enter your YouTube stream key"
            />
          </div>
          <button
            className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Start Stream
          </button>
        </div>
      </div>
      {auto === "true" && (
        <p className="mt-4 text-sm text-green-500">Automatic setup initiated. Please configure and start your stream.</p>
      )}
    </div>
  );
}

