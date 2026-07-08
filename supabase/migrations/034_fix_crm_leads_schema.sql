-- Las tablas crm_leads / crm_mensajes habían quedado creadas en producción
-- como tablas "plantilla" vacías (solo id bigint + created_at), probablemente
-- desde el Table Editor, antes de correr la migración 028. Como esa migración
-- usa "create table if not exists", nunca aplicó el esquema real y todo
-- insert/upsert hacia crm_leads (prospección saliente y WhatsApp entrante)
-- fallaba en silencio — por eso /admin/leads siempre estuvo vacío.
-- Ambas tablas estaban en 0 filas, así que se recrean desde cero.
-- Ejecutar en Supabase → SQL Editor

drop table if exists public.crm_mensajes;
drop table if exists public.crm_leads;

create table public.crm_leads (
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

create table public.crm_mensajes (
  id          uuid default gen_random_uuid() primary key,
  lead_id     uuid not null references public.crm_leads(id) on delete cascade,
  sentido     text not null check (sentido in ('entrante', 'saliente')),
  mensaje     text not null,
  created_at  timestamptz default now()
);

create index idx_crm_mensajes_lead_id on public.crm_mensajes(lead_id);

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
