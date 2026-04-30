-- ── Insertar taller y usuario para el usuario ya registrado ──────────────────
-- Reemplaza 'tu@email.com' con tu email real antes de ejecutar

do $$
declare
  auth_user_id uuid;
  nuevo_taller_id uuid;
begin
  -- Buscar el id del usuario en auth.users por email
  select id into auth_user_id
  from auth.users
  where email = 'tu@email.com'  -- ← cambia esto
  limit 1;

  if auth_user_id is null then
    raise exception 'No se encontró el usuario con ese email';
  end if;

  -- Verificar si ya tiene un registro en usuarios
  if exists (select 1 from public.usuarios where id = auth_user_id) then
    raise notice 'El usuario ya tiene un registro en usuarios';
    return;
  end if;

  -- Crear taller
  insert into public.talleres (nombre, plan)
  values ('Mi Taller', 'gratis')
  returning id into nuevo_taller_id;

  -- Crear usuario
  insert into public.usuarios (id, taller_id, nombre, email, rol)
  values (
    auth_user_id,
    nuevo_taller_id,
    split_part('tu@email.com', '@', 1),  -- ← cambia esto también
    'tu@email.com',                        -- ← y esto
    'propietario'
  );

  raise notice 'Taller y usuario creados correctamente';
end;
$$;
