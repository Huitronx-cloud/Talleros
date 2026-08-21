-- ─────────────────────────────────────────────────────────────────────────────
-- Bandeja de soporte: todo lo que llega a hola@tallerosapp.com queda registrado
-- aquí en cuanto entra, antes de que nadie lo lea.
--
-- Por qué existe: los dos reportes de esta semana (el cobro de FASTCAR y el
-- portal de ZUÑIGA) tardaron en atenderse no porque fueran difíciles, sino
-- porque nadie se enteró de que habían llegado. Un correo que solo vive en un
-- buzón no se puede medir, ni avisar, ni dar seguimiento.
--
-- Es una tabla interna: no pertenece a ningún taller y no la lee nadie desde
-- la app del cliente. Por eso RLS queda activo SIN políticas — solo el service
-- role (los endpoints del servidor) la toca.
--
-- Ejecutar en: Supabase > SQL Editor (ANTES de desplegar /api/correo/entrante)
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.soporte_correos (
  id             uuid primary key default gen_random_uuid(),

  -- Quién escribió
  de_email       text not null,
  de_nombre      text,
  asunto         text,
  cuerpo         text,

  -- Con qué taller se pudo emparejar (por el correo del propietario).
  -- Nullable a propósito: puede escribir alguien que no es cliente todavía, y
  -- ese correo importa igual.
  taller_id      uuid references public.talleres(id) on delete set null,

  estado         text not null default 'nuevo'
                   check (estado in ('nuevo', 'en_curso', 'resuelto')),

  -- Qué salió automáticamente al recibirlo. Se guardan por separado porque
  -- fallan por motivos distintos: el acuse depende de Resend y el aviso de
  -- Twilio, y saber cuál de los dos falló es la diferencia entre "el cliente
  -- cree que lo ignoramos" y "no me enteré yo".
  acuse_enviado  boolean not null default false,
  aviso_enviado  boolean not null default false,

  -- Identificador del proveedor de correo, para no duplicar si reintenta el
  -- webhook. Nullable porque no todos los proveedores lo mandan.
  message_id     text unique,

  recibido_at    timestamptz not null default now(),
  created_at     timestamptz not null default now()
);

create index if not exists idx_soporte_correos_estado
  on public.soporte_correos(estado, recibido_at desc);

create index if not exists idx_soporte_correos_de_email
  on public.soporte_correos(de_email);

alter table public.soporte_correos enable row level security;

-- Sin políticas: nadie llega a esta tabla con la llave pública. Es deliberado,
-- no un olvido — aquí hay correos de personas que no son usuarios de la app.
