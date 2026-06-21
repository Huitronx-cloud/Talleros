-- ── Contador atómico de numero_orden por taller ────────────────────────────────
-- La función anterior (select max(numero_orden)+1) tiene condición de carrera:
-- dos órdenes creadas al mismo tiempo para el mismo taller pueden calcular el
-- mismo número antes de insertar, y una de las dos inserciones falla por el
-- índice único (taller_id, numero_orden). Se reemplaza por un contador real
-- que se incrementa de forma atómica con INSERT ... ON CONFLICT ... RETURNING.

create table public.contadores_orden (
  taller_id     uuid primary key references public.talleres(id) on delete cascade,
  ultimo_numero integer not null default 0
);

-- Backfill: arrancar cada contador en el número más alto ya usado por ese taller
insert into public.contadores_orden (taller_id, ultimo_numero)
select taller_id, max(numero_orden)
from public.ordenes
group by taller_id
on conflict (taller_id) do update set ultimo_numero = excluded.ultimo_numero;

create or replace function public.siguiente_numero_orden(p_taller_id uuid)
returns integer
language plpgsql
security definer
as $$
declare
  v_numero integer;
begin
  insert into public.contadores_orden (taller_id, ultimo_numero)
  values (p_taller_id, 1)
  on conflict (taller_id)
  do update set ultimo_numero = public.contadores_orden.ultimo_numero + 1
  returning ultimo_numero into v_numero;

  return v_numero;
end;
$$;

alter table public.contadores_orden enable row level security;

create policy "contadores_orden: select"
  on public.contadores_orden for select
  using (taller_id = public.get_my_taller_id());
