-- Holidays and key dates, plus manual analytics (page numbers per week, numbers per post).
alter table public.ideas drop constraint ideas_input_type_check;
alter table public.ideas add constraint ideas_input_type_check
  check (input_type in ('thought', 'learning_note', 'trending', 'event'));

create table public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  event_date date not null,
  name text not null,
  category text not null default '',
  geography text not null default '',
  source_url text not null,
  source_title text not null default '',
  relevance_reason text not null default '',
  suggested_angle text not null default '',
  status text not null default 'open' check (status in ('open', 'drafted', 'skipped')),
  idea_id uuid references public.ideas (id) on delete set null,
  post_id uuid references public.posts (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (profile_id, event_date, name)
);
create index calendar_events_profile_idx on public.calendar_events (profile_id, event_date);

create table public.platform_metrics (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  platform text not null check (platform in ('linkedin', 'instagram', 'facebook', 'tiktok')),
  week_start date not null,
  followers integer,
  impressions integer,
  reactions integer,
  comments integer,
  shares integer,
  profile_visits integer,
  measurement_source text not null default 'manual',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (profile_id, platform, week_start)
);

create table public.post_metrics (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  post_id uuid not null unique references public.posts (id) on delete cascade,
  impressions integer,
  reactions integer,
  comments integer,
  shares integer,
  saves integer,
  measurement_source text not null default 'manual',
  measured_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.calendar_events enable row level security;
alter table public.platform_metrics enable row level security;
alter table public.post_metrics enable row level security;

create policy "Owner manages own calendar events" on public.calendar_events
  for all to authenticated
  using ((select auth.uid()) = profile_id) with check ((select auth.uid()) = profile_id);
create policy "Owner manages own platform metrics" on public.platform_metrics
  for all to authenticated
  using ((select auth.uid()) = profile_id) with check ((select auth.uid()) = profile_id);
create policy "Owner manages own post metrics" on public.post_metrics
  for all to authenticated
  using ((select auth.uid()) = profile_id) with check ((select auth.uid()) = profile_id);

create trigger platform_metrics_set_updated_at before update on public.platform_metrics
  for each row execute function public.set_updated_at();
create trigger post_metrics_set_updated_at before update on public.post_metrics
  for each row execute function public.set_updated_at();
