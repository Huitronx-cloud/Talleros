-- Cuándo se le escribió a un carrito abandonado.
--
-- Hasta ahora el panel armaba SIEMPRE el mismo mensaje: "vi que entraste a
-- activar tu plan y no llegaste a terminar". Está bien la primera vez, pero
-- alguien ya lo recibió dos veces idénticas, y un tercero igual es peor que no
-- escribir — deja claro que del otro lado nadie está leyendo.
--
-- Con esto el panel sabe cuántas veces se le ha escrito y cambia el texto: la
-- segunda insiste distinto y la tercera cierra la puerta con respeto, que es lo
-- que de verdad hace que contesten.
--
-- Se registra al pulsar el botón, que es el momento en que se abre WhatsApp con
-- el texto puesto. No prueba que el mensaje se haya enviado —eso pasa dentro de
-- WhatsApp y no vuelve— pero sí que se abrió, y para no repetir texto basta.

create table if not exists public.contactos_carrito (
  id         uuid primary key default gen_random_uuid(),
  taller_id  uuid not null references public.talleres(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists contactos_carrito_taller_idx
  on public.contactos_carrito (taller_id, created_at desc);

-- RLS activa y SIN políticas: es una tabla del panel de administración, a la
-- que solo llega el service client (que salta RLS por diseño). Sin políticas,
-- ningún usuario de ningún taller puede leerla ni escribirla — que es
-- exactamente lo que se quiere.
alter table public.contactos_carrito enable row level security;
