-- ═══════════════════════════════════════════════════════════════════════════
-- ¿Sirvió el asistente de bienvenida de dos pasos?
-- ═══════════════════════════════════════════════════════════════════════════
--
-- El 2026-08-04 el asistente pasó de 5 pasos a 2 (PR #61). De los 73 talleres
-- registrados hasta entonces, 54 se habían quedado a medias: el paso 3 abría
-- otra pestaña, el paso 4 sacaba del asistente sin marcar nada y los pasos 5
-- y 55 eran inalcanzables.
--
-- Esto NO se mide con `onboarding_completo`. En la versión vieja dos de las
-- salidas lo ponían en `true` sin que el taller hubiera hecho nada, así que
-- los 19 "completados" que había estaban inflados. Se mide con lo único que
-- demuestra uso real: que el taller haya creado una orden de trabajo.
--
-- `es_ejemplo = false` es imprescindible: desde el 2026-08-03 cada alta nueva
-- nace con 2 clientes y 1 orden de ejemplo (PR #57). Contándolos, el 100% de
-- los registros parecería activado desde el primer segundo.
--
-- Cuándo correrla:
--   · 2026-08-18 — solo para detectar desastre. Si ningún taller nuevo creó
--     una orden real, el asistente rompió algo. No sirve para dar el cambio
--     por bueno: con este volumen, dos semanas son ruido.
--   · 2026-09-01 — la lectura de verdad, con cuatro semanas de altas.
--
-- Dos límites que hay que decir en voz alta al interpretar el resultado:
--   1. No aísla el onboarding. Los datos de ejemplo entraron el 03/08 y el
--      asistente el 04/08, con 30 horas de diferencia y casi nadie
--      registrándose en medio. En la práctica se compara "ninguno de los dos
--      cambios" contra "los dos juntos".
--   2. La muestra es diminuta. Con estos números, un taller de diferencia
--      mueve el porcentaje veinte puntos. Detecta cambios grandes, no afina.
-- ═══════════════════════════════════════════════════════════════════════════

with cohorte as (
  select
    t.id,
    case
      when t.created_at >= timestamptz '2026-08-04 22:52+00' then 'nuevo (2 pasos)'
      else                                                        'viejo (5 pasos)'
    end as onboarding,
    -- Ventana igual para las dos cohortes: sin el límite de 14 días la vieja
    -- gana sola, por llevar más tiempo existiendo.
    exists (
      select 1
      from public.ordenes o
      where o.taller_id  = t.id
        and o.es_ejemplo = false
        and o.created_at < t.created_at + interval '14 days'
    ) as activado
  from public.talleres t
  where t.created_at >= timestamptz '2026-07-21'   -- dos semanas antes del cambio
)
select
  onboarding,
  count(*)                                                                as se_dieron_de_alta,
  count(*) filter (where activado)                                        as activados,
  round(100.0 * count(*) filter (where activado) / nullif(count(*), 0), 1) as pct_activacion
from cohorte
group by onboarding
order by onboarding desc;
