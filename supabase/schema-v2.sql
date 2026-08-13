-- Cineva — schema v2: usernames, profiles, and image storage
-- Run this in your Supabase project: SQL Editor → New query → paste → Run.
-- Safe to run once on top of the original schema.sql.

-- ---------------------------------------------------------------------------
-- 1) Profile fields
-- ---------------------------------------------------------------------------
alter table public.profiles add column if not exists username   text;
alter table public.profiles add column if not exists bio        text;
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists banner_url text;

-- Usernames are case-insensitively unique: "Abdel" and "abdel" can't both exist.
create unique index if not exists profiles_username_lower_idx
  on public.profiles (lower(username));

-- ---------------------------------------------------------------------------
-- 2) Capture the username chosen at sign-up
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    nullif(new.raw_user_meta_data ->> 'username', ''),
    coalesce(
      nullif(new.raw_user_meta_data ->> 'username', ''),
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

-- ---------------------------------------------------------------------------
-- 3) Profile visibility
-- Profiles are public (that's what a profile page is), but only the owner
-- can change their own row.
-- ---------------------------------------------------------------------------
drop policy if exists "profiles: read own"   on public.profiles;
drop policy if exists "profiles: update own" on public.profiles;
drop policy if exists "profiles: public read" on public.profiles;
drop policy if exists "profiles: insert own"  on public.profiles;

create policy "profiles: public read"  on public.profiles for select using (true);
create policy "profiles: update own"   on public.profiles for update using (auth.uid() = id);
create policy "profiles: insert own"   on public.profiles for insert with check (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- 4) Storage for avatars and banners
-- One public bucket; each user may only write inside their own folder.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "avatars: public read"  on storage.objects;
drop policy if exists "avatars: owner insert" on storage.objects;
drop policy if exists "avatars: owner update" on storage.objects;
drop policy if exists "avatars: owner delete" on storage.objects;

create policy "avatars: public read" on storage.objects
  for select using (bucket_id = 'avatars');

create policy "avatars: owner insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "avatars: owner update" on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "avatars: owner delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
