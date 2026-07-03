-- ─────────────────────────────────────────────────────────────────────────────
-- Comunicación taller→cliente por WhatsApp vía links wa.me (sin Twilio/Meta)
-- Ejecutar en: Supabase > SQL Editor
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Número de WhatsApp del taller (para el QR de opt-in en el PDF) ───────────
alter table public.talleres
  add column if not exists whatsapp_numero text;

-- ── Tabla: mensajes_whatsapp_log ──────────────────────────────────────────────
-- Registra cada vez que un empleado del taller genera un link wa.me y confirma
-- el envío desde el modal. No confirma entrega (wa.me no lo permite, el envío
-- real lo hace la persona desde su propio WhatsApp) — es un registro de
-- intención/auditoría, no de estado de entrega.
create table if not exists public.mensajes_whatsapp_log (
  id          uuid primary key default uuid_generate_v4(),
  orden_id    uuid not null references public.ordenes(id) on delete cascade,
  taller_id   uuid not null references public.talleres(id) on delete cascade,
  usuario_id  uuid references public.usuarios(id) on delete set null,
  plantilla   text not null
                check (plantilla in ('recibido','diagnostico_listo','en_progreso','listo_entrega','garantia')),
  telefono    text not null,
  mensaje     text not null,
  created_at  timestamptz not null default now()
);

create index if not exists idx_mensajes_whatsapp_log_taller_id on public.mensajes_whatsapp_log(taller_id);
create index if not exists idx_mensajes_whatsapp_log_orden_id  on public.mensajes_whatsapp_log(orden_id);

-- ── RLS ───────────────────────────────────────────────────────────────────────
alter table public.mensajes_whatsapp_log enable row level security;

create policy "mensajes_whatsapp_log: select"
  on public.mensajes_whatsapp_log for select
  using (taller_id = public.get_my_taller_id());

create policy "mensajes_whatsapp_log: insert"
  on public.mensajes_whatsapp_log for insert
  with check (taller_id = public.get_my_taller_id());
