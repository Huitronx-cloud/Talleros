-- ── Tabla: notificaciones ─────────────────────────────────────────────────────
create table public.notificaciones (
  id            uuid primary key default uuid_generate_v4(),
  taller_id     uuid not null references public.talleres(id) on delete cascade,
  orden_id      uuid references public.ordenes(id) on delete set null,
  cliente_id    uuid references public.clientes(id) on delete set null,
  tipo          text not null check (tipo in ('orden_lista', 'recordatorio', 'seguimiento')),
  mensaje       text not null,
  estado        text not null default 'pendiente'
                  check (estado in ('pendiente', 'enviada', 'fallida')),
  error_mensaje text,
  created_at    timestamptz not null default now()
);

create index idx_notificaciones_taller_id on public.notificaciones(taller_id);
create index idx_notificaciones_orden_id  on public.notificaciones(orden_id);

-- ── RLS ───────────────────────────────────────────────────────────────────────
alter table public.notificaciones enable row level security;

create policy "notificaciones: select"
  on public.notificaciones for select
  using (taller_id = public.get_my_taller_id());

create policy "notificaciones: insert"
  on public.notificaciones for insert
  with check (taller_id = public.get_my_taller_id());

create policy "notificaciones: update"
  on public.notificaciones for update
  using (taller_id = public.get_my_taller_id());
