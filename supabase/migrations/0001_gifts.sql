-- Hosted Gift Builder — Slice 2 schema
-- Run this in Supabase → SQL Editor → New query → Run.
-- Safe to re-run (idempotent where practical).

-- 1) The gifts table. The full GiftConfig is stored as jsonb in `config`;
--    gift_number and owner_id are mirrored into columns for indexing + RLS.
create table if not exists public.gifts (
  id           uuid primary key default gen_random_uuid(),
  gift_number  text not null unique,
  owner_id     uuid not null references auth.users (id) on delete cascade,
  config       jsonb not null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists gifts_owner_id_idx on public.gifts (owner_id);

-- 2) Row-Level Security: a giver can only see/modify their OWN gifts.
--    Receivers get NO direct table access — they read one gift via the RPC below.
alter table public.gifts enable row level security;

drop policy if exists "owners manage their gifts" on public.gifts;
create policy "owners manage their gifts"
  on public.gifts
  for all
  to authenticated
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

-- 3) Receiver access: a SECURITY DEFINER function that returns exactly one
--    gift's config by its (random, non-enumerable) number. Anonymous callers
--    can run this but cannot list or scan the table.
create or replace function public.get_gift_by_number(p_number text)
returns jsonb
language sql
security definer
set search_path = public
stable
as $$
  select g.config
  from public.gifts g
  where g.gift_number = p_number
  limit 1;
$$;

revoke all on function public.get_gift_by_number(text) from public;
grant execute on function public.get_gift_by_number(text) to anon, authenticated;

-- 4) Keep updated_at fresh on every update.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists gifts_set_updated_at on public.gifts;
create trigger gifts_set_updated_at
  before update on public.gifts
  for each row execute function public.set_updated_at();
