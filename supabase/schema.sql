-- ===========================================================================
-- Candy Lab — Releases CMS schema
-- ---------------------------------------------------------------------------
-- Run this once in your Supabase project's SQL editor (or via `supabase db`).
-- It is idempotent-ish: safe to re-run in a fresh project. See ./README.md for
-- the full setup (project creation, storage bucket, env vars).
--
-- Security model: the desktop app talks to Supabase ONLY from its Electron main
-- process, using the SERVICE ROLE key (never shipped to the renderer). So we
-- keep Row Level Security ENABLED with NO public policies — the database is
-- unreachable with the anon key, and only the trusted main process (holding the
-- service-role secret) can read/write. The service role bypasses RLS by design.
-- ===========================================================================

-- gen_random_uuid() lives in pgcrypto (already enabled on Supabase, but be safe).
create extension if not exists pgcrypto;

-- ── Releases ───────────────────────────────────────────────────────────────
create table if not exists public.releases (
  id              uuid primary key default gen_random_uuid(),
  project_name    text not null,
  project_type    text not null
                    check (project_type in
                      ('single', 'ep', 'album', 'remix', 'bootleg', 'compilation')),
  release_date    date,
  genres          text[] not null default '{}',
  -- Map of platform name -> track URL, e.g. {"Spotify": "https://open.spotify.com/..."}.
  platform_links  jsonb not null default '{}',
  visual_link     text,
  master_link     text,
  cover_art_url   text,
  canvas_url      text,
  preview_enabled boolean not null default false,
  -- True for "album-only" tracks: releases that exist only inside an Album/EP
  -- (created inline from the album form), hidden from the main catalog. When
  -- their cover_art_url / canvas_url is null, the app resolves the owning album's
  -- media at read time. Default false = a normal, standalone release.
  is_album_track  boolean not null default false,
  created_at      timestamptz not null default now()
);

-- ── Artists ─────────────────────────────────────────────────────────────────
create table if not exists public.artists (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  created_at timestamptz not null default now()
);

-- ── Release ↔ Artist junction ────────────────────────────────────────────────
create table if not exists public.release_artists (
  release_id uuid not null references public.releases (id) on delete cascade,
  artist_id  uuid not null references public.artists (id) on delete cascade,
  primary key (release_id, artist_id)
);

-- ── Album/EP ↔ Track junction (self-referencing) ─────────────────────────────
-- An Album or EP (album_id) owns an ordered list of child track releases
-- (track_id). Tracks are real `releases` rows and may appear on multiple albums.
create table if not exists public.release_tracks (
  album_id uuid not null references public.releases (id) on delete cascade,
  track_id uuid not null references public.releases (id) on delete cascade,
  position int not null default 0,
  primary key (album_id, track_id),
  constraint release_tracks_no_self check (album_id <> track_id)
);

-- Helpful indexes for search / filtering as the catalog grows.
create index if not exists releases_created_at_idx on public.releases (created_at desc);
create index if not exists releases_project_type_idx on public.releases (project_type);
create index if not exists releases_is_album_track_idx on public.releases (is_album_track);
create index if not exists release_artists_artist_idx on public.release_artists (artist_id);
create index if not exists release_tracks_album_idx on public.release_tracks (album_id, position);
create index if not exists release_tracks_track_idx on public.release_tracks (track_id);

-- ── Row Level Security ───────────────────────────────────────────────────────
-- Enabled with no policies: anon/authenticated clients get nothing. The app's
-- main process uses the service-role key, which bypasses RLS.
alter table public.releases        enable row level security;
alter table public.artists         enable row level security;
alter table public.release_artists enable row level security;
alter table public.release_tracks  enable row level security;

-- ===========================================================================
-- Storage bucket for media (cover art + Spotify canvas videos)
-- ---------------------------------------------------------------------------
-- Creates a PUBLIC bucket named `release-media` so cover art / canvas URLs are
-- directly viewable (e.g. on the future public website). Uploads still go only
-- through the service-role key in the main process.
-- ===========================================================================
insert into storage.buckets (id, name, public)
values ('release-media', 'release-media', true)
on conflict (id) do nothing;

-- ===========================================================================
-- Auth & access control (profiles)
-- ---------------------------------------------------------------------------
-- Gates the app to approved users. A trigger auto-creates a `pending` profile
-- on first Google sign-in; an admin approves/bans from the app. See README.md
-- and migrations/002_auth_profiles.sql.
-- ===========================================================================
do $$ begin
  create type public.access_status as enum ('pending', 'approved', 'banned');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.user_role as enum ('user', 'admin');
exception when duplicate_object then null; end $$;

create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  email      text not null,
  name       text,
  notes      text,
  role       public.user_role not null default 'user',
  status     public.access_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_status_idx on public.profiles (status);
alter table public.profiles enable row level security;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, name)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      split_part(new.email, '@', 1)
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
