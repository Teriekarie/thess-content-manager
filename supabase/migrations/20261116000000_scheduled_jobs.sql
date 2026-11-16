-- A record of each weekly plan run (manual or automatic), so the app can show what happened.
create table if not exists public.scheduled_jobs (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  job_type text not null,
  scheduled_for date not null,
  status text not null default 'running' check (status in ('running', 'done', 'partial', 'failed', 'skipped')),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  error_summary text not null default '',
  metadata jsonb not null default '{}'::jsonb
);
create index if not exists scheduled_jobs_profile_idx on public.scheduled_jobs (profile_id, job_type, started_at desc);

alter table public.scheduled_jobs enable row level security;

drop policy if exists "Owner reads own scheduled jobs" on public.scheduled_jobs;
drop policy if exists "Owner records own scheduled jobs" on public.scheduled_jobs;
drop policy if exists "Owner updates own scheduled jobs" on public.scheduled_jobs;
create policy "Owner reads own scheduled jobs" on public.scheduled_jobs
  for select to authenticated using ((select auth.uid()) = profile_id);
create policy "Owner records own scheduled jobs" on public.scheduled_jobs
  for insert to authenticated with check ((select auth.uid()) = profile_id);
create policy "Owner updates own scheduled jobs" on public.scheduled_jobs
  for update to authenticated
  using ((select auth.uid()) = profile_id) with check ((select auth.uid()) = profile_id);
