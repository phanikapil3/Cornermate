-- Run this once in Supabase: SQL Editor > New query > paste > Run
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz default now()
);
create table if not exists public.sessions (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  date text not null, title text not null,
  minutes int not null, rounds int not null, xp int not null,
  program text not null, day int not null,
  created_at timestamptz default now()
);
alter table public.profiles enable row level security;
alter table public.sessions enable row level security;
create policy "own profile" on public.profiles for all using (auth.uid() = id) with check (auth.uid() = id);
create policy "own sessions" on public.sessions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
