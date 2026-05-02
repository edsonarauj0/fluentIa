create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  preferred_category text not null default 'News',
  preferred_level text not null default 'beginner',
  preferred_theme text not null default 'sunrise',
  max_characters integer not null default 450 check (max_characters between 200 and 1200),
  streak integer not null default 0,
  last_completed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.daily_challenges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  challenge_date date not null,
  category text not null,
  difficulty text not null,
  title text not null,
  text_content text not null,
  reflection_question text,
  source text not null default 'gemini',
  completed boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  unique (user_id, challenge_date)
);

create table if not exists public.challenge_insights (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.daily_challenges(id) on delete cascade,
  selected_text text not null,
  translation text,
  meaning text,
  example text,
  synonyms text[] default '{}',
  pronunciation text,
  context_note text,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.profiles enable row level security;
alter table public.daily_challenges enable row level security;
alter table public.challenge_insights enable row level security;

create policy "profiles_select_own"
on public.profiles
for select
using (auth.uid() = id);

create policy "profiles_update_own"
on public.profiles
for update
using (auth.uid() = id);

create policy "profiles_insert_own"
on public.profiles
for insert
with check (auth.uid() = id);

create policy "challenges_select_own"
on public.daily_challenges
for select
using (auth.uid() = user_id);

create policy "challenges_insert_own"
on public.daily_challenges
for insert
with check (auth.uid() = user_id);

create policy "challenges_update_own"
on public.daily_challenges
for update
using (auth.uid() = user_id);

create policy "insights_select_own"
on public.challenge_insights
for select
using (
  exists (
    select 1
    from public.daily_challenges challenge
    where challenge.id = challenge_insights.challenge_id
      and challenge.user_id = auth.uid()
  )
);

create policy "insights_insert_own"
on public.challenge_insights
for insert
with check (
  exists (
    select 1
    from public.daily_challenges challenge
    where challenge.id = challenge_insights.challenge_id
      and challenge.user_id = auth.uid()
  )
);
