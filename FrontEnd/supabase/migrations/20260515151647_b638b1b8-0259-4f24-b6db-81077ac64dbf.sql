create or replace function public.bump_thread_updated_at()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.threads set updated_at = now() where id = new.thread_id;
  return new;
end; $$;