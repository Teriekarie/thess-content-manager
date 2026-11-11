-- Phase 0: owner profile. One row per signed-in user, readable only by that user.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  owner_email text not null,
  display_name text,
  timezone text not null default 'Africa/Lagos',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Owner can read own profile"
  on public.profiles for select to authenticated
  using ((select auth.uid()) = id);

create policy "Owner can update own profile"
  on public.profiles for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create function public.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Creates the profile row when a user is created in Supabase Auth.
create function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, owner_email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
