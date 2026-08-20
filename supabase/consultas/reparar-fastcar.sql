-- Reparar la suscripción de FASTCAR
-- ---------------------------------------------------------------------------
-- Qué pasó:
--   FASTCAR contrató el plan Esencial el 18 de julio sobre el precio
--   price_1TVxQ1RFpmo4G9XHSD938Kyf (los precios de entonces, en CAD). El 30 de
--   julio se cambiaron los precios a USD y los viejos se sacaron de
--   PRECIOS_A_PLAN en lib/stripe.ts. A partir de ahí, cada webhook de
--   customer.subscription.updated —incluida la renovación cobrada el 18 de
--   agosto— no encontraba ese precio en el mapa y aplicaba el default 'trial'.
--
--   Resultado: un cliente al corriente de pago corriendo con los topes del plan
--   gratis (10 órdenes/mes, 20 clientes, 1 usuario) cuando ya tenía 41 órdenes,
--   25 clientes y 3 usuarios. Al toparse, la app lo mandaba a pagar y Stripe
--   rechazaba el checkout porque su cliente ya está en CAD y el precio nuevo
--   está en USD ("You cannot combine currencies on a single customer").
--
-- El código ya no vuelve a degradar a nadie por un precio desconocido, pero la
-- fila hay que corregirla a mano: el webhook solo la reescribe cuando Stripe
-- manda un evento nuevo, y el próximo es hasta la renovación de septiembre.
--
-- periodo_fin sale del cobro del 18 de agosto + 1 mes. trial_fin se queda en
-- null a propósito: FASTCAR no está en prueba, está pagando.

-- 1) Ver el estado actual antes de tocar nada.
select t.nombre, s.plan, s.estado, s.precio_id, s.periodo_inicio, s.periodo_fin,
       s.trial_fin, s.stripe_subscription_id
from suscripciones s
join talleres t on t.id = s.taller_id
where t.nombre = 'FASTCAR';

-- 2) Corregir.
update suscripciones s
set plan           = 'esencial',
    estado         = 'activa',
    periodo_inicio = '2026-08-18T00:00:00Z',
    periodo_fin    = '2026-09-18T00:00:00Z',
    trial_fin      = null
from talleres t
where t.id = s.taller_id
  and t.nombre = 'FASTCAR'
  and s.stripe_subscription_id = 'sub_1Tua4BRFpmo4G9XHPbYGQAay';

-- 3) Confirmar que quedó bien (misma consulta del paso 1).
select t.nombre, s.plan, s.estado, s.precio_id, s.periodo_inicio, s.periodo_fin,
       s.trial_fin, s.stripe_subscription_id
from suscripciones s
join talleres t on t.id = s.taller_id
where t.nombre = 'FASTCAR';
