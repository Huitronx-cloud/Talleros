-- ── El portal volvió a devolver 404 en todos los enlaces ────────────────────
--
-- La migración 054 escribió `get_portal_data(p_token uuid)`. La firma correcta
-- es `text`, y lo era desde la 044, que existe precisamente para arreglar este
-- mismo fallo: los tokens de `portal_tokens` son 64 caracteres hexadecimales,
-- no UUIDs, porque la tabla se creó con
--
--     token text not null default encode(gen_random_bytes(32), 'hex')
--
-- Y `create or replace` con otra firma no reemplaza nada: crea una función
-- nueva al lado. Así que la base quedó con dos:
--
--   · get_portal_data(text) — la buena, sin historial
--   · get_portal_data(uuid) — la de la 054, con historial, imposible de llamar
--     con un token real
--
-- Dos candidatas con el mismo nombre y el mismo argumento con nombre, y la
-- llamada del portal ya no resuelve a ninguna. Cada enlace que el taller manda
-- por WhatsApp acaba en 404 — el mismo síntoma que la 044, por una causa
-- distinta, reintroducido por mí al añadir el historial.
--
-- Aquí se borra la de uuid y se deja UNA sola función, con firma text, que
-- junta las dos cosas: el aviso de enlace caducado que trajo la 044 y el
-- historial del vehículo que trajo la 054. La 054 se había dejado el aviso por
-- el camino: devolvía null al caducar, o sea 404 otra vez en vez de la
-- explicación.

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
               ), '[]'::jsonb),
    -- Visitas anteriores del mismo coche. Se busca por el enlace con el
    -- vehículo O por placas normalizadas: la migración 051 solo pudo enlazar
    -- 70 órdenes, y buscando solo por vehiculo_id a un cliente con cuatro
    -- visitas le saldrían dos y pensaría que el taller perdió su historial.
    --
    -- Solo órdenes ENTREGADAS: una en curso no tiene total final, y enseñar un
    -- importe que todavía puede cambiar es peor que no enseñarlo. Y se excluye
    -- la orden actual, que ya se ve completa arriba.
    'historial', coalesce((
                 select jsonb_agg(
                          jsonb_build_object(
                            'id',          h.id,
                            'fecha',       coalesce(h.fecha_entrega, h.fecha_entrada),
                            'kilometraje', h.kilometraje,
                            'total',       h.total,
                            'servicios',   h.servicios_realizados
                          )
                          order by coalesce(h.fecha_entrega, h.fecha_entrada) desc
                        )
                 from public.ordenes h
                 where h.taller_id = o.taller_id
                   and h.id       <> o.id
                   and h.estado    = 'entregado'
                   and (
                     (o.vehiculo_id is not null and h.vehiculo_id = o.vehiculo_id)
                     or (
                       o.placas is not null and h.placas is not null
                       and upper(regexp_replace(h.placas, '[^A-Za-z0-9]', '', 'g'))
                         = upper(regexp_replace(o.placas, '[^A-Za-z0-9]', '', 'g'))
                     )
                   )
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
