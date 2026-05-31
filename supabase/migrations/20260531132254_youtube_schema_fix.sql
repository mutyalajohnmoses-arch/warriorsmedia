-- Ensure youtube_channels table exists
create table if not exists public.youtube_channels (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  channel_id text not null unique,
  title text not null,
  description text,
  custom_url text,
  profile_image_url text,
  banner_image_url text,
  subscriber_count text default '0',
  view_count text default '0',
  video_count text default '0',
  published_at timestamp with time zone,
  access_token text not null,
  refresh_token text,
  token_expires_at timestamp with time zone,
  is_connected boolean default true,
  last_synced_at timestamp with time zone,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Ensure youtube_videos table exists
create table if not exists public.youtube_videos (
  id uuid default gen_random_uuid() primary key,
  channel_id uuid not null references public.youtube_channels(id) on delete cascade,
  video_id text not null unique,
  title text not null,
  description text,
  thumbnail_url text,
  published_at timestamp with time zone,
  view_count text default '0',
  like_count text default '0',
  comment_count text default '0',
  duration text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.youtube_channels enable row level security;
alter table public.youtube_videos enable row level security;

-- Drop existing policies if they exist to avoid errors
drop policy if exists "Users can view their own YouTube channels" on public.youtube_channels;
drop policy if exists "Users can insert their own YouTube channels" on public.youtube_channels;
drop policy if exists "Users can update their own YouTube channels" on public.youtube_channels;
drop policy if exists "Users can delete their own YouTube channels" on public.youtube_channels;

drop policy if exists "Users can view videos from their connected channels" on public.youtube_videos;
drop policy if exists "Users can insert videos for their channels" on public.youtube_videos;
drop policy if exists "Users can update videos for their channels" on public.youtube_videos;
drop policy if exists "Users can delete videos for their channels" on public.youtube_videos;

-- Create RLS policies for youtube_channels
create policy "Users can view their own YouTube channels"
  on public.youtube_channels for select
  using (auth.uid() = user_id);

create policy "Users can insert their own YouTube channels"
  on public.youtube_channels for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own YouTube channels"
  on public.youtube_channels for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own YouTube channels"
  on public.youtube_channels for delete
  using (auth.uid() = user_id);

-- Create RLS policies for youtube_videos
create policy "Users can view videos from their connected channels"
  on public.youtube_videos for select
  using (
    channel_id in (
      select id from public.youtube_channels
      where user_id = auth.uid()
    )
  );

create policy "Users can insert videos for their channels"
  on public.youtube_videos for insert
  with check (
    channel_id in (
      select id from public.youtube_channels
      where user_id = auth.uid()
    )
  );

create policy "Users can update videos for their channels"
  on public.youtube_videos for update
  using (
    channel_id in (
      select id from public.youtube_channels
      where user_id = auth.uid()
    )
  )
  with check (
    channel_id in (
      select id from public.youtube_channels
      where user_id = auth.uid()
    )
  );

create policy "Users can delete videos for their channels"
  on public.youtube_videos for delete
  using (
    channel_id in (
      select id from public.youtube_channels
      where user_id = auth.uid()
    )
  );

-- Create indexes for better performance
create index if not exists idx_youtube_channels_user_id on public.youtube_channels(user_id);
create index if not exists idx_youtube_channels_channel_id on public.youtube_channels(channel_id);
create index if not exists idx_youtube_videos_channel_id on public.youtube_videos(channel_id);
create index if not exists idx_youtube_videos_video_id on public.youtube_videos(video_id);
