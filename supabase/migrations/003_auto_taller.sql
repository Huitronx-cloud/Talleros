-- ── Trigger: crear taller + usuario automáticamente al registrarse ────────────
-- Se ejecuta cuando Supabase Auth crea un nuevo usuario en auth.users

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
  values ('Mi Taller', 'gratis')
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

  return new;
end;
$$;

-- Eliminar el trigger si ya existe (para poder re-ejecutar el script)
drop trigger if exists on_auth_user_created on auth.users;

-- Crear el trigger en auth.users
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
