-- ─────────────────────────────────────────────────────────────────────────────
-- Talleros — Migración inicial
-- Ejecutar en: Supabase > SQL Editor
-- ─────────────────────────────────────────────────────────────────────────────

-- Extensiones necesarias
create extension if not exists "uuid-ossp";

-- ── Tabla: talleres (un registro = un tenant) ────────────────────────────────
create table if not exists public.talleres (
  id          uuid primary key default uuid_generate_v4(),
  nombre      text not null,
  telefono    text,
  ciudad      text,
  pais        text default 'México',
  plan        text not null default 'gratis' check (plan in ('gratis', 'basico', 'pro')),
  created_at  timestamptz not null default now()
);

-- ── Tabla: usuarios ───────────────────────────────────────────────────────────
-- Vinculada a auth.users (Supabase Auth) y al taller correspondiente
create table if not exists public.usuarios (
  id          uuid primary key references auth.users(id) on delete cascade,
  taller_id   uuid not null references public.talleres(id) on delete cascade,
  nombre      text not null,
  email       text not null,
  rol         text not null default 'tecnico' check (rol in ('propietario', 'admin', 'tecnico', 'recepcion')),
  created_at  timestamptz not null default now()
);

-- ── Índices ───────────────────────────────────────────────────────────────────
create index if not exists idx_usuarios_taller_id on public.usuarios(taller_id);

-- ── Row Level Security ────────────────────────────────────────────────────────
alter table public.talleres enable row level security;
alter table public.usuarios  enable row level security;

-- Política: un usuario solo ve su propio taller
create policy "usuarios ven su taller"
  on public.talleres for select
  using (
    id in (
      select taller_id from public.usuarios where id = auth.uid()
    )
  );

-- Política: un usuario solo ve a los miembros de su taller
create policy "usuarios ven miembros de su taller"
  on public.usuarios for select
  using (
    taller_id in (
      select taller_id from public.usuarios where id = auth.uid()
    )
  );

-- Política: propietario y admin pueden modificar datos del taller
create policy "propietario y admin editan taller"
  on public.talleres for update
  using (
    id in (
      select taller_id from public.usuarios
      where id = auth.uid() and rol in ('propietario', 'admin')
    )
  );

-- Política: propietario y admin gestionan usuarios del taller
create policy "propietario y admin gestionan usuarios"
  on public.usuarios for all
  using (
    taller_id in (
      select taller_id from public.usuarios
      where id = auth.uid() and rol in ('propietario', 'admin')
    )
  );

-- ── Función: obtener taller del usuario autenticado ───────────────────────────
create or replace function public.get_taller_id()
returns uuid
language sql stable
as $$
  select taller_id from public.usuarios where id = auth.uid() limit 1;
$$;
