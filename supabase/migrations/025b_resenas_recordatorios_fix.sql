-- Las tablas y políticas ya existen — solo aseguramos columnas faltantes y defaults

-- resenas_config: columna horas_espera si no existe
alter table public.resenas_config add column if not exists horas_espera integer not null default 2;

-- resenas_enviadas: columnas tipo y url_resena que usa google/resena route
alter table public.resenas_enviadas add column if not exists tipo        text;
alter table public.resenas_enviadas add column if not exists url_resena  text;
alter table public.resenas_enviadas add column if not exists enviado_at  timestamptz default now();

-- recordatorios_enviados: columna error_detalle
alter table public.recordatorios_enviados add column if not exists error_detalle        text;
alter table public.recordatorios_enviados add column if not exists fecha_proxima_accion timestamptz;
