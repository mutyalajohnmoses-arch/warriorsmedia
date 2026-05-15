-- Create live_streams table
CREATE TABLE IF NOT EXISTS live_streams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  broadcast_id TEXT NOT NULL,
  stream_id TEXT NOT NULL,
  channel_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  privacy_status TEXT NOT NULL DEFAULT 'public',
  status TEXT NOT NULL DEFAULT 'ready',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for user_id for faster queries
CREATE INDEX IF NOT EXISTS live_streams_user_id_idx ON live_streams(user_id);

-- Create index for broadcast_id for faster lookups
CREATE INDEX IF NOT EXISTS live_streams_broadcast_id_idx ON live_streams(broadcast_id);

-- Create index for stream_id for faster lookups
CREATE INDEX IF NOT EXISTS live_streams_stream_id_idx ON live_streams(stream_id);

-- Enable RLS
ALTER TABLE live_streams ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for users to see their own live streams
CREATE POLICY "Users can view their own live streams"
  ON live_streams
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create RLS policy for users to insert their own live streams
CREATE POLICY "Users can insert their own live streams"
  ON live_streams
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create RLS policy for users to update their own live streams
CREATE POLICY "Users can update their own live streams"
  ON live_streams
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create RLS policy for users to delete their own live streams
CREATE POLICY "Users can delete their own live streams"
  ON live_streams
  FOR DELETE
  USING (auth.uid() = user_id);
