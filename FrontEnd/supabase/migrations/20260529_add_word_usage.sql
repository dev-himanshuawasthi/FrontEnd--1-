-- User word usage tracking table
create table public.user_word_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  total_words_consumed integer not null default 0,
  last_updated timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.user_word_usage enable row level security;

create policy "Users view own word usage" on public.user_word_usage
  for select using (auth.uid() = user_id);
create policy "Users update own word usage" on public.user_word_usage
  for update using (auth.uid() = user_id);

create index word_usage_user_idx on public.user_word_usage(user_id);

-- Automatically sync word usage from messages
-- This trigger calculates total words across all user's messages
create or replace function public.calculate_user_word_usage(p_user_id uuid)
returns integer language plpgsql security definer set search_path = public as $$
declare
  v_total_words integer;
begin
  select coalesce(sum(array_length(string_to_array(m.content, ' '), 1)), 0) into v_total_words
  from public.messages m
  where m.user_id = p_user_id;
  
  return v_total_words;
end; $$;

-- Update user_word_usage after a message is inserted
create or replace function public.sync_word_usage_on_message()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_total_words integer;
begin
  v_total_words := calculate_user_word_usage(new.user_id);
  
  insert into public.user_word_usage (user_id, total_words_consumed, last_updated)
  values (new.user_id, v_total_words, now())
  on conflict (user_id) do update
  set total_words_consumed = v_total_words, last_updated = now();
  
  return new;
end; $$;

-- Trigger to call sync_word_usage after message insert
drop trigger if exists sync_word_usage_on_message_insert on public.messages;
create trigger sync_word_usage_on_message_insert
after insert on public.messages
for each row
execute function sync_word_usage_on_message();

-- Also update on message delete
create or replace function public.sync_word_usage_on_message_delete()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_total_words integer;
begin
  v_total_words := calculate_user_word_usage(old.user_id);
  
  insert into public.user_word_usage (user_id, total_words_consumed, last_updated)
  values (old.user_id, v_total_words, now())
  on conflict (user_id) do update
  set total_words_consumed = v_total_words, last_updated = now();
  
  return old;
end; $$;

-- Trigger to call sync_word_usage after message delete
drop trigger if exists sync_word_usage_on_message_delete on public.messages;
create trigger sync_word_usage_on_message_delete
after delete on public.messages
for each row
execute function sync_word_usage_on_message_delete();
