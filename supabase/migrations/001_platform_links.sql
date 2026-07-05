-- ===========================================================================
-- Migration: replace `releases.platforms text[]` with `platform_links jsonb`.
-- ---------------------------------------------------------------------------
-- `platform_links` maps a platform name to that release's track URL, e.g.
--   {"Spotify": "https://open.spotify.com/...", "YouTube": "https://..."}
-- A platform counts as "released on" when it has a (non-empty) URL. Run this
-- once in the Supabase SQL editor if your project predates the change.
-- ===========================================================================

alter table public.releases
  add column if not exists platform_links jsonb not null default '{}';

-- Optional: carry over which platforms were previously set, with blank URLs to
-- fill in later. Left commented because a blank URL means "not released on" in
-- the app's model — re-enter each URL via the Edit form instead.
-- update public.releases
--   set platform_links = coalesce(
--     (select jsonb_object_agg(p, '') from unnest(platforms) as p), '{}'::jsonb)
--   where platforms is not null and array_length(platforms, 1) > 0;

alter table public.releases drop column if exists platforms;
