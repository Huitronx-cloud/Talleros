-- CRM interno de TallerOS — unifica leads de prospección saliente (Google Maps + WhatsApp)
-- y mensajes entrantes de WhatsApp (botón del sitio, dudas de prospectos, etc).
-- No tiene relación con el sistema multi-tenant de talleres (usuarios/taller_id):
-- es una herramienta exclusiva del equipo de TallerOS, gateada en middleware.ts
-- por el secreto compartido ADMIN_SECRET.
-- Ejecutar en Supabase → SQL Editor

create table if not exists public.crm_leads (
  id               uuid default gen_random_uuid() primary key,
  nombre           text,
  telefono         text unique,        -- E.164, ej: +525512345678
  email            text,
  direccion        text,
  ciudad           text,
  pais             text,
  google_place_id  text unique,        -- presente cuando el lead viene de prospección
  website          text,
  origen           text not null default 'prospeccion' check (origen in ('prospeccion', 'whatsapp_inbound')),
  etapa            text not null default 'nuevo' check (etapa in ('nuevo', 'contactado', 'interesado', 'negociacion', 'cliente', 'descartado')),
  notas            text,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

create table if not exists public.crm_mensajes (
  id          uuid default gen_random_uuid() primary key,
  lead_id     uuid not null references public.crm_leads(id) on delete cascade,
  sentido     text not null check (sentido in ('entrante', 'saliente')),
  mensaje     text not null,
  created_at  timestamptz default now()
);

create index if not exists idx_crm_mensajes_lead_id on public.crm_mensajes(lead_id);

-- RLS: solo service role puede leer/escribir (el cron y el webhook usan service client)
alter table public.crm_leads enable row level security;
alter table public.crm_mensajes enable row level security;

create policy "crm_leads: solo service role"
  on public.crm_leads
  for all
  using (false);

create policy "crm_mensajes: solo service role"
  on public.crm_mensajes
  for all
  using (false);
