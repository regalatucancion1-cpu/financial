-- Control Financiero schema
-- Apply this in Supabase SQL Editor after creating the project.

-- transactions
create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  amount numeric(12,2) not null check (amount > 0),
  currency text not null default 'EUR',
  fx_eur numeric(12,2) not null,
  merchant text,
  raw_input text,
  category text not null,
  scope text not null check (scope in ('personal','negocio')),
  business text check (business in ('savage_party','fierce_party','elevn_djs','mochito_media','shared')),
  deductible boolean not null default false,
  vat_rate numeric(5,2),
  vat_amount numeric(12,2),
  payment_method text,
  notes text,
  recurring_id uuid,
  confidence text not null default 'auto' check (confidence in ('auto','soft','confirmed')),
  created_at timestamptz not null default now()
);
create index if not exists transactions_user_date_idx on transactions (user_id, date desc);

-- income
create table if not exists income (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  gross numeric(12,2) not null,
  currency text not null default 'EUR',
  payer text,
  business text not null,
  invoice_id text,
  vat numeric(12,2) not null default 0,
  irpf numeric(12,2) not null default 0,
  net numeric(12,2) not null,
  payment_method text,
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists income_user_date_idx on income (user_id, date desc);

-- recurring (fixed monthly charges for end-of-month reconciliation)
create table if not exists recurring (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  merchant text not null,
  amount numeric(12,2),
  category text not null,
  scope text not null check (scope in ('personal','negocio')),
  business text,
  day_of_month int check (day_of_month between 1 and 31),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- push subscriptions for daily reminder
create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now()
);

-- Row Level Security: each user only sees their own rows
alter table transactions enable row level security;
alter table income enable row level security;
alter table recurring enable row level security;
alter table push_subscriptions enable row level security;

drop policy if exists "own transactions" on transactions;
create policy "own transactions" on transactions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own income" on income;
create policy "own income" on income
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own recurring" on recurring;
create policy "own recurring" on recurring
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own push subs" on push_subscriptions;
create policy "own push subs" on push_subscriptions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
