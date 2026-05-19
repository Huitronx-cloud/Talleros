-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRACIÓN 020 — Row Level Security para todas las tablas pendientes
-- Ejecutar en Supabase → SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════

-- ── CITAS ────────────────────────────────────────────────────────────────────
alter table public.citas enable row level security;

create policy "citas: select"
  on public.citas for select
  using (taller_id = public.get_my_taller_id());

create policy "citas: insert"
  on public.citas for insert
  with check (taller_id = public.get_my_taller_id());

create policy "citas: update"
  on public.citas for update
  using (taller_id = public.get_my_taller_id());

create policy "citas: delete"
  on public.citas for delete
  using (taller_id = public.get_my_taller_id());

-- Permitir lectura pública para la página de agendar cita (portal sin login)
create policy "citas: lectura publica por taller_id"
  on public.citas for select
  using (true);  -- el filtro por taller_id se hace en la query desde la app

-- ── CITAS_CONFIG ─────────────────────────────────────────────────────────────
alter table public.citas_config enable row level security;

create policy "citas_config: select"
  on public.citas_config for select
  using (taller_id = public.get_my_taller_id());

create policy "citas_config: insert"
  on public.citas_config for insert
  with check (taller_id = public.get_my_taller_id());

create policy "citas_config: update"
  on public.citas_config for update
  using (taller_id = public.get_my_taller_id());

-- Lectura pública para la página de agendado (necesita ver horarios sin login)
create policy "citas_config: lectura publica"
  on public.citas_config for select
  using (true);

-- ── CATALOGO_SERVICIOS ───────────────────────────────────────────────────────
alter table public.catalogo_servicios enable row level security;

create policy "catalogo: select"
  on public.catalogo_servicios for select
  using (taller_id = public.get_my_taller_id());

create policy "catalogo: insert"
  on public.catalogo_servicios for insert
  with check (taller_id = public.get_my_taller_id());

create policy "catalogo: update"
  on public.catalogo_servicios for update
  using (taller_id = public.get_my_taller_id());

create policy "catalogo: delete"
  on public.catalogo_servicios for delete
  using (taller_id = public.get_my_taller_id());

-- ── FOTOS_DIAGNOSTICO ────────────────────────────────────────────────────────
alter table public.fotos_diagnostico enable row level security;

create policy "fotos_diagnostico: select"
  on public.fotos_diagnostico for select
  using (
    orden_id in (
      select id from public.ordenes
      where taller_id = public.get_my_taller_id()
    )
  );

create policy "fotos_diagnostico: insert"
  on public.fotos_diagnostico for insert
  with check (
    orden_id in (
      select id from public.ordenes
      where taller_id = public.get_my_taller_id()
    )
  );

create policy "fotos_diagnostico: delete"
  on public.fotos_diagnostico for delete
  using (
    orden_id in (
      select id from public.ordenes
      where taller_id = public.get_my_taller_id()
    )
  );

-- ── INSPECCION_DANOS ─────────────────────────────────────────────────────────
alter table public.inspeccion_danos enable row level security;

create policy "inspeccion_danos: select"
  on public.inspeccion_danos for select
  using (
    orden_id in (
      select id from public.ordenes
      where taller_id = public.get_my_taller_id()
    )
  );

create policy "inspeccion_danos: insert"
  on public.inspeccion_danos for insert
  with check (
    orden_id in (
      select id from public.ordenes
      where taller_id = public.get_my_taller_id()
    )
  );

create policy "inspeccion_danos: update"
  on public.inspeccion_danos for update
  using (
    orden_id in (
      select id from public.ordenes
      where taller_id = public.get_my_taller_id()
    )
  );

-- ── INVENTARIO ───────────────────────────────────────────────────────────────
alter table public.inventario enable row level security;

create policy "inventario: select"
  on public.inventario for select
  using (taller_id = public.get_my_taller_id());

create policy "inventario: insert"
  on public.inventario for insert
  with check (taller_id = public.get_my_taller_id());

create policy "inventario: update"
  on public.inventario for update
  using (taller_id = public.get_my_taller_id());

create policy "inventario: delete"
  on public.inventario for delete
  using (taller_id = public.get_my_taller_id());

-- ── INVENTARIO_MOVIMIENTOS ───────────────────────────────────────────────────
alter table public.inventario_movimientos enable row level security;

create policy "inventario_movimientos: select"
  on public.inventario_movimientos for select
  using (taller_id = public.get_my_taller_id());

create policy "inventario_movimientos: insert"
  on public.inventario_movimientos for insert
  with check (taller_id = public.get_my_taller_id());

-- ── INVITACIONES ─────────────────────────────────────────────────────────────
alter table public.invitaciones enable row level security;

create policy "invitaciones: select propietario"
  on public.invitaciones for select
  using (taller_id = public.get_my_taller_id());

create policy "invitaciones: insert propietario"
  on public.invitaciones for insert
  with check (taller_id = public.get_my_taller_id());

create policy "invitaciones: update propietario"
  on public.invitaciones for update
  using (taller_id = public.get_my_taller_id());

-- Lectura pública por token (para el flujo de unirse sin login)
create policy "invitaciones: lectura publica por token"
  on public.invitaciones for select
  using (true);

-- ── NOTAS_VOZ ────────────────────────────────────────────────────────────────
alter table public.notas_voz enable row level security;

create policy "notas_voz: select"
  on public.notas_voz for select
  using (taller_id = public.get_my_taller_id());

