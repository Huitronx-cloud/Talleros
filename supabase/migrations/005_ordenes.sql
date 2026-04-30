-- ── Tabla: ordenes ───────────────────────────────────────────────────────────
create table public.ordenes (
  id                  uuid primary key default uuid_generate_v4(),
  taller_id           uuid not null references public.talleres(id) on delete cascade,
  cliente_id          uuid references public.clientes(id) on delete set null,
  numero_orden        integer not null,
  -- Vehículo (copiado del cliente o ingresado manual)
  vehiculo_marca      text,
  vehiculo_modelo     text,
  vehiculo_año        integer,
  placas              text,
  kilometraje         integer,
  -- Descripción
  descripcion_problema  text,
  diagnostico           text,
  servicios_realizados  jsonb default '[]',
  -- Asignación
  mecanico_asignado   text,
  -- Estado
  estado              text not null default 'recibido'
                        check (estado in ('recibido','en_proceso','listo','entregado')),
  -- Fechas
  fecha_entrada       date not null default current_date,
  fecha_prometida     date,
  fecha_entrega       date,
  -- Financiero
  subtotal            numeric(10,2) default 0,
  descuento           numeric(10,2) default 0,
  total               numeric(10,2) default 0,
  forma_pago          text default 'efectivo'
                        check (forma_pago in ('efectivo','transferencia','tarjeta')),
  -- Extra
  notas_internas      text,
  historial           jsonb default '[]',
  created_at          timestamptz not null default now()
);

-- Número de orden único por taller
create unique index idx_ordenes_numero_taller
  on public.ordenes(taller_id, numero_orden);

create index idx_ordenes_taller_id  on public.ordenes(taller_id);
create index idx_ordenes_cliente_id on public.ordenes(cliente_id);
create index idx_ordenes_estado     on public.ordenes(estado);

-- ── Función: siguiente número de orden por taller ─────────────────────────────
create or replace function public.siguiente_numero_orden(p_taller_id uuid)
returns integer
language sql
security definer
as $$
  select coalesce(max(numero_orden), 0) + 1
  from public.ordenes
  where taller_id = p_taller_id;
$$;

-- ── RLS ───────────────────────────────────────────────────────────────────────
alter table public.ordenes enable row level security;

create policy "ordenes: select"
  on public.ordenes for select
  using (taller_id = public.get_my_taller_id());

create policy "ordenes: insert"
  on public.ordenes for insert
  with check (taller_id = public.get_my_taller_id());

create policy "ordenes: update"
  on public.ordenes for update
  using (taller_id = public.get_my_taller_id());

create policy "ordenes: delete"
  on public.ordenes for delete
  using (taller_id = public.get_my_taller_id());
