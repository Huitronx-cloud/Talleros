-- ── Tablas del sistema de reseñas ─────────────────────────────────────────────

create table if not exists public.resenas_config (
  id                   uuid primary key default uuid_generate_v4(),
  taller_id            uuid not null references public.talleres(id) on delete cascade,
  activo               boolean not null default false,
  canal                text not null default 'whatsapp'
                         check (canal in ('whatsapp', 'email', 'ambos')),
  horas_espera         integer not null default 2,
  google_review_url    text,
  mensaje_whatsapp     text not null default
    '¡Hola {{nombre}}! 😊 Gracias por confiar en {{taller}}. ¿Podrías dejarnos una reseña en Google? Solo toma 1 minuto y nos ayuda mucho: {{link}} ¡Gracias!',
  mensaje_email_asunto text not null default
    '¿Cómo estuvo tu experiencia en {{taller}}?',
  mensaje_email_cuerpo text not null default
    'Hola {{nombre}},\n\nGracias por visitarnos. Nos encantaría saber cómo estuvo tu experiencia con tu {{vehiculo}}.\n\n¿Podrías dejarnos una reseña en Google?',
  updated_at           timestamptz,
  created_at           timestamptz not null default now(),
  unique (taller_id)
);

create index if not exists idx_resenas_config_taller_id on public.resenas_config(taller_id);

create table if not exists public.resenas_enviadas (
  id              uuid primary key default uuid_generate_v4(),
  taller_id       uuid not null references public.talleres(id) on delete cascade,
  cliente_id      uuid references public.clientes(id) on delete set null,
  orden_id        uuid references public.ordenes(id) on delete set null,
  canal           text not null default 'whatsapp',
  estado          text not null default 'enviado'
                    check (estado in ('enviado', 'fallido')),
  tipo            text,
  mensaje_enviado text,
  url_resena      text,
  enviado_at      timestamptz default now(),
  created_at      timestamptz not null default now()
);

create index if not exists idx_resenas_enviadas_taller_id on public.resenas_enviadas(taller_id);
create index if not exists idx_resenas_enviadas_orden_id  on public.resenas_enviadas(orden_id);

-- ── Tablas del sistema de recordatorios ───────────────────────────────────────

create table if not exists public.recordatorios_config (
  id                   uuid primary key default uuid_generate_v4(),
  taller_id            uuid not null references public.talleres(id) on delete cascade,
  activo               boolean not null default false,
  meses_intervalo      integer not null default 6,
  canal                text not null default 'whatsapp'
                         check (canal in ('whatsapp', 'email', 'ambos')),
  mensaje_whatsapp     text not null default
    '¡Hola {{nombre}}! 👋 Han pasado {{meses}} meses desde que revisamos tu {{vehiculo}} en {{taller}}. ¿Todo bien con tu auto? Agenda tu próximo servicio y mantén tu vehículo en perfectas condiciones. 🔧',
  mensaje_email_asunto text not null default
    'Es hora del mantenimiento de tu {{vehiculo}}, {{nombre}}',
  mensaje_email_cuerpo text not null default
    'Hola {{nombre}},\n\nHan pasado {{meses}} meses desde tu última visita a {{taller}}. Tu {{vehiculo}} podría necesitar mantenimiento preventivo.\n\nContáctanos para agendar tu cita.',
  updated_at           timestamptz,
  created_at           timestamptz not null default now(),
  unique (taller_id)
);

create index if not exists idx_recordatorios_config_taller_id on public.recordatorios_config(taller_id);

create table if not exists public.recordatorios_enviados (
  id                   uuid primary key default uuid_generate_v4(),
  taller_id            uuid not null references public.talleres(id) on delete cascade,
  cliente_id           uuid references public.clientes(id) on delete set null,
  orden_id             uuid references public.ordenes(id) on delete set null,
  canal                text not null,
  estado               text not null default 'enviado'
                         check (estado in ('enviado', 'fallido')),
  mensaje_enviado      text,
  error_detalle        text,
  fecha_envio          timestamptz not null default now(),
  fecha_proxima_accion timestamptz,
  created_at           timestamptz not null default now()
);

create index if not exists idx_recordatorios_enviados_taller_id   on public.recordatorios_enviados(taller_id);
create index if not exists idx_recordatorios_enviados_cliente_id  on public.recordatorios_enviados(cliente_id);

-- ── RLS ───────────────────────────────────────────────────────────────────────

alter table public.resenas_config    enable row level security;
alter table public.resenas_enviadas  enable row level security;
alter table public.recordatorios_config   enable row level security;
alter table public.recordatorios_enviados enable row level security;

-- resenas_config
create policy "resenas_config: select" on public.resenas_config for select
  using (taller_id = public.get_my_taller_id());
create policy "resenas_config: insert" on public.resenas_config for insert
  with check (taller_id = public.get_my_taller_id());
create policy "resenas_config: update" on public.resenas_config for update
  using (taller_id = public.get_my_taller_id());

-- resenas_enviadas
create policy "resenas_enviadas: select" on public.resenas_enviadas for select
  using (taller_id = public.get_my_taller_id());
create policy "resenas_enviadas: insert" on public.resenas_enviadas for insert
  with check (taller_id = public.get_my_taller_id());

-- recordatorios_config
create policy "recordatorios_config: select" on public.recordatorios_config for select
  using (taller_id = public.get_my_taller_id());
create policy "recordatorios_config: insert" on public.recordatorios_config for insert
  with check (taller_id = public.get_my_taller_id());
create policy "recordatorios_config: update" on public.recordatorios_config for update
  using (taller_id = public.get_my_taller_id());

-- recordatorios_enviados
create policy "recordatorios_enviados: select" on public.recordatorios_enviados for select
  using (taller_id = public.get_my_taller_id());
create policy "recordatorios_enviados: insert" on public.recordatorios_enviados for insert
  with check (taller_id = public.get_my_taller_id());
