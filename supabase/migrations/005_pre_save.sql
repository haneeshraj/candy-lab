-- ===========================================================================
-- Migration: pre-save / countdown link (pre_save_link)
-- ---------------------------------------------------------------------------
-- Lets a release promote itself before it launches. While the current time is
-- before `release_date`, the public page shows a live countdown and this
-- pre-save link instead of the streaming platform links; once `release_date`
-- arrives the countdown and pre-save link disappear and the platform links
-- become visible. The pre/post state is DERIVED from `release_date` at read
-- time (never stored), so every consumer — the app and the public website —
-- shows the same thing from the current time alone. Nullable: existing releases
-- default to null (no pre-save link), which is fully backwards compatible.
-- Run once in the Supabase SQL editor if your project predates the change.
-- ===========================================================================

alter table public.releases
  add column if not exists pre_save_link text;
