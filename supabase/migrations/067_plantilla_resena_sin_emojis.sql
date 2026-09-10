-- Quita los emojis de la plantilla por defecto de las solicitudes de reseña.
--
-- Los mensajes a clientes se quedaron sin emojis hace unos días, por decisión
-- del dueño del producto: "que se vea más serio". Este se quedó fuera porque no
-- vive en el código sino en el DEFAULT de la columna, y no lo estaba mirando
-- nadie — entre otras cosas porque no ha salido ni una solicitud de reseña en
-- toda la historia de la plataforma.
--
-- Ahora que la búsqueda "¿Es este tu taller?" va a empezar a crear filas, esa
-- plantilla sí va a llegar a clientes. Mejor arreglarla antes.
--
-- ── Lo que NO se toca ──────────────────────────────────────────────────────
--
-- Solo se actualizan las filas cuyo mensaje es EXACTAMENTE el default viejo, o
-- sea las que nadie ha editado. De los tres talleres con configuración, uno
-- reescribió su mensaje a mano —cambió el nombre del taller y redactó a su
-- manera— y ese se queda como está. Son sus palabras, no nuestras: quitarle su
-- emoji sería editarle el mensaje a un taller que ya decidió cómo quiere
-- hablarle a sus clientes.

alter table public.resenas_config
  alter column mensaje_whatsapp set default
    'Hola {{nombre}}, gracias por confiar en *{{taller}}* con tu {{vehiculo}}. ¿Nos ayudas con una reseña en Google? Solo toma 1 minuto y nos ayuda mucho: {{link}}';

update public.resenas_config
set mensaje_whatsapp =
      'Hola {{nombre}}, gracias por confiar en *{{taller}}* con tu {{vehiculo}}. ¿Nos ayudas con una reseña en Google? Solo toma 1 minuto y nos ayuda mucho: {{link}}',
    updated_at = now()
where mensaje_whatsapp =
      '¡Hola {{nombre}}! 😊 Gracias por confiar en *{{taller}}* con tu {{vehiculo}}. ¿Nos ayudas con una reseña en Google? Solo toma 1 minuto y nos ayuda mucho 🙏 {{link}}';

-- Verificación:
--   select count(*) from resenas_config
--   where mensaje_whatsapp ~ '[\U0001F300-\U0001FAFF]';
--   -- debe dar 1: el taller que escribió el suyo a mano
