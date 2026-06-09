/**
 * useLiveKitRoom Hook
 * Manages LiveKit room connection state and provides utilities for stream management
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { Room, RoomEvent, ConnectionState } from "livekit-client";
import {
  publishTracksToRoom,
  disconnectFromLiveKitRoom,
  toggleCamera,
  toggleMicrophone,
} from "@/lib/livekit-client";

export interface UseLiveKitRoomOptions {
  url: string;
  token: string;
  roomName: string;
  onConnected?: () => void;
  onDisconnected?: () => void;
  onError?: (error: Error) => void;
}

export interface UseLiveKitRoomState {
  room: Room | null;
  isConnected: boolean;
  isPublishing: boolean;
  error: Error | null;
  participantCount: number;
}

const CONNECT_TIMEOUT_MS = 15000;

export function useLiveKitRoom(options: UseLiveKitRoomOptions): UseLiveKitRoomState & {
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  toggleCameraTrack: (enabled: boolean) => void;
  toggleMicTrack: (enabled: boolean) => void;
} {
  const [room, setRoom] = useState<Room | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [participantCount, setParticipantCount] = useState(0);
  const connectionRef = useRef<boolean>(false);

  const connect = useCallback(async () => {
    if (connectionRef.current) {
      console.warn("[useLiveKitRoom] Already connecting or connected");
      return;
    }

    if (!options.url) {
      const err = new Error(
        "LiveKit URL is missing. Verify LIVEKIT_URL is configured on the server.",
      );
      console.error("[useLiveKitRoom]", err.message);
      setError(err);
      options.onError?.(err);
      return;
    }
    if (!options.token) {
      const err = new Error("LiveKit token is missing or invalid.");
      console.error("[useLiveKitRoom]", err.message);
      setError(err);
      options.onError?.(err);
      return;
    }

    connectionRef.current = true;
    setError(null);

    const liveKitRoom = new Room();
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    try {
      console.log("[useLiveKitRoom] Preparing to connect", {
        url: options.url,
        roomName: options.roomName,
        tokenPreview: options.token.slice(0, 20) + "...",
      });

      // Register listeners BEFORE connect() so we don't miss the Connected event
      liveKitRoom.on(RoomEvent.Connected, () => {
        console.log("[useLiveKitRoom] ✅ RoomEvent.Connected fired");
        setIsConnected(true);
        if (timeoutId) clearTimeout(timeoutId);
        options.onConnected?.();
      });

      liveKitRoom.on(RoomEvent.Disconnected, (reason) => {
        console.log("[useLiveKitRoom] RoomEvent.Disconnected", reason);
        setIsConnected(false);
        connectionRef.current = false;
        options.onDisconnected?.();
      });

      liveKitRoom.on(RoomEvent.ConnectionStateChanged, (state) => {
        console.log("[useLiveKitRoom] ConnectionState →", state);
        if (state === ConnectionState.Connected) {
          setIsConnected(true);
        }
      });

      liveKitRoom.on(RoomEvent.ParticipantConnected, (participant) => {
        console.log("[useLiveKitRoom] Participant connected:", participant.identity);
        setParticipantCount((prev) => prev + 1);
      });

      liveKitRoom.on(RoomEvent.ParticipantDisconnected, (participant) => {
        console.log("[useLiveKitRoom] Participant disconnected:", participant.identity);
        setParticipantCount((prev) => Math.max(0, prev - 1));
      });

      liveKitRoom.on(RoomEvent.MediaDevicesError, (e: Error) => {
        console.error("[useLiveKitRoom] MediaDevicesError:", e);
        setError(e);
        options.onError?.(e);
      });

      // 15-second connection timeout
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(
            new Error(
              `Connection timed out after ${CONNECT_TIMEOUT_MS / 1000}s. Check VITE_LIVEKIT_URL/LIVEKIT_URL and token permissions.`,
            ),
          );
        }, CONNECT_TIMEOUT_MS);
      });

      console.log("[useLiveKitRoom] Calling room.connect()…");
      await Promise.race([liveKitRoom.connect(options.url, options.token), timeoutPromise]);
      if (timeoutId) clearTimeout(timeoutId);
      console.log("[useLiveKitRoom] room.connect() resolved. WebSocket state:", liveKitRoom.state);

      // Ensure UI flips even if Connected event was missed
      setIsConnected(true);

      console.log("[useLiveKitRoom] Publishing local tracks…");
      setIsPublishing(true);
      await publishTracksToRoom(liveKitRoom);
      setIsPublishing(false);
      console.log("[useLiveKitRoom] Tracks published");

      setRoom(liveKitRoom);
    } catch (err) {
      if (timeoutId) clearTimeout(timeoutId);
      const e = err instanceof Error ? err : new Error(String(err));
      console.error("[useLiveKitRoom] ❌ Connection failed:", e);
      setError(e);
      setIsPublishing(false);
      options.onError?.(e);
      connectionRef.current = false;
      try {
        await liveKitRoom.disconnect();
      } catch {
        /* noop */
      }
    }
  }, [options]);

  const disconnect = useCallback(async () => {
    if (!room) {
      console.warn("[useLiveKitRoom] No room to disconnect from");
      return;
    }

    try {
      console.log("[useLiveKitRoom] Disconnecting from room");
      await disconnectFromLiveKitRoom(room);
      setRoom(null);
      setIsConnected(false);
      setIsPublishing(false);
      connectionRef.current = false;
      options.onDisconnected?.();
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err));
      console.error("[useLiveKitRoom] Disconnect failed:", e);
      setError(e);
      options.onError?.(e);
    }
  }, [room, options]);

  const toggleCameraTrack = useCallback(
    (enabled: boolean) => {
      if (room) toggleCamera(room, enabled);
    },
    [room],
  );

  const toggleMicTrack = useCallback(
    (enabled: boolean) => {
      if (room) toggleMicrophone(room, enabled);
    },
    [room],
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (room && isConnected) {
        disconnectFromLiveKitRoom(room).catch((err) => {
          console.error("[useLiveKitRoom] Error during cleanup:", err);
        });
      }
    };
  }, [room, isConnected]);

  return {
    room,
    isConnected,
    isPublishing,
    error,
    participantCount,
    connect,
    disconnect,
    toggleCameraTrack,
    toggleMicTrack,
  };
}
