-- ── Ampliar tipos permitidos en notificaciones ─────────────────────────────────
-- app/api/notificaciones/route.ts ya envía estos tipos además de los 3
-- originales, pero el CHECK constraint los rechazaba y la inserción fallaba
-- en silencio (Supabase-js no lanza excepción en errores de insert).

alter table public.notificaciones
  drop constraint if exists notificaciones_tipo_check;

alter table public.notificaciones
  add constraint notificaciones_tipo_check
  check (tipo in (
    'orden_lista',
    'recordatorio',
    'seguimiento',
    'aprobacion_extra',
    'garantia',
    'recordatorio_mantenimiento',
    'fotos_diagnostico'
  ));
