-- ── Columna error_mensaje en resenas_enviadas ──────────────────────────────────
-- lib/resenas.ts ahora guarda el motivo real de un envío fallido (WhatsApp o
-- email) para poder mostrarlo en el historial en vez de solo marcar "fallido".

alter table public.resenas_enviadas
  add column if not exists error_mensaje text;
