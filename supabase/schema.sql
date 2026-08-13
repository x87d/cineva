-- Cineva — initial database schema
-- Run this once in your Supabase project: SQL Editor → New query → paste → Run.
-- It creates the tables, a trigger that auto-creates a profile on sign-up,
-- and Row-Level Security so every user can only read/write their own rows.

-- ---------------------------------------------------------------------------
-- 1) profiles — one row per authenticated user
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  preferences  jsonb not null default '{}'::jsonb,   -- quiz answers: favourite genres, this-or-that
  created_at   timestamptz not null default now()
);

-- Create the profile row automatically whenever a new auth user is created.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- 2) watched — films the user has seen, with an optional 1–5 rating
-- ---------------------------------------------------------------------------
create table if not exists public.watched (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references auth.users (id) on delete cascade,
  tmdb_id    integer not null,
  rating     smallint check (rating between 1 and 5),
  source     text not null default 'log',            -- 'log' | 'taste_test'
  watched_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (user_id, tmdb_id)
);
create index if not exists watched_user_idx on public.watched (user_id);

-- ---------------------------------------------------------------------------
-- 3) watchlist — films the user wants to see
-- ---------------------------------------------------------------------------
create table if not exists public.watchlist (
  id       bigint generated always as identity primary key,
  user_id  uuid not null references auth.users (id) on delete cascade,
  tmdb_id  integer not null,
  added_at timestamptz not null default now(),
  unique (user_id, tmdb_id)
);
create index if not exists watchlist_user_idx on public.watchlist (user_id);

-- ---------------------------------------------------------------------------
-- Row-Level Security — a user can only touch their own data
-- ---------------------------------------------------------------------------
alter table public.profiles  enable row level security;
alter table public.watched   enable row level security;
alter table public.watchlist enable row level security;

create policy "profiles: read own"   on public.profiles  for select using (auth.uid() = id);
create policy "profiles: update own" on public.profiles  for update using (auth.uid() = id);

create policy "watched: crud own"    on public.watched
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "watchlist: crud own"  on public.watchlist
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
