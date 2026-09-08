create table if not exists public.court_match_state (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  match_id text not null,
  starred boolean not null default false,
  watch_state text not null default 'none' check (watch_state in ('none','up_next','later','watched')),
  note text not null default '',
  watched_at timestamptz,
  match_data jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, match_id)
);
alter table public.court_match_state enable row level security;
create policy "Court users manage own match state" on public.court_match_state for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
grant select, insert, update, delete on public.court_match_state to authenticated;

create table if not exists public.court_followed_players (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  player_id text not null,
  player_data jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, player_id)
);
alter table public.court_followed_players enable row level security;
create policy "Court users manage own followed players" on public.court_followed_players for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
grant select, insert, update, delete on public.court_followed_players to authenticated;

create table if not exists public.court_followed_tournaments (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  tournament_id text not null,
  tournament_data jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, tournament_id)
);
alter table public.court_followed_tournaments enable row level security;
create policy "Court users manage own followed tournaments" on public.court_followed_tournaments for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
grant select, insert, update, delete on public.court_followed_tournaments to authenticated;
