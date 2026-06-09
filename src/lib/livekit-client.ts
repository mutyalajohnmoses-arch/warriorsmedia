/**
 * LiveKit Client Utilities
 * Handles browser-side LiveKit room connection, track publishing, and state management
 */

import { Room, RoomEvent, Track } from "livekit-client";

export interface LiveKitConnectionOptions {
  url: string;
  token: string;
  roomName: string;
}

export interface LiveKitConnectionState {
  isConnected: boolean;
  isPublishing: boolean;
  error: string | null;
  room: Room | null;
}

/**
 * Connect to a LiveKit room and publish camera/microphone tracks
 */
export async function connectToLiveKitRoom(
  options: LiveKitConnectionOptions,
): Promise<Room> {
  try {
    console.log("[LiveKit] Connecting to room:", options.roomName);

    const room = new Room();

    // Set up event listeners
    room.on(RoomEvent.Connected, () => {
      console.log("[LiveKit] Connected to room");
    });

    room.on(RoomEvent.Disconnected, () => {
      console.log("[LiveKit] Disconnected from room");
    });

    room.on(RoomEvent.ParticipantConnected, (participant) => {
      console.log("[LiveKit] Participant connected:", participant.name);
    });

    room.on(RoomEvent.ParticipantDisconnected, (participant) => {
      console.log("[LiveKit] Participant disconnected:", participant.name);
    });

    room.on(RoomEvent.TrackPublished, (publication, participant) => {
      console.log("[LiveKit] Track published:", publication.trackSid);
    });

    room.on(RoomEvent.TrackUnpublished, (publication, participant) => {
      console.log("[LiveKit] Track unpublished:", publication.trackSid);
    });

    room.on(RoomEvent.MediaDevicesError, (error: Error) => {
      console.error("[LiveKit] Room error:", error);
    });

    // Connect to the room
    await room.connect(options.url, options.token);

    console.log("[LiveKit] Successfully connected to room");
    return room;
  } catch (error) {
    console.error("[LiveKit] Failed to connect to room:", error);
    throw error;
  }
}

/**
 * Publish camera and microphone tracks to the room
 */
export async function publishTracksToRoom(room: Room): Promise<void> {
  try {
    console.log("[LiveKit] Requesting camera and microphone access");

    // Get user media (camera and microphone)
    const mediaStream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: "user",
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
      audio: true,
    });

    console.log("[LiveKit] Media stream obtained, publishing tracks");

    // Publish camera and microphone tracks
    await room.localParticipant.publishTrack(mediaStream.getVideoTracks()[0], {
      simulcast: false,
      videoCodec: "vp8",
    });

    await room.localParticipant.publishTrack(mediaStream.getAudioTracks()[0]);

    console.log("[LiveKit] Tracks published successfully");
  } catch (error) {
    console.error("[LiveKit] Failed to publish tracks:", error);
    throw error;
  }
}

/**
 * Stop publishing tracks and disconnect from the room
 */
export async function disconnectFromLiveKitRoom(room: Room | null): Promise<void> {
  if (!room) {
    console.warn("[LiveKit] No room to disconnect from");
    return;
  }

  try {
    console.log("[LiveKit] Disconnecting from room");

    // Stop all local tracks
    if (room.localParticipant) {
      room.localParticipant.trackPublications.forEach((publication) => {
        if (publication.track) {
          publication.track.stop();
        }
      });
    }

    // Disconnect from room
    await room.disconnect();

    console.log("[LiveKit] Successfully disconnected from room");
  } catch (error) {
    console.error("[LiveKit] Error disconnecting from room:", error);
    throw error;
  }
}

/**
 * Toggle camera on/off
 */
export function toggleCamera(room: Room | null, enabled: boolean): void {
  if (!room || !room.localParticipant) {
    console.warn("[LiveKit] No room or local participant");
    return;
  }

  room.localParticipant.videoTrackPublications.forEach((publication) => {
    if (publication.track) {
      if (enabled) publication.track.unmute();
      else publication.track.mute();
    }
  });

  console.log("[LiveKit] Camera toggled:", enabled ? "on" : "off");
}

/**
 * Toggle microphone on/off
 */
export function toggleMicrophone(room: Room | null, enabled: boolean): void {
  if (!room || !room.localParticipant) {
    console.warn("[LiveKit] No room or local participant");
    return;
  }

  room.localParticipant.audioTrackPublications.forEach((publication) => {
    if (publication.track) {
      if (enabled) publication.track.unmute();
      else publication.track.mute();
    }
  });

  console.log("[LiveKit] Microphone toggled:", enabled ? "on" : "off");
}

/**
 * Get the local video track for preview
 */
export function getLocalVideoTrack(room: Room | null): Track | undefined {
  if (!room || !room.localParticipant) {
    return undefined;
  }

  const videoPublication = Array.from(room.localParticipant.videoTrackPublications.values())[0];
  return videoPublication?.track;
}
