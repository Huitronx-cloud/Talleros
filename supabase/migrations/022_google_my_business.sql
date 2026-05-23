-- Agregar columnas de Google My Business a la tabla talleres
-- Ejecutar en Supabase → SQL Editor

alter table public.talleres
  add column if not exists google_access_token  text,
  add column if not exists google_refresh_token text,
  add column if not exists google_token_expiry  timestamptz,
  add column if not exists google_email         text,
  add column if not exists gmb_account_id       text,
  add column if not exists gmb_location_id      text,
  add column if not exists google_connected_at  timestamptz;
