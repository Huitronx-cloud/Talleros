-- Los mensajes sin enviar caducan.
--
-- Un taller acumuló 81 mensajes en cola. Al mirarlos uno por uno:
--
--   48 avisos    "su vehículo está listo para recoger" — el más viejo, del 15
--                de julio. Ese cliente recogió su coche hace 55 días.
--   29 seguimientos posteriores al servicio, desde el 2 de agosto.
--    4 citas     "confirme su cita del jueves" — de citas de julio y agosto.
--
-- Mandar hoy cualquiera de esos deja al taller PEOR que no haber escrito
-- nunca. No son una deuda pendiente: se les pasó el momento.
--
-- Y no se acumularon por dejadez del taller: la tarjeta que los enseñaba
-- estaba enterrada en el tablero, debajo del medidor de uso, donde nadie la
-- veía. El fallo es nuestro, así que la limpieza también.
--
-- ── Caducado no es descartado ───────────────────────────────────────────────
--
-- Descartado significa que una persona lo vio y decidió que no. Caducado
-- significa que se nos pasó el momento. Se guardan como estados distintos
-- porque responden a preguntas distintas: cuántos rechaza el taller, y cuántos
-- se nos están pudriendo en la cola.
--
-- ── Los plazos ─────────────────────────────────────────────────────────────
--
-- Avisos y citas a los 7 días: hablan de algo que pasa AHORA y una semana
-- después son falsos. El resto a los 30 —un seguimiento o un recordatorio de
-- mantenimiento sigue teniendo sentido al mes—, y las promociones a los 14,
-- que es lo que suele durar una campaña. Los mismos plazos están en
-- lib/mensajes-pendientes.ts; si se cambian, se cambian en los dos sitios.

alter table public.mensajes_pendientes
  drop constraint if exists mensajes_pendientes_estado_check;

alter table public.mensajes_pendientes
  add constraint mensajes_pendientes_estado_check
  check (estado in ('pendiente', 'enviado', 'descartado', 'caducado'));

-- La limpieza de lo que ya está podrido. De aquí en adelante lo hace el cron
-- diario (/api/cron/caducar-mensajes).
update public.mensajes_pendientes
set estado = 'caducado'
where estado = 'pendiente'
  and created_at < now() - (
    case tipo
      when 'aviso'     then interval '7 days'
      when 'cita'      then interval '7 days'
      when 'promocion' then interval '14 days'
      else                  interval '30 days'
    end
  );

-- Para que la pantalla pueda contar los caducados recientes sin escanear la
-- tabla entera: es lo que se usa para explicarle al taller qué pasó con ellos.
create index if not exists mensajes_pendientes_taller_estado_fecha_idx
  on public.mensajes_pendientes (taller_id, estado, created_at desc);
