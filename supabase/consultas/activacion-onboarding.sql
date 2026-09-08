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
--   · 2026-09-30 — la siguiente. Ver abajo por qué hace falta otra.
--
-- ── Lo medido hasta ahora ───────────────────────────────────────────────────
--
--   2026-08-24 → nuevo 21%
--   2026-09-08 → viejo 1/7 (14,3%) · nuevo 11/31 (35,5%)
--
-- El 35,5% del 08/09 tiene truco y conviene recordarlo al compararlo: 14 de
-- esos 31 talleres seguían DENTRO de su ventana de 14 días, así que todavía
-- podían activarse. Quedándose solo con los que ya la agotaron: 5 de 17, un
-- 29,4%. Sigue siendo el doble que el asistente viejo.
--
-- Por eso hay que volver a correrla a finales de septiembre: cuando esos 14
-- hayan cerrado ventana, el número deja de moverse solo y empieza a valer.
--
-- Señal suelta que merece la pena mirar otra vez: de los 14 que estaban dentro
-- de la ventana, 6 ya habían creado su orden real. Los que se activan lo hacen
-- pronto, no al final del plazo.
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
    -- Fuera las cuentas de prueba del dueño (migración 061). Una de ellas,
    -- "Taller Mecánico Enzo", tenía cinco órdenes marcadas como reales y se
    -- contaba como taller activado. Con 31 talleres en la cohorte eso movía el
    -- resultado dos puntos: los números tienen que salir de los clientes.
    and not t.es_prueba
)
select
  onboarding,
  count(*)                                                                as se_dieron_de_alta,
  count(*) filter (where activado)                                        as activados,
  round(100.0 * count(*) filter (where activado) / nullif(count(*), 0), 1) as pct_activacion
from cohorte
group by onboarding
order by onboarding desc;
