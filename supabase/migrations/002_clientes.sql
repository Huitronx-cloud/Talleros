-- ── Tabla: clientes ──────────────────────────────────────────────────────────
create table if not exists public.clientes (
  id          uuid primary key default uuid_generate_v4(),
  taller_id   uuid not null references public.talleres(id) on delete cascade,
  nombre      text not null,
  telefono    text,
  email       text,
  notas       text,
  created_at  timestamptz not null default now()
);

create index if not exists idx_clientes_taller_id on public.clientes(taller_id);

-- RLS
alter table public.clientes enable row level security;

-- Solo ve clientes de su taller
create policy "usuarios ven clientes de su taller"
  on public.clientes for select
  using (taller_id = public.get_taller_id());

-- Solo inserta en su taller
create policy "usuarios crean clientes en su taller"
  on public.clientes for insert
  with check (taller_id = public.get_taller_id());

-- Solo edita clientes de su taller
create policy "usuarios editan clientes de su taller"
  on public.clientes for update
  using (taller_id = public.get_taller_id());

-- Solo elimina clientes de su taller
create policy "usuarios eliminan clientes de su taller"
  on public.clientes for delete
  using (taller_id = public.get_taller_id());
