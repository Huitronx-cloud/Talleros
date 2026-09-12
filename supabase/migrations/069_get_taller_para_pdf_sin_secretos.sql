-- CRÍTICO: get_taller_para_pdf entregaba la fila completa del taller a cualquiera.
--
-- ── Lo que pasaba ──────────────────────────────────────────────────────────
--
-- La función es SECURITY DEFINER —salta RLS por diseño— y la podía ejecutar el
-- rol `anon`, o sea cualquiera con la clave pública, que por diseño va en el
-- navegador. Y hacía esto:
--
--   select row_to_json(t) from public.talleres t where t.id = p_taller_id
--
-- `row_to_json(t)` son las 29 columnas de la tabla. Entre ellas:
--
--   google_access_token, google_refresh_token  → las llaves de la cuenta de
--                                                 Google del taller
--   firma_pdf                                  → la firma del dueño
--   email, telefono, direccion
--
-- Y el id del taller no es un secreto: va en la URL de la página pública de
-- reservas (/citas/<tallerId>). Cualquiera que viera esa dirección podía pedir
-- la fila entera.
--
-- Comprobado como `anon` contra un taller real antes de escribir esto: 29
-- campos devueltos, con google_access_token y firma_pdf incluidos.
--
-- Lo único que lo salvaba hoy es que ningún taller ha conectado Google todavía,
-- así que esos dos campos están vacíos. El día que uno conectara, su token
-- quedaba expuesto — y acabamos de hacer las reseñas mucho más fáciles de
-- configurar.
--
-- ── Los ocho campos ────────────────────────────────────────────────────────
--
-- Salen de mirar qué usa CADA llamador, no de suponer:
--
--   lib/pdf/orden-documento.tsx      nombre, direccion, telefono, email, logo_url
--   lib/pdf/cotizacion-documento.tsx los mismos + firma_pdf
--   ordenes/actions.ts               nombre, pais, moneda
--
-- El primer borrador llevaba seis y se habría comido `moneda`: el aviso de
-- "su vehículo está listo" habría formateado el importe en dólares para un
-- taller mexicano, sin fallar ni avisar.
--
-- ── Sobre el `create or replace` ───────────────────────────────────────────
--
-- La firma y el tipo de retorno son idénticos —(uuid) returns json—, así que
-- esto REEMPLAZA la función. No crea una sobrecarga. Es la lección de la
-- migración 054, donde cambiar un parámetro de text a uuid dejó dos funciones
-- vivas y tiró el portal de todos los talleres.

create or replace function public.get_taller_para_pdf(p_taller_id uuid)
returns json
language sql
stable
security definer
-- De paso se le fija el search_path, que también estaba suelto. Una función
-- SECURITY DEFINER sin él puede ser desviada por quien logre crear objetos en
-- un esquema del camino de búsqueda.
set search_path to 'public'
as $$
  select json_build_object(
    'nombre',    t.nombre,
    'direccion', t.direccion,
    'telefono',  t.telefono,
    'email',     t.email,
    'logo_url',  t.logo_url,
    'firma_pdf', t.firma_pdf,
    'pais',      t.pais,
    'moneda',    t.moneda
  )
  from public.talleres t
  where t.id = p_taller_id
  limit 1;
$$;

-- Segunda cerradura. Aunque la función ya no devuelva secretos, no tiene por
-- qué poder llamarla quien no ha iniciado sesión: los cuatro sitios que la usan
-- —las dos rutas de PDF y las dos llamadas de ordenes/actions.ts— van todos con
-- sesión, así que esto no rompe ninguno.
revoke execute on function public.get_taller_para_pdf(uuid) from anon;

-- Verificación (correr aparte):
--
--   set local role anon;
--   select public.get_taller_para_pdf('00000000-0000-0000-0000-000000000000');
--   -- debe fallar con "permission denied for function"
