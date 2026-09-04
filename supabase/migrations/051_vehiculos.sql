-- Varios vehículos por cliente.
--
-- Lo pidió un taller por correo: "quiero agregar una unidad a un cliente ya
-- registrado pero no me aparece la opción". No aparecía porque no existía:
-- cada cliente guardaba UN vehículo en columnas dentro de su propia ficha
-- (vehiculo_marca, vehiculo_modelo, vehiculo_año, placas, vin).
--
-- La tabla `vehiculos` se daba por existente en varios sitios del código
-- —la migración 020 le pone RLS, calendario-citas.tsx inserta en ella, y
-- lib/recordatorios.ts la unía con ordenes— pero NUNCA se creó. Se confirmó
-- consultando pg_tables el 04/09/2026: no aparece. Por eso el bloque de RLS
-- de la 020 falló al aplicarse (era el último del archivo, así que no arrastró
-- nada: las 34 tablas restantes sí tienen RLS).
--
-- Las columnas se llaman como las usa calendario-citas.tsx (marca, modelo,
-- placas) para que ese insert deje de fallar en silencio. El año va como
-- `anio` y no `año`: la ñ en un nombre de columna obliga a comillas en cada
-- consulta y ya nos costó un rato con `vehiculo_año`.

create table if not exists public.vehiculos (
  id          uuid primary key default gen_random_uuid(),
  taller_id   uuid not null references public.talleres(id) on delete cascade,
  cliente_id  uuid not null references public.clientes(id) on delete cascade,
  marca       text,
  modelo      text,
  anio        integer,
  placas      text,
  vin         text,
  foto_url    text,
  notas       text,
  -- Quitar un vehículo no puede borrar su historial: las órdenes de ese coche
  -- se quedan. Se archiva y deja de ofrecerse al abrir una orden nueva.
  archivado   boolean not null default false,
  created_at  timestamptz not null default now()
);

create index if not exists vehiculos_taller_idx  on public.vehiculos (taller_id);
create index if not exists vehiculos_cliente_idx on public.vehiculos (cliente_id);

-- ── Enlace de la orden con el vehículo ──────────────────────────────────────
-- Las órdenes CONSERVAN su copia de marca/modelo/placas: son el registro de lo
-- que entró al taller ese día. Si el cliente vende el coche o le cambian las
-- placas, la orden de hace ocho meses tiene que seguir diciendo lo que decía.
-- Esta columna solo sirve para saber de qué coche de la lista se trata.
alter table public.ordenes add column if not exists vehiculo_id uuid references public.vehiculos(id) on delete set null;
create index if not exists ordenes_vehiculo_idx on public.ordenes (vehiculo_id);

-- ── Seguridad ───────────────────────────────────────────────────────────────
-- Las mismas cuatro políticas que la 020 no llegó a aplicar.
alter table public.vehiculos enable row level security;

drop policy if exists "vehiculos: select" on public.vehiculos;
create policy "vehiculos: select"
  on public.vehiculos for select
  using (taller_id = public.get_my_taller_id());

drop policy if exists "vehiculos: insert" on public.vehiculos;
create policy "vehiculos: insert"
  on public.vehiculos for insert
  with check (taller_id = public.get_my_taller_id());

drop policy if exists "vehiculos: update" on public.vehiculos;
create policy "vehiculos: update"
  on public.vehiculos for update
  using (taller_id = public.get_my_taller_id());

drop policy if exists "vehiculos: delete" on public.vehiculos;
create policy "vehiculos: delete"
  on public.vehiculos for delete
  using (taller_id = public.get_my_taller_id());

-- ── Traer los vehículos que ya existen ──────────────────────────────────────
-- Un vehículo por cada cliente que hoy tenga algún dato de coche en su ficha.
-- Idempotente: si se corre dos veces no duplica, porque solo inserta cuando el
-- cliente todavía no tiene ninguno.
insert into public.vehiculos (taller_id, cliente_id, marca, modelo, anio, placas, vin, foto_url)
select
  c.taller_id,
  c.id,
  nullif(trim(coalesce(c.vehiculo_marca, '')),  ''),
  nullif(trim(coalesce(c.vehiculo_modelo, '')), ''),
  c.vehiculo_año,
  nullif(trim(coalesce(c.placas, '')), ''),
  nullif(trim(coalesce(c.vin, '')),    ''),
  c.foto_vehiculo_url
from public.clientes c
where coalesce(c.vehiculo_marca, c.vehiculo_modelo, c.placas, c.vin) is not null
  and not exists (select 1 from public.vehiculos v where v.cliente_id = c.id);

-- ── Enlazar las órdenes que se pueda ────────────────────────────────────────
-- Por placas dentro del mismo taller, que es lo único fiable que comparten.
-- Las que no cuadren se quedan sin enlazar y no pasa nada: siguen teniendo sus
-- propias columnas con los datos del coche.
update public.ordenes o
set vehiculo_id = v.id
from public.vehiculos v
where o.vehiculo_id is null
  and o.taller_id = v.taller_id
  and o.placas is not null
  and v.placas   is not null
  and upper(regexp_replace(o.placas, '[^A-Za-z0-9]', '', 'g'))
    = upper(regexp_replace(v.placas, '[^A-Za-z0-9]', '', 'g'));
