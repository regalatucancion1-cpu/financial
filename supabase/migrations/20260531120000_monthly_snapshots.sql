-- monthly_snapshots: foto financiera mensual del usuario
create table if not exists monthly_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  snapshot_month date not null,
  bbva_trabajo numeric(12,2) default 0,
  bbva_personal numeric(12,2) default 0,
  bbva_impuestos numeric(12,2) default 0,
  trade_republic numeric(12,2) default 0,
  myinvestor numeric(12,2) default 0,
  acciones numeric(12,2) default 0,
  revolut numeric(12,2) default 0,
  conjunta numeric(12,2) default 0,
  cash_b numeric(12,2) default 0,
  pendiente_cobrar_neto numeric(12,2) default 0,
  iva_pendiente numeric(12,2) default 0,
  irpf_pendiente numeric(12,2) default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, snapshot_month)
);
create index if not exists monthly_snapshots_user_month_idx on monthly_snapshots (user_id, snapshot_month desc);

alter table monthly_snapshots enable row level security;

drop policy if exists "own snapshots" on monthly_snapshots;
create policy "own snapshots" on monthly_snapshots
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
