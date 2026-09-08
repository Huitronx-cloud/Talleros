-- Los coches que se quedaron fuera de `vehiculos`.
--
-- Un taller lo dijo así: "selecciono a un cliente cuyo auto está en servicio y
-- me aparece que no tiene ningún vehículo agregado, siendo que cuando lo di de
-- alta di de alta también su auto".
--
-- Y tenía toda la razón. La migración 051 creó la tabla `vehiculos` y rellenó
-- lo que pudo desde las ÓRDENES —cuadraron 70— pero no se actualizó ninguno de
-- los caminos que escriben:
--
--   · dar de alta un cliente con su coche guardaba marca, modelo y placas en
--     las columnas viejas de `clientes` y en ningún sitio más
--   · abrir una orden escribiendo el coche a mano lo guardaba en las columnas
--     de la orden y en ningún sitio más
--
-- Los dos caminos quedan arreglados en el código. Esto es la puesta al día de
-- lo que ya estaba dentro: los clientes registrados con coche desde que existe
-- la tabla, que hoy abren su ficha y leen "todavía no tiene vehículos".
--
-- ── Cómo se evita duplicar ──────────────────────────────────────────────────
--
-- Se compara por placas normalizadas (sin guiones ni espacios, en mayúsculas)
-- dentro del mismo cliente. Sin placas se compara marca y modelo, que es flojo
-- pero es lo único que hay, y crear un duplicado es peor que no crear nada.

insert into public.vehiculos (taller_id, cliente_id, marca, modelo, anio, placas, vin, foto_url)
select
  c.taller_id,
  c.id,
  nullif(trim(c.vehiculo_marca), ''),
  nullif(trim(c.vehiculo_modelo), ''),
  case when c.vehiculo_año > 0 then c.vehiculo_año end,
  upper(nullif(trim(c.placas), '')),
  upper(nullif(trim(c.vin), '')),
  c.foto_vehiculo_url
from public.clientes c
where coalesce(nullif(trim(c.vehiculo_marca), ''), nullif(trim(c.vehiculo_modelo), ''), nullif(trim(c.placas), '')) is not null
  and not exists (
    select 1
    from public.vehiculos v
    where v.cliente_id = c.id
      and (
        (
          c.placas is not null and v.placas is not null
          and upper(regexp_replace(v.placas,   '[^A-Za-z0-9]', '', 'g'))
            = upper(regexp_replace(c.placas,   '[^A-Za-z0-9]', '', 'g'))
        )
        or (
          coalesce(nullif(trim(c.placas), ''), '') = ''
          and lower(coalesce(trim(v.marca),  '')) = lower(coalesce(trim(c.vehiculo_marca),  ''))
          and lower(coalesce(trim(v.modelo), '')) = lower(coalesce(trim(c.vehiculo_modelo), ''))
        )
      )
  );

-- ── Las órdenes sueltas ─────────────────────────────────────────────────────
--
-- Mismo enlace por placas que hizo la 051, ahora que hay más vehículos con los
-- que cuadrar: las órdenes creadas después de aquella migración siguen con
-- vehiculo_id en nulo. Sin esto, el historial del coche —el del portal y el del
-- enlace permanente— se apoya solo en la comparación de placas, que funciona
-- pero deja el enlace sin hacer.

update public.ordenes o
set vehiculo_id = v.id
from public.vehiculos v
where o.vehiculo_id is null
  and v.cliente_id = o.cliente_id
  and o.placas is not null
  and v.placas is not null
  and upper(regexp_replace(o.placas, '[^A-Za-z0-9]', '', 'g'))
    = upper(regexp_replace(v.placas, '[^A-Za-z0-9]', '', 'g'));
