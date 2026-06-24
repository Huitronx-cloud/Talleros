-- ── Trabajo extra: persistir solicitud y estado de aprobación en ordenes ──────
-- app/api/notificaciones/route.ts armaba el mensaje de aprobacion_extra con
-- servicio_extra/costo_extra solo en memoria, sin guardarlos en la orden, así
-- que el webhook de WhatsApp no tenía forma de saber qué orden tiene una
-- solicitud de trabajo extra pendiente cuando el cliente responde SÍ/NO.

alter table public.ordenes
  add column if not exists servicio_extra text,
  add column if not exists costo_extra    numeric(10,2),
  add column if not exists extra_estado   text
                             check (extra_estado in ('pendiente', 'aprobado', 'rechazado'));

create index if not exists idx_ordenes_extra_estado on public.ordenes(extra_estado);
