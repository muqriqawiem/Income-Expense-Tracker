-- ============================================================
-- Finance Tracker — Full Migration
-- Run this in Supabase SQL Editor
-- ============================================================

create extension if not exists "uuid-ossp";

-- ---- TABLES ----

create table public.categories (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  name       text not null,
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

create table public.transactions (
  id               uuid primary key default uuid_generate_v4(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  transaction_date date not null,
  type             text not null check (type in ('Income', 'Expense')),
  category_id      uuid references public.categories(id) on delete set null,
  amount           decimal(12, 2) not null,
  description      text,
  year_month       text generated always as (to_char(transaction_date, 'YYYY-MM')) stored,
  created_at       timestamptz not null default now()
);

create table public.budgets (
  id               uuid primary key default uuid_generate_v4(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  category_id      uuid not null references public.categories(id) on delete cascade,
  year_month       text not null,
  allocated_budget decimal(12, 2) not null default 0,
  created_at       timestamptz not null default now(),
  unique (user_id, category_id, year_month)
);

-- ---- INDEXES ----

create index on public.transactions (user_id, year_month);
create index on public.transactions (user_id, category_id);
create index on public.budgets (user_id, year_month);

-- ---- ROW LEVEL SECURITY ----

alter table public.categories  enable row level security;
alter table public.transactions enable row level security;
alter table public.budgets      enable row level security;

create policy "Users manage own categories"
  on public.categories for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users manage own transactions"
  on public.transactions for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users manage own budgets"
  on public.budgets for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================
-- SEED: Master Categories
-- Replace <YOUR_USER_ID> with your actual user UUID from
-- Supabase Dashboard → Authentication → Users
-- Run AFTER creating your account in the app
-- ============================================================

-- insert into public.categories (user_id, name) values
-- ('<YOUR_USER_ID>', 'Sewa Rumah'),
-- ('<YOUR_USER_ID>', 'Hotlink'),
-- ('<YOUR_USER_ID>', 'IbuAyah'),
-- ('<YOUR_USER_ID>', 'TESP'),
-- ('<YOUR_USER_ID>', 'Excel Parking'),
-- ('<YOUR_USER_ID>', 'Versa'),
-- ('<YOUR_USER_ID>', 'ASB'),
-- ('<YOUR_USER_ID>', 'Tabung Haji'),
-- ('<YOUR_USER_ID>', 'EPF'),
-- ('<YOUR_USER_ID>', 'Luno'),
-- ('<YOUR_USER_ID>', 'Public Gold'),
-- ('<YOUR_USER_ID>', 'Food'),
-- ('<YOUR_USER_ID>', 'Food Stock'),
-- ('<YOUR_USER_ID>', 'ETS'),
-- ('<YOUR_USER_ID>', 'Sadaqa'),
-- ('<YOUR_USER_ID>', 'Touch N Go'),
-- ('<YOUR_USER_ID>', 'Fuel'),
-- ('<YOUR_USER_ID>', 'Barber'),
-- ('<YOUR_USER_ID>', 'Wants'),
-- ('<YOUR_USER_ID>', 'Work Parking'),
-- ('<YOUR_USER_ID>', 'Car Emergency'),
-- ('<YOUR_USER_ID>', 'Buffer');