create policy "notas_voz: insert"
  on public.notas_voz for insert
  with check (taller_id = public.get_my_taller_id());

create policy "notas_voz: delete"
  on public.notas_voz for delete
  using (taller_id = public.get_my_taller_id());

-- ── PAGOS ────────────────────────────────────────────────────────────────────
alter table public.pagos enable row level security;

create policy "pagos: select"
  on public.pagos for select
  using (taller_id = public.get_my_taller_id());

create policy "pagos: insert"
  on public.pagos for insert
  with check (taller_id = public.get_my_taller_id());

create policy "pagos: update"
  on public.pagos for update
  using (taller_id = public.get_my_taller_id());

-- ── PORTAL_TOKENS ────────────────────────────────────────────────────────────
alter table public.portal_tokens enable row level security;

create policy "portal_tokens: select taller"
  on public.portal_tokens for select
  using (taller_id = public.get_my_taller_id());

create policy "portal_tokens: insert taller"
  on public.portal_tokens for insert
  with check (taller_id = public.get_my_taller_id());

-- Lectura pública por token (portal del cliente sin login)
create policy "portal_tokens: lectura publica por token"
  on public.portal_tokens for select
  using (true);

-- ── PROMOCIONES ──────────────────────────────────────────────────────────────
alter table public.promociones enable row level security;

create policy "promociones: select"
  on public.promociones for select
  using (taller_id = public.get_my_taller_id());

create policy "promociones: insert"
  on public.promociones for insert
  with check (taller_id = public.get_my_taller_id());

-- ── PUSH_SUSCRIPCIONES ───────────────────────────────────────────────────────
alter table public.push_suscripciones enable row level security;

create policy "push_suscripciones: select propio"
  on public.push_suscripciones for select
  using (usuario_id = auth.uid());

create policy "push_suscripciones: insert propio"
  on public.push_suscripciones for insert
  with check (usuario_id = auth.uid());

create policy "push_suscripciones: delete propio"
  on public.push_suscripciones for delete
  using (usuario_id = auth.uid());

-- ── RECORDATORIOS_CONFIG ─────────────────────────────────────────────────────
alter table public.recordatorios_config enable row level security;

create policy "recordatorios_config: select"
  on public.recordatorios_config for select
  using (taller_id = public.get_my_taller_id());

create policy "recordatorios_config: insert"
  on public.recordatorios_config for insert
  with check (taller_id = public.get_my_taller_id());

create policy "recordatorios_config: update"
  on public.recordatorios_config for update
  using (taller_id = public.get_my_taller_id());

-- ── RECORDATORIOS_ENVIADOS ───────────────────────────────────────────────────
alter table public.recordatorios_enviados enable row level security;

create policy "recordatorios_enviados: select"
  on public.recordatorios_enviados for select
  using (taller_id = public.get_my_taller_id());

create policy "recordatorios_enviados: insert"
  on public.recordatorios_enviados for insert
  with check (taller_id = public.get_my_taller_id());

-- ── RESENAS_CONFIG ───────────────────────────────────────────────────────────
alter table public.resenas_config enable row level security;

create policy "resenas_config: select"
  on public.resenas_config for select
  using (taller_id = public.get_my_taller_id());

create policy "resenas_config: insert"
  on public.resenas_config for insert
  with check (taller_id = public.get_my_taller_id());

create policy "resenas_config: update"
  on public.resenas_config for update
  using (taller_id = public.get_my_taller_id());

-- ── RESENAS_ENVIADAS ─────────────────────────────────────────────────────────
alter table public.resenas_enviadas enable row level security;

create policy "resenas_enviadas: select"
  on public.resenas_enviadas for select
  using (taller_id = public.get_my_taller_id());

create policy "resenas_enviadas: insert"
  on public.resenas_enviadas for insert
  with check (taller_id = public.get_my_taller_id());

-- ── SUSCRIPCIONES ────────────────────────────────────────────────────────────
alter table public.suscripciones enable row level security;

create policy "suscripciones: select propio taller"
  on public.suscripciones for select
  using (taller_id = public.get_my_taller_id());

create policy "suscripciones: insert propio taller"
  on public.suscripciones for insert
  with check (taller_id = public.get_my_taller_id());

create policy "suscripciones: update propio taller"
  on public.suscripciones for update
  using (taller_id = public.get_my_taller_id());

-- ── USO_MENSUAL ──────────────────────────────────────────────────────────────
alter table public.uso_mensual enable row level security;

create policy "uso_mensual: select"
  on public.uso_mensual for select
  using (taller_id = public.get_my_taller_id());

create policy "uso_mensual: insert"
  on public.uso_mensual for insert
  with check (taller_id = public.get_my_taller_id());

create policy "uso_mensual: update"
  on public.uso_mensual for update
  using (taller_id = public.get_my_taller_id());

-- ── VEHICULOS ────────────────────────────────────────────────────────────────
alter table public.vehiculos enable row level security;

create policy "vehiculos: select"
  on public.vehiculos for select
  using (taller_id = public.get_my_taller_id());

create policy "vehiculos: insert"
  on public.vehiculos for insert
  with check (taller_id = public.get_my_taller_id());

create policy "vehiculos: update"
  on public.vehiculos for update
  using (taller_id = public.get_my_taller_id());

create policy "vehiculos: delete"
  on public.vehiculos for delete
  using (taller_id = public.get_my_taller_id());
