-- ─────────────────────────────────────────────────────────────────────────────
-- Amplía los tipos de la cola wa.me: toda la comunicación taller→cliente por
-- WhatsApp sale de aquí (ya sin Twilio) — avisos de orden lista, garantías,
-- seguimiento post-servicio y promociones masivas.
-- Ejecutar en: Supabase > SQL Editor (ANTES de deployar)
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.mensajes_pendientes
  drop constraint if exists mensajes_pendientes_tipo_check;

alter table public.mensajes_pendientes
  add constraint mensajes_pendientes_tipo_check
  check (tipo in (
    'recordatorio', 'resena', 'cita',
    'promocion', 'aviso', 'garantia', 'seguimiento'
  ));
