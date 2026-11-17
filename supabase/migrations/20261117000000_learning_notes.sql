-- Rules the app learns from Thess's ratings, notes and edits. A rule only guides drafts
-- once she approves it (status 'active'); suggested and dismissed rules are ignored.
create table if not exists public.learning_notes (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  learning_type text not null check (learning_type in ('preference', 'edit_pattern', 'direct_instruction')),
  note text not null,
  reason text not null default '',
  evidence_count integer not null default 1,
  status text not null default 'suggested' check (status in ('suggested', 'active', 'dismissed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists learning_notes_profile_idx on public.learning_notes (profile_id, status, created_at desc);

alter table public.learning_notes enable row level security;

drop policy if exists "Owner manages own learning notes" on public.learning_notes;
create policy "Owner manages own learning notes" on public.learning_notes
  for all to authenticated
  using ((select auth.uid()) = profile_id) with check ((select auth.uid()) = profile_id);

drop trigger if exists learning_notes_set_updated_at on public.learning_notes;
create trigger learning_notes_set_updated_at before update on public.learning_notes
  for each row execute function public.set_updated_at();
