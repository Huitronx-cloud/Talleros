-- Nombre y WhatsApp de la persona invitada.
--
-- Por qué el nombre: hasta ahora lo escribía el propio invitado al aceptar, y
-- ese texto es el que después aparece —y hay que acertar— en el desplegable de
-- "Mecánico asignado". Si el dueño invita a "Juan Pérez" y Juan se registra
-- como "juan", en los reportes salen dos personas. Poniéndolo el dueño al
-- invitar, el nombre queda decidido por quien va a usar la lista.
--
-- Por qué el teléfono: la invitación se manda por WhatsApp (el correo es solo
-- respaldo), así que el número es lo que de verdad hace que llegue. Se guarda
-- para poder reenviarla sin volver a pedirlo.
--
-- Ambas quedan NULL-ables a propósito: las invitaciones ya creadas no los
-- tienen, y una columna obligatoria las rompería. Lo obligatorio se exige en
-- /api/invitaciones, que es donde nacen las nuevas.

alter table public.invitaciones add column if not exists nombre   text;
alter table public.invitaciones add column if not exists telefono text;
