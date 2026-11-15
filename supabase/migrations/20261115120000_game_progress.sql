-- Game stars saved to a grown-up's account, so they follow the explorer to other devices.
-- One row per account. It holds the same progress object the game keeps in the browser
-- (stars per machine, badges, settings): no names, no free text.
-- Run once in Supabase: Dashboard -> SQL Editor -> paste this file -> Run.

create table if not exists public.game_progress (
  user_id uuid primary key references auth.users (id) on delete cascade,
  progress jsonb not null,
  updated_at timestamptz not null default now(),
  -- Progress is a few KB at most; the cap stops the row being used as free storage.
  constraint game_progress_size check (pg_column_size(progress) <= 32768),
  constraint game_progress_is_object check (jsonb_typeof(progress) = 'object')
);

-- Row Level Security: each account can only see and change its own row.
alter table public.game_progress enable row level security;

drop policy if exists "Read own progress" on public.game_progress;
create policy "Read own progress" on public.game_progress
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "Add own progress" on public.game_progress;
create policy "Add own progress" on public.game_progress
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "Change own progress" on public.game_progress;
create policy "Change own progress" on public.game_progress
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "Delete own progress" on public.game_progress;
create policy "Delete own progress" on public.game_progress
  for delete to authenticated using ((select auth.uid()) = user_id);

-- Visitors who are not signed in get nothing.
revoke all on public.game_progress from anon;
