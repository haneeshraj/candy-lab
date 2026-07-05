-- ===========================================================================
-- Migration: auth + access control (profiles)
-- ---------------------------------------------------------------------------
-- Adds a `profiles` table keyed to Supabase Auth users, with an access status
-- (pending / approved / banned) and a role (user / admin). A trigger auto-
-- creates a pending profile whenever someone signs in with Google for the first
-- time. The desktop app reads/writes this table with the service-role key from
-- its main process, so RLS stays on with no public policies.
--
-- After running this, sign in through the app once, then run the bootstrap at
-- the bottom to make yourself the seed admin.
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

-- RLS on, no policies: only the service-role (main process) can touch it.
alter table public.profiles enable row level security;

-- Auto-create a pending profile for every new auth user, seeding the display
-- name from the Google identity metadata when available.
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

-- ── One-time bootstrap (run AFTER you've signed in through the app once) ──────
-- update public.profiles set role = 'admin', status = 'approved'
-- where email = 'banisetti.h@northeastern.edu';
