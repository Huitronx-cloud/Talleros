-- ── Tablas faltantes: suscripciones, portal_tokens, push_suscripciones ────────
-- Usa CREATE TABLE IF NOT EXISTS para ser idempotente con entornos que ya las tienen

-- ── SUSCRIPCIONES ─────────────────────────────────────────────────────────────
create table if not exists public.suscripciones (
  id                     uuid primary key default uuid_generate_v4(),
  taller_id              uuid not null references public.talleres(id) on delete cascade,
  plan                   text not null default 'trial',
  estado                 text not null default 'activa'
                           check (estado in ('activa', 'vencida', 'cancelada')),
  stripe_subscription_id text,
  stripe_customer_id     text,
  precio_id              text,
  periodo_inicio         timestamptz,
  periodo_fin            timestamptz,
  trial_fin              timestamptz default now() + interval '14 days',
  cancelar_al_periodo    boolean default false,
  created_at             timestamptz not null default now(),
  unique (taller_id)
);

create index if not exists idx_suscripciones_taller_id on public.suscripciones(taller_id);

-- ── PORTAL_TOKENS ─────────────────────────────────────────────────────────────
create table if not exists public.portal_tokens (
  id         uuid primary key default uuid_generate_v4(),
  token      uuid not null default uuid_generate_v4(),
  orden_id   uuid not null references public.ordenes(id) on delete cascade,
  taller_id  uuid not null references public.talleres(id) on delete cascade,
  expires_at timestamptz not null default now() + interval '7 days',
  created_at timestamptz not null default now(),
  unique (token)
);

-- Si la tabla ya existía sin el default en expires_at, se lo añadimos
alter table public.portal_tokens
  alter column expires_at set default now() + interval '7 days';

create index if not exists idx_portal_tokens_token    on public.portal_tokens(token);
create index if not exists idx_portal_tokens_orden_id on public.portal_tokens(orden_id);

-- ── PUSH_SUSCRIPCIONES ────────────────────────────────────────────────────────
create table if not exists public.push_suscripciones (
  id          uuid primary key default uuid_generate_v4(),
  usuario_id  uuid not null references public.usuarios(id) on delete cascade,
  taller_id   uuid not null references public.talleres(id) on delete cascade,
  endpoint    text not null,
  keys        jsonb not null,
  created_at  timestamptz not null default now(),
  unique (usuario_id, endpoint)
);

create index if not exists idx_push_suscripciones_taller_id on public.push_suscripciones(taller_id);

-- ── Trigger: crear suscripción al registrar taller ────────────────────────────
-- Actualizar la función para que también inserte en suscripciones
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  nuevo_taller_id uuid;
begin
  -- 1. Crear un taller por defecto para el nuevo usuario
  insert into public.talleres (nombre, plan)
  values ('Mi Taller', 'trial')
  returning id into nuevo_taller_id;

  -- 2. Crear el registro en usuarios vinculado al taller
  insert into public.usuarios (id, taller_id, nombre, email, rol)
  values (
    new.id,
    nuevo_taller_id,
    coalesce(new.raw_user_meta_data->>'nombre', split_part(new.email, '@', 1)),
    new.email,
    'propietario'
  );

  -- 3. Crear la suscripción en trial con fecha de vencimiento a 14 días
  insert into public.suscripciones (taller_id, plan, estado, trial_fin)
  values (nuevo_taller_id, 'trial', 'activa', now() + interval '14 days')
  on conflict (taller_id) do nothing;

  return new;
end;
$$;

-- Backfill: crear suscripción para talleres existentes que no la tengan
insert into public.suscripciones (taller_id, plan, estado, trial_fin)
select t.id, 'trial', 'activa', now() + interval '14 days'
from public.talleres t
where not exists (
  select 1 from public.suscripciones s where s.taller_id = t.id
)
on conflict (taller_id) do nothing;
