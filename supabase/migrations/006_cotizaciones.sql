-- ── Columnas extra en talleres (para configuración) ──────────────────────────
alter table public.talleres
  add column if not exists direccion    text,
  add column if not exists email        text,
  add column if not exists logo_url     text,
  add column if not exists moneda       text not null default 'MXN'
    check (moneda in ('MXN','COP')),
  add column if not exists vigencia_dias integer not null default 15;

-- ── Tabla: cotizaciones ───────────────────────────────────────────────────────
create table public.cotizaciones (
  id                  uuid primary key default uuid_generate_v4(),
  taller_id           uuid not null references public.talleres(id) on delete cascade,
  cliente_id          uuid references public.clientes(id) on delete set null,
  orden_id            uuid references public.ordenes(id) on delete set null,
  numero_cotizacion   integer not null,
  servicios           jsonb not null default '[]',
  subtotal            numeric(10,2) not null default 0,
  descuento           numeric(10,2) not null default 0,
  impuestos           numeric(10,2) not null default 0,
  total               numeric(10,2) not null default 0,
  moneda              text not null default 'MXN' check (moneda in ('MXN','COP')),
  estado              text not null default 'borrador'
                        check (estado in ('borrador','enviada','aprobada','rechazada')),
  notas               text,
  vigencia_dias       integer not null default 15,
  created_at          timestamptz not null default now()
);

create unique index idx_cotizaciones_numero_taller
  on public.cotizaciones(taller_id, numero_cotizacion);
create index idx_cotizaciones_taller_id  on public.cotizaciones(taller_id);
create index idx_cotizaciones_cliente_id on public.cotizaciones(cliente_id);

-- ── Función: siguiente número de cotización ───────────────────────────────────
create or replace function public.siguiente_numero_cotizacion(p_taller_id uuid)
returns integer language sql security definer as $$
  select coalesce(max(numero_cotizacion), 0) + 1
  from public.cotizaciones where taller_id = p_taller_id;
$$;

-- ── RLS ───────────────────────────────────────────────────────────────────────
alter table public.cotizaciones enable row level security;

create policy "cotizaciones: select" on public.cotizaciones for select
  using (taller_id = public.get_my_taller_id());
create policy "cotizaciones: insert" on public.cotizaciones for insert
  with check (taller_id = public.get_my_taller_id());
create policy "cotizaciones: update" on public.cotizaciones for update
  using (taller_id = public.get_my_taller_id());
create policy "cotizaciones: delete" on public.cotizaciones for delete
  using (taller_id = public.get_my_taller_id());

-- ── RLS en talleres: propietario puede editar su taller ───────────────────────
drop policy if exists "propietario y admin editan taller" on public.talleres;
create policy "propietario edita su taller"
  on public.talleres for update
  using (id = public.get_my_taller_id());
