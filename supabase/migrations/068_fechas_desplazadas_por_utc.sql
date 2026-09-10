-- Corrige las fechas que quedaron un día adelantadas por guardarse en UTC.
--
-- El fallo está arreglado en el código (lib/fechas.ts); esto limpia lo que ya
-- se había guardado mal.
--
-- Origen: la aplicación usaba `new Date().toISOString().split('T')[0]`, que
-- devuelve la fecha UTC también en el navegador. A partir de las 18:00 en
-- México —19:00 en Colombia, Perú y Ecuador; 21:00 en Argentina— se guardaba la
-- fecha del día siguiente. El horario por defecto de los talleres cierra justo
-- a las 18:00.
--
-- Alcance real, medido antes de escribir esto:
--   · 12 órdenes con fecha_entrada adelantada, en MX, CO, GT y PE.
--   · 5 órdenes con fecha_entrega adelantada, dos de ellas de FASTCAR.
--
-- ── Por qué la condición es "exactamente un día" y no "cualquier adelanto" ──
--
-- Porque un taller puede haber puesto una fecha a mano —registrar hoy un coche
-- que entró ayer, o dejar apuntada una entrada futura— y eso no es un fallo
-- nuestro que haya que corregir. La firma del error es siempre la misma: la
-- fecha guardada es EXACTAMENTE el día local + 1. Acotándolo así, una fecha
-- puesta por una persona no se toca ni por accidente.
--
-- Se comprobó que no se pierde nada por ser estricto: con "cualquier adelanto"
-- salen 12 filas y con "exactamente un día" salen las mismas 12.
--
-- La hora real de entrega sale del historial de la orden, que sí guarda el
-- instante completo con su zona.

with zonas(pais, zona) as (values
  ('MX','America/Mexico_City'),('CO','America/Bogota'),('AR','America/Argentina/Buenos_Aires'),
  ('CL','America/Santiago'),('PE','America/Lima'),('EC','America/Guayaquil'),
  ('VE','America/Caracas'),('BO','America/La_Paz'),('PY','America/Asuncion'),
  ('UY','America/Montevideo'),('GT','America/Guatemala'),('CR','America/Costa_Rica'),
  ('PA','America/Panama'),('HN','America/Tegucigalpa'),('SV','America/El_Salvador'),
  ('NI','America/Managua'),('DO','America/Santo_Domingo'),('US','America/New_York'),('CA','America/Toronto')
)
update public.ordenes o
set fecha_entrada = (o.created_at at time zone coalesce(z.zona, 'America/Mexico_City'))::date
from public.talleres t
left join zonas z on z.pais = t.pais
where t.id = o.taller_id
  and o.fecha_entrada is not null
  and o.fecha_entrada = ((o.created_at at time zone coalesce(z.zona, 'America/Mexico_City'))::date + 1);

with zonas(pais, zona) as (values
  ('MX','America/Mexico_City'),('CO','America/Bogota'),('AR','America/Argentina/Buenos_Aires'),
  ('CL','America/Santiago'),('PE','America/Lima'),('EC','America/Guayaquil'),
  ('VE','America/Caracas'),('BO','America/La_Paz'),('PY','America/Asuncion'),
  ('UY','America/Montevideo'),('GT','America/Guatemala'),('CR','America/Costa_Rica'),
  ('PA','America/Panama'),('HN','America/Tegucigalpa'),('SV','America/El_Salvador'),
  ('NI','America/Managua'),('DO','America/Santo_Domingo'),('US','America/New_York'),('CA','America/Toronto')
),
entregas as (
  select o.id,
         max((h->>'fecha')::timestamptz) as momento
  from public.ordenes o
  cross join lateral jsonb_array_elements(coalesce(o.historial, '[]'::jsonb)) h
  where h->>'estado' = 'entregado'
  group by o.id
)
update public.ordenes o
set fecha_entrega = (e.momento at time zone coalesce(z.zona, 'America/Mexico_City'))::date
from entregas e, public.talleres t
left join zonas z on z.pais = t.pais
where e.id = o.id
  and t.id = o.taller_id
  and o.fecha_entrega is not null
  and o.fecha_entrega = ((e.momento at time zone coalesce(z.zona, 'America/Mexico_City'))::date + 1);

-- Verificación (correr aparte):
--   with zonas(pais, zona) as (values ('MX','America/Mexico_City'),('CO','America/Bogota'),
--     ('GT','America/Guatemala'),('PE','America/Lima'))
--   select count(*) from ordenes o
--   join talleres t on t.id = o.taller_id
--   left join zonas z on z.pais = t.pais
--   where o.fecha_entrada = ((o.created_at at time zone coalesce(z.zona,'America/Mexico_City'))::date + 1);
--   -- debe dar 0
