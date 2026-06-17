-- Columna usada por el cron de recordatorios de citas (app/cron/recordatorios-citas)
-- para no enviar el mismo recordatorio dos veces.
alter table public.citas add column if not exists recordatorio_enviado boolean not null default false;
