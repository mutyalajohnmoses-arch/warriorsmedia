-- Add LiveKit columns to live_streams table for new egress-based workflow
-- This migration adds support for LiveKit room names and egress IDs

ALTER TABLE live_streams
ADD COLUMN IF NOT EXISTS livekit_room_name TEXT,
ADD COLUMN IF NOT EXISTS livekit_egress_id TEXT,
ADD COLUMN IF NOT EXISTS stream_key TEXT;

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS live_streams_livekit_room_name_idx ON live_streams(livekit_room_name);
CREATE INDEX IF NOT EXISTS live_streams_livekit_egress_id_idx ON live_streams(livekit_egress_id);

-- Add comment to document the new columns
COMMENT ON COLUMN live_streams.livekit_room_name IS 'LiveKit room name for this broadcast session';
COMMENT ON COLUMN live_streams.livekit_egress_id IS 'LiveKit egress ID for YouTube streaming';
COMMENT ON COLUMN live_streams.stream_key IS 'YouTube stream key for RTMP ingestion (used by LiveKit egress)';
