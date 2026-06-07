-- Migration: push_subscriptions table + currency column on transactions
-- Run: supabase db push  OR  paste in Supabase SQL editor

-- Push subscriptions table
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  endpoint text not null,
  subscription_json text not null,
  updated_at timestamptz default now()
);

alter table public.push_subscriptions enable row level security;

create policy "Users manage own push subscriptions"
  on public.push_subscriptions
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Currency column on gastos (optional — used for future multi-currency tracking)
alter table public.gastos
  add column if not exists currency text not null default 'ARS';

alter table public.gastos_diarios
  add column if not exists currency text not null default 'ARS';
