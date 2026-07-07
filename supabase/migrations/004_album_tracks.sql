-- ===========================================================================
-- Migration: album-only tracks (is_album_track flag)
-- ---------------------------------------------------------------------------
-- Lets an Album/EP own "album-only" tracks — releases that exist ONLY as part of
-- that album (never released standalone). These are created inline from the album
-- form and are hidden from the main catalog. When such a track has no cover art
-- or canvas of its own, the app resolves the album's media at read time (see
-- `listReleaseTracks`), so you upload the album artwork once instead of per track.
-- Run once in the Supabase SQL editor if your project predates the change.
-- ===========================================================================

alter table public.releases
  add column if not exists is_album_track boolean not null default false;

-- The catalog list filters on this, so index it for fast exclusion.
create index if not exists releases_is_album_track_idx on public.releases (is_album_track);
