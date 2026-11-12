-- Phase 1a part 1: brand settings, voice, ideas, posts, feedback, AI usage.
-- Every table is owned by one profile and protected by Row Level Security.

create table public.brand_settings (
  profile_id uuid primary key references public.profiles (id) on delete cascade,
  positioning text not null default '',
  professional_bio text not null default '',
  audience_priorities jsonb not null default '[]'::jsonb,
  pillars jsonb not null default '[]'::jsonb,
  keyword_library jsonb not null default '[]'::jsonb,
  banned_phrases jsonb not null default '[]'::jsonb,
  monthly_ai_budget numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.brand_knowledge (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  category text not null check (category in ('writing_sample', 'style_reference')),
  title text not null default '',
  content text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index brand_knowledge_profile_idx on public.brand_knowledge (profile_id, category);

create table public.voice_guides (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  version integer not null,
  guide_content text not null,
  change_summary text not null default '',
  active boolean not null default false,
  created_at timestamptz not null default now(),
  unique (profile_id, version)
);
create unique index voice_guides_one_active_idx on public.voice_guides (profile_id) where active;

create table public.ideas (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  raw_content text not null,
  input_type text not null default 'thought' check (input_type in ('thought', 'learning_note')),
  tone text not null default 'auto'
    check (tone in ('auto', 'funny', 'opinion', 'school_of_thought', 'serious')),
  confidentiality_classification text not null default 'unknown',
  status text not null default 'new'
    check (status in ('new', 'needs_clarification', 'drafted', 'planned', 'used', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index ideas_profile_idx on public.ideas (profile_id, status, created_at desc);

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  source_idea_id uuid references public.ideas (id) on delete set null,
  parent_post_id uuid references public.posts (id) on delete cascade,
  platform text not null check (platform in ('linkedin', 'instagram_facebook', 'tiktok')),
  title text not null,
  pillar text not null default '',
  objective text not null default '',
  format text not null default '',
  format_reason text not null default '',
  length text not null default 'short' check (length in ('short', 'long')),
  tone text not null default '',
  hook text not null default '',
  body text not null,
  alt_hooks jsonb not null default '[]'::jsonb,
  cta text,
  keywords jsonb not null default '[]'::jsonb,
  hashtags jsonb not null default '[]'::jsonb,
  structured_content jsonb not null default '{}'::jsonb,
  visual_choice text check (visual_choice in ('generate_image', 'carousel', 'own_photo', 'none')),
  safety_status text not null default 'clear'
    check (safety_status in ('clear', 'needs_review', 'blocked')),
  safety_reasons jsonb not null default '[]'::jsonb,
  review_notes text not null default '',
  needs_user_confirmation boolean not null default false,
  status text not null default 'planned' check (status in ('planned', 'posted', 'discarded')),
  scheduled_for date,
  carried_over_count integer not null default 0,
  posted_at timestamptz,
  published_url text,
  generation_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index posts_profile_schedule_idx on public.posts (profile_id, scheduled_for);
create index posts_profile_status_idx on public.posts (profile_id, status, platform);
create index posts_parent_idx on public.posts (parent_post_id);

create table public.feedback (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  post_id uuid not null references public.posts (id) on delete cascade,
  rating text not null check (rating in ('up', 'down')),
  comment text not null default '',
  created_at timestamptz not null default now()
);
create index feedback_post_idx on public.feedback (post_id, created_at desc);

create table public.usage_logs (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  task_type text not null,
  provider text not null,
  model text not null,
  input_tokens integer not null default 0,
  output_tokens integer not null default 0,
  estimated_cost numeric,
  latency_ms integer,
  status text not null,
  created_at timestamptz not null default now()
);
create index usage_logs_profile_idx on public.usage_logs (profile_id, created_at desc);

alter table public.brand_settings enable row level security;
alter table public.brand_knowledge enable row level security;
alter table public.voice_guides enable row level security;
alter table public.ideas enable row level security;
alter table public.posts enable row level security;
alter table public.feedback enable row level security;
alter table public.usage_logs enable row level security;

create policy "Owner manages own brand settings" on public.brand_settings
  for all to authenticated
  using ((select auth.uid()) = profile_id) with check ((select auth.uid()) = profile_id);
create policy "Owner manages own brand knowledge" on public.brand_knowledge
  for all to authenticated
  using ((select auth.uid()) = profile_id) with check ((select auth.uid()) = profile_id);
create policy "Owner manages own voice guides" on public.voice_guides
  for all to authenticated
  using ((select auth.uid()) = profile_id) with check ((select auth.uid()) = profile_id);
create policy "Owner manages own ideas" on public.ideas
  for all to authenticated
  using ((select auth.uid()) = profile_id) with check ((select auth.uid()) = profile_id);
create policy "Owner manages own posts" on public.posts
  for all to authenticated
  using ((select auth.uid()) = profile_id) with check ((select auth.uid()) = profile_id);
create policy "Owner manages own feedback" on public.feedback
  for all to authenticated
  using ((select auth.uid()) = profile_id) with check ((select auth.uid()) = profile_id);
create policy "Owner reads own usage logs" on public.usage_logs
  for select to authenticated using ((select auth.uid()) = profile_id);
create policy "Owner records own usage logs" on public.usage_logs
  for insert to authenticated with check ((select auth.uid()) = profile_id);

create trigger brand_settings_set_updated_at before update on public.brand_settings
  for each row execute function public.set_updated_at();
create trigger brand_knowledge_set_updated_at before update on public.brand_knowledge
  for each row execute function public.set_updated_at();
create trigger ideas_set_updated_at before update on public.ideas
  for each row execute function public.set_updated_at();
create trigger posts_set_updated_at before update on public.posts
  for each row execute function public.set_updated_at();
