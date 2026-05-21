-- Tabla para registrar talleres ya contactados por el agente de prospección
-- Ejecutar en Supabase → SQL Editor

create table if not exists public.prospectos_enviados (
  id               uuid default gen_random_uuid() primary key,
  nombre           text not null,
  telefono         text,
  email            text,
  direccion        text,
  ciudad           text,
  pais             text,
  google_place_id  text unique not null,  -- evita duplicados
  website          text,
  rating           numeric,
  contactado_at    timestamptz default now(),
  created_at       timestamptz default now()
);

-- Índice para búsqueda rápida por place_id
create index if not exists idx_prospectos_place_id
  on public.prospectos_enviados(google_place_id);

-- RLS: solo service role puede leer/escribir (el agente usa service client)
alter table public.prospectos_enviados enable row level security;

create policy "prospectos: solo service role"
  on public.prospectos_enviados
  for all
  using (false);  -- bloquea acceso anon/authenticated, solo service role pasa
