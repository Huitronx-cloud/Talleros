-- ── El portal del cliente devolvía 404 en TODOS los enlaces ──────────────────
--
-- `get_portal_data` se creó en la migración 037 con la firma `p_token uuid`,
-- copiada de cómo define la tabla la migración 024:
--
--     token uuid not null default uuid_generate_v4()
--
-- Pero esa definición nunca se aplicó. La 024 usa `create table if not exists`
-- y `portal_tokens` ya existía en la base con otra forma:
--
--     token text not null default encode(gen_random_bytes(32), 'hex')
--
-- Así que los tokens reales son 64 caracteres hexadecimales, no UUIDs. Cada
-- llamada desde /portal/[token] le pasaba ese texto a una función que espera
-- uuid, Postgres la rechazaba antes de ejecutarla, y la página —que ignoraba el
-- error y solo miraba si venían datos— respondía 404. Todos los enlaces del
-- portal, de todos los talleres, desde que se aplicó la 037.
--
-- Aquí se alinea la función con la columna que existe de verdad. No se toca la
-- tabla: cambiar la columna a uuid invalidaría los tokens ya repartidos por
-- WhatsApp, que es justo lo que se quiere evitar.
--
-- De paso se distingue "el enlace expiró" de "el enlace no existe". Los tokens
-- duran 7 días, así que un cliente que abre un enlace viejo es un caso normal,
-- no un error: merece una explicación en vez de un 404 a secas.

drop function if exists public.get_portal_data(uuid);

create or replace function public.get_portal_data(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_orden_id uuid;
  v_expirado boolean;
  v_result   jsonb;
begin
  select orden_id, expires_at <= now()
    into v_orden_id, v_expirado
  from public.portal_tokens
  where token = p_token;

  -- El token no existe: no se distingue de uno inventado, 404 legítimo.
  if v_orden_id is null then
    return null;
  end if;

  -- El token es real pero caducó: la página lo explica y ofrece pedir otro.
  if v_expirado then
    return jsonb_build_object('expirado', true);
  end if;

  select jsonb_build_object(
    'orden',   to_jsonb(o) - 'notas_internas',
    'cliente', jsonb_build_object('nombre', c.nombre, 'telefono', c.telefono),
    'taller',  jsonb_build_object(
                 'nombre',    t.nombre,
                 'telefono',  t.telefono,
                 'logo_url',  t.logo_url,
                 'horario',   t.horario,
                 'instagram', t.instagram,
                 'facebook',  t.facebook,
                 'direccion', t.direccion
               ),
    'fotos',   coalesce((
                 select jsonb_agg(to_jsonb(f) order by f.created_at asc)
                 from public.fotos_diagnostico f
                 where f.orden_id = o.id
               ), '[]'::jsonb)
  )
  into v_result
  from public.ordenes o
  left join public.clientes c on c.id = o.cliente_id
  left join public.talleres t on t.id = o.taller_id
  where o.id = v_orden_id;

  return v_result;
end;
$$;

grant execute on function public.get_portal_data(text) to anon, authenticated;
