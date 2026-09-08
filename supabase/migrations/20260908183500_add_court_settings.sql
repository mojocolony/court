create table if not exists public.court_settings (
  user_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  global_spoiler_mode boolean not null default false,
  updated_at timestamptz not null default now()
);
alter table public.court_settings enable row level security;
create policy "Court users manage own settings" on public.court_settings for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
grant select, insert, update, delete on public.court_settings to authenticated;
