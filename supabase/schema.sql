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

-- Helpful indexes for search / filtering as the catalog grows.
create index if not exists releases_created_at_idx on public.releases (created_at desc);
create index if not exists releases_project_type_idx on public.releases (project_type);
create index if not exists release_artists_artist_idx on public.release_artists (artist_id);

-- ── Row Level Security ───────────────────────────────────────────────────────
-- Enabled with no policies: anon/authenticated clients get nothing. The app's
-- main process uses the service-role key, which bypasses RLS.
alter table public.releases        enable row level security;
alter table public.artists         enable row level security;
alter table public.release_artists enable row level security;

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
