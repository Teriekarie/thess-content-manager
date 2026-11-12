-- Phase 1a part 2: trending idea suggestions and saved versions of rewritten drafts.
alter table public.ideas drop constraint ideas_input_type_check;
alter table public.ideas add constraint ideas_input_type_check
  check (input_type in ('thought', 'learning_note', 'trending'));
alter table public.ideas add column source_url text;
alter table public.ideas add column source_title text;

create table public.post_versions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  post_id uuid not null references public.posts (id) on delete cascade,
  version_number integer not null,
  body text not null,
  structured_content jsonb not null default '{}'::jsonb,
  change_note text not null default '',
  created_at timestamptz not null default now(),
  unique (post_id, version_number)
);
create index post_versions_post_idx on public.post_versions (post_id, version_number desc);

alter table public.post_versions enable row level security;

create policy "Owner manages own post versions" on public.post_versions
  for all to authenticated
  using ((select auth.uid()) = profile_id) with check ((select auth.uid()) = profile_id);
