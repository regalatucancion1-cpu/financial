-- investments: manually tracked holdings (stocks/ETFs, funds/pension plans)
create table if not exists investments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  kind text not null check (kind in ('accion_etf','fondo_pension')),
  invested numeric(12,2) not null default 0 check (invested >= 0),
  current_value numeric(12,2) not null default 0 check (current_value >= 0),
  value_updated_at date,
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists investments_user_idx on investments (user_id, created_at desc);

alter table investments enable row level security;

drop policy if exists "own investments" on investments;
create policy "own investments" on investments
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
