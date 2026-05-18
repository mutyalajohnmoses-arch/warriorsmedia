CREATE TABLE public.live_streams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel_id TEXT,
  broadcast_id TEXT,
  stream_id TEXT,
  title TEXT NOT NULL,
  description TEXT,
  privacy_status TEXT DEFAULT 'public',
  status TEXT DEFAULT 'ready',
  thumbnail_url TEXT,
  hashtags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.live_streams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users view own live streams" ON public.live_streams
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "users insert own live streams" ON public.live_streams
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users update own live streams" ON public.live_streams
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "users delete own live streams" ON public.live_streams
  FOR DELETE TO authenticated USING (auth.uid() = user_id);