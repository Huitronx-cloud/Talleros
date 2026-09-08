-- Los coches que solo existieron dentro de una orden.
--
-- La 051 creó la tabla `vehiculos` y la rellenó desde la ficha del cliente.
-- La 058 hizo lo mismo para los clientes que se habían quedado fuera. Las dos
-- miran al mismo sitio, y ninguna miró a las ÓRDENES.
--
-- Por eso seguía habiendo clientes que abren su ficha y leen "todavía no tiene
-- vehículos" teniendo el coche en el taller: son los que se dieron de alta sin
-- rellenar los datos del coche —muchos talleres los escriben al abrir la orden,
-- que es cuando el coche está delante— y su Kia Forte vivía únicamente en las
-- columnas de la orden.
--
-- El código ya no vuelve a crear el agujero: abrir una orden escribiendo el
-- coche a mano lo da de alta y enlaza la orden. Esto es la puesta al día de lo
-- que quedó atrás.
--
-- ── Dos pasadas, y en este orden ────────────────────────────────────────────
--
-- Primero las órdenes CON placas, luego las que no las tienen. Al revés se
-- duplicaría: un cliente con cuatro visitas del mismo coche, tres con placas
-- y una sin ellas, acabaría con dos Kia Forte. Como son dos sentencias
-- distintas, la segunda ya ve lo que insertó la primera y se lo salta.

-- ── Pasada 1: las que traen placas ──────────────────────────────────────────
insert into public.vehiculos (taller_id, cliente_id, marca, modelo, anio, placas, vin)
select distinct on (o.cliente_id, upper(regexp_replace(o.placas, '[^A-Za-z0-9]', '', 'g')))
  o.taller_id,
  o.cliente_id,
  nullif(trim(o.vehiculo_marca),  ''),
  nullif(trim(o.vehiculo_modelo), ''),
  case when o.vehiculo_año > 0 then o.vehiculo_año end,
  upper(trim(o.placas)),
  upper(nullif(trim(o.vin), ''))
from public.ordenes o
where o.cliente_id is not null
  and coalesce(nullif(trim(o.placas), ''), '') <> ''
  and not exists (
    select 1
    from public.vehiculos v
    where v.cliente_id = o.cliente_id
      and v.placas is not null
      and upper(regexp_replace(v.placas, '[^A-Za-z0-9]', '', 'g'))
        = upper(regexp_replace(o.placas, '[^A-Za-z0-9]', '', 'g'))
  )
-- La más reciente gana: es la que tiene los datos como están hoy.
order by o.cliente_id, upper(regexp_replace(o.placas, '[^A-Za-z0-9]', '', 'g')), o.created_at desc;

-- ── Pasada 2: las que no traen placas ───────────────────────────────────────
insert into public.vehiculos (taller_id, cliente_id, marca, modelo, anio, vin)
select distinct on (o.cliente_id, lower(coalesce(trim(o.vehiculo_marca), '')), lower(coalesce(trim(o.vehiculo_modelo), '')))
  o.taller_id,
  o.cliente_id,
  nullif(trim(o.vehiculo_marca),  ''),
  nullif(trim(o.vehiculo_modelo), ''),
  case when o.vehiculo_año > 0 then o.vehiculo_año end,
  upper(nullif(trim(o.vin), ''))
from public.ordenes o
where o.cliente_id is not null
  and coalesce(nullif(trim(o.placas), ''), '') = ''
  and coalesce(nullif(trim(o.vehiculo_marca), ''), nullif(trim(o.vehiculo_modelo), '')) is not null
  and not exists (
    select 1
    from public.vehiculos v
    where v.cliente_id = o.cliente_id
      and lower(coalesce(trim(v.marca),  '')) = lower(coalesce(trim(o.vehiculo_marca),  ''))
      and lower(coalesce(trim(v.modelo), '')) = lower(coalesce(trim(o.vehiculo_modelo), ''))
  )
order by o.cliente_id, lower(coalesce(trim(o.vehiculo_marca), '')), lower(coalesce(trim(o.vehiculo_modelo), '')), o.created_at desc;

-- ── Enlazar las órdenes ─────────────────────────────────────────────────────
-- Por placas, que es lo único que identifica un coche sin lugar a dudas.
update public.ordenes o
set vehiculo_id = v.id
from public.vehiculos v
where o.vehiculo_id is null
  and v.cliente_id = o.cliente_id
  and o.placas is not null
  and v.placas is not null
  and upper(regexp_replace(o.placas, '[^A-Za-z0-9]', '', 'g'))
    = upper(regexp_replace(v.placas, '[^A-Za-z0-9]', '', 'g'));

-- Y las que no tienen placas, solo cuando el cliente tiene UN vehículo con esa
-- marca y ese modelo. Si tiene dos Corolla no se adivina: enlazar la orden al
-- coche equivocado es peor que dejarla suelta, porque el historial del coche
-- también busca por placas y una orden sin enlazar no se pierde.
update public.ordenes o
set vehiculo_id = v.id
from public.vehiculos v
where o.vehiculo_id is null
  and v.cliente_id = o.cliente_id
  and coalesce(nullif(trim(o.placas), ''), '') = ''
  and lower(coalesce(trim(v.marca),  '')) = lower(coalesce(trim(o.vehiculo_marca),  ''))
  and lower(coalesce(trim(v.modelo), '')) = lower(coalesce(trim(o.vehiculo_modelo), ''))
  and (
    select count(*)
    from public.vehiculos v2
    where v2.cliente_id = o.cliente_id
      and lower(coalesce(trim(v2.marca),  '')) = lower(coalesce(trim(o.vehiculo_marca),  ''))
      and lower(coalesce(trim(v2.modelo), '')) = lower(coalesce(trim(o.vehiculo_modelo), ''))
  ) = 1;
