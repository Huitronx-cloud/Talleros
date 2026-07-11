-- ─────────────────────────────────────────────────────────────────────────────
-- Cola de mensajes wa.me: los crons ya NO envían WhatsApp por Twilio.
-- En su lugar encolan aquí y el equipo del taller los envía con un tap desde
-- su propio WhatsApp (sección "Mensajes por enviar" del dashboard).
-- Ejecutar en: Supabase > SQL Editor (ANTES de deployar el orquestador)
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.mensajes_pendientes (
  id            uuid primary key default uuid_generate_v4(),
  taller_id     uuid not null references public.talleres(id) on delete cascade,
  cliente_id    uuid references public.clientes(id) on delete set null,
  tipo          text not null check (tipo in ('recordatorio', 'resena', 'cita')),
  telefono      text not null,
  mensaje_texto text not null,
  wa_link       text not null,
  estado        text not null default 'pendiente'
                  check (estado in ('pendiente', 'enviado', 'descartado')),
  created_at    timestamptz not null default now(),
  enviado_at    timestamptz
);

create index if not exists idx_mensajes_pendientes_taller_estado
  on public.mensajes_pendientes(taller_id, estado);

alter table public.mensajes_pendientes enable row level security;

-- Los crons insertan con service role (bypassa RLS). El equipo del taller
-- solo puede ver y actualizar (marcar enviado/descartado) los de su taller.
create policy "mensajes_pendientes: select"
  on public.mensajes_pendientes for select
  using (taller_id = public.get_my_taller_id());

create policy "mensajes_pendientes: update"
  on public.mensajes_pendientes for update
  using (taller_id = public.get_my_taller_id())
  with check (taller_id = public.get_my_taller_id());

-- ── Deduplicación de trial-reminder ──────────────────────────────────────────
-- El handler decidía por ventana de días (7/4/1) sin marcar lo ya enviado:
-- una ventana de 2 días => el mismo correo salía 2 veces. Se registra la
-- etapa enviada por suscripción.
alter table public.suscripciones
  add column if not exists trial_reminder_etapas text[] not null default '{}';

-- ── Estado 'encolado' en los logs de dedup existentes ────────────────────────
-- recordatorios_enviados y resenas_enviadas siguen siendo la fuente de
-- deduplicación, pero ahora un registro puede significar "encolado en
-- mensajes_pendientes" en vez de "enviado por Twilio".
alter table public.recordatorios_enviados
  drop constraint if exists recordatorios_enviados_estado_check;
alter table public.recordatorios_enviados
  add constraint recordatorios_enviados_estado_check
  check (estado in ('enviado', 'fallido', 'encolado'));

alter table public.resenas_enviadas
  drop constraint if exists resenas_enviadas_estado_check;
alter table public.resenas_enviadas
  add constraint resenas_enviadas_estado_check
  check (estado in ('enviado', 'fallido', 'encolado'));
