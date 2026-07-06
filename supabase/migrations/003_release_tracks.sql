-- ===========================================================================
-- Migration: album / EP track linking (release_tracks junction)
-- ---------------------------------------------------------------------------
-- Adds a self-referencing many-to-many relationship on `releases`, so an Album
-- or EP (the "album") can own an ordered list of child track releases (the
-- "tracks"). The tracks are real `releases` rows, reused across albums (e.g. a
-- single that also appears on a compilation). Mirrors the `release_artists`
-- junction pattern. Run once in the Supabase SQL editor if your project
-- predates the change.
-- ===========================================================================

create table if not exists public.release_tracks (
  album_id uuid not null references public.releases (id) on delete cascade,
  track_id uuid not null references public.releases (id) on delete cascade,
  -- Ordering of the track within the album/EP (0-based).
  position int not null default 0,
  primary key (album_id, track_id),
  -- A release can never be its own track.
  constraint release_tracks_no_self check (album_id <> track_id)
);

-- Look up an album's tracks (ordered) and, in reverse, which albums a track is on.
create index if not exists release_tracks_album_idx on public.release_tracks (album_id, position);
create index if not exists release_tracks_track_idx on public.release_tracks (track_id);

-- RLS on, no policies: only the service-role (main process) can touch it.
alter table public.release_tracks enable row level security;
