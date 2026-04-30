-- Eliminar tabla anterior si existe
drop table if exists public.clientes cascade;

-- ── Tabla: clientes ───────────────────────────────────────────────────────────
create table public.clientes (
  id                uuid primary key default uuid_generate_v4(),
  taller_id         uuid not null references public.talleres(id) on delete cascade,
  nombre            text not null,
  telefono          text,
  email             text,
  vehiculo_marca    text,
  vehiculo_modelo   text,
  vehiculo_año      integer,
  placas            text,
  notas             text,
  created_at        timestamptz not null default now()
);

create index idx_clientes_taller_id on public.clientes(taller_id);
create index idx_clientes_placas    on public.clientes(placas);

-- ── RLS ───────────────────────────────────────────────────────────────────────
alter table public.clientes enable row level security;

create policy "clientes: select"
  on public.clientes for select
  using (taller_id = public.get_my_taller_id());

create policy "clientes: insert"
  on public.clientes for insert
  with check (taller_id = public.get_my_taller_id());

create policy "clientes: update"
  on public.clientes for update
  using (taller_id = public.get_my_taller_id());

create policy "clientes: delete"
  on public.clientes for delete
  using (taller_id = public.get_my_taller_id());
