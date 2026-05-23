-- Agregar columna google_calendar_event_id a citas
-- Ejecutar en Supabase → SQL Editor

alter table public.citas
  add column if not exists google_calendar_event_id text;
