/**
 * useLiveKitRoom Hook
 * Manages LiveKit room connection state and provides utilities for stream management
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { Room, RoomEvent, ParticipantEvent } from "livekit-client";
import {
  connectToLiveKitRoom,
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

    connectionRef.current = true;
    setError(null);

    try {
      console.log("[useLiveKitRoom] Connecting to room:", options.roomName);

      // Connect to room
      const liveKitRoom = await connectToLiveKitRoom({
        url: options.url,
        token: options.token,
        roomName: options.roomName,
      });

      // Set up event listeners
      liveKitRoom.on(RoomEvent.Connected, () => {
        console.log("[useLiveKitRoom] Room connected");
        setIsConnected(true);
        options.onConnected?.();
      });

      liveKitRoom.on(RoomEvent.Disconnected, () => {
        console.log("[useLiveKitRoom] Room disconnected");
        setIsConnected(false);
        connectionRef.current = false;
      });

      liveKitRoom.on(RoomEvent.ParticipantConnected, (participant) => {
        console.log("[useLiveKitRoom] Participant connected:", participant.name);
        setParticipantCount((prev) => prev + 1);
      });

      liveKitRoom.on(RoomEvent.ParticipantDisconnected, (participant) => {
        console.log("[useLiveKitRoom] Participant disconnected:", participant.name);
        setParticipantCount((prev) => Math.max(0, prev - 1));
      });

      liveKitRoom.on(RoomEvent.MediaDevicesError, (error: Error) => {
        console.error("[useLiveKitRoom] Room error:", error);
        setError(error);
        options.onError?.(error);
      });

      // Publish tracks
      console.log("[useLiveKitRoom] Publishing tracks");
      setIsPublishing(true);
      await publishTracksToRoom(liveKitRoom);
      setIsPublishing(false);

      setRoom(liveKitRoom);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error("[useLiveKitRoom] Connection failed:", error);
      setError(error);
      options.onError?.(error);
      connectionRef.current = false;
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
      const error = err instanceof Error ? err : new Error(String(err));
      console.error("[useLiveKitRoom] Disconnect failed:", error);
      setError(error);
      options.onError?.(error);
    }
  }, [room, options]);

  const toggleCameraTrack = useCallback(
    (enabled: boolean) => {
      if (room) {
        toggleCamera(room, enabled);
      }
    },
    [room],
  );

  const toggleMicTrack = useCallback(
    (enabled: boolean) => {
      if (room) {
        toggleMicrophone(room, enabled);
      }
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
