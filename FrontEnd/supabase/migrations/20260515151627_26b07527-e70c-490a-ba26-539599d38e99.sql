
-- Threads
create table public.threads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'New conversation',
  corpus text not null default 'data-engineering',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.threads enable row level security;

create policy "Users view own threads" on public.threads
  for select using (auth.uid() = user_id);
create policy "Users insert own threads" on public.threads
  for insert with check (auth.uid() = user_id);
create policy "Users update own threads" on public.threads
  for update using (auth.uid() = user_id);
create policy "Users delete own threads" on public.threads
  for delete using (auth.uid() = user_id);

create index threads_user_idx on public.threads(user_id, updated_at desc);

-- Messages
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.threads(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user','assistant')),
  content text not null,
  citations jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.messages enable row level security;

create policy "Users view own messages" on public.messages
  for select using (auth.uid() = user_id);
create policy "Users insert own messages" on public.messages
  for insert with check (auth.uid() = user_id);
create policy "Users delete own messages" on public.messages
  for delete using (auth.uid() = user_id);

create index messages_thread_idx on public.messages(thread_id, created_at asc);

-- Auto-update threads.updated_at when a new message is added
create or replace function public.bump_thread_updated_at()
returns trigger language plpgsql as $$
begin
  update public.threads set updated_at = now() where id = new.thread_id;
  return new;
end; $$;

create trigger messages_bump_thread
after insert on public.messages
for each row execute function public.bump_thread_updated_at();
