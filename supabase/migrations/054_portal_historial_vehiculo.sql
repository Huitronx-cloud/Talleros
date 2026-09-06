-- El historial del coche dentro del portal que el cliente ya recibe.
--
-- Hasta ahora el portal enseñaba UNA orden: el token apunta a esa y a ninguna
-- más. El taller tenía la historia completa del vehículo —la pantalla existe
-- desde hace tiempo— y el dueño del coche no podía verla.
--
-- Se añade aquí, en la misma función, y no en un endpoint aparte, por una
-- razón concreta: así hereda la validación que ya funciona. El token se
-- comprueba una vez, incluida su caducidad, y el historial no puede salir por
-- un camino que no pase por ahí.
--
-- ── Por qué la condición del vehículo tiene dos ramas ───────────────────────
--
-- La migración 051 enlazó las órdenes con su vehículo comparando placas, y
-- cuadraron 70. Las demás siguen teniendo sus datos del coche pero sin enlace.
-- Buscando solo por `vehiculo_id`, a un cliente con cuatro visitas le saldrían
-- dos y pensaría que el taller perdió su historial — justo lo contrario de lo
-- que esto busca. Por eso se busca por el enlace O por placas normalizadas,
-- igual que hace la pantalla del taller.
--
-- ── Qué NO sale ────────────────────────────────────────────────────────────
--
-- Solo órdenes ENTREGADAS: una en curso no tiene total final, y enseñar un
-- importe que todavía puede cambiar es peor que no enseñarlo. Y se excluye la
-- orden actual, que ya se ve completa arriba.
--
-- De cada visita salen fecha, kilometraje, total y los servicios. Nada de
-- notas internas, diagnóstico ni mecánico asignado: el historial es lo que se
-- le hizo al coche, no cómo se organizó el taller por dentro.

create or replace function public.get_portal_data(p_token uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_orden_id uuid;
  v_result   jsonb;
begin
  select orden_id into v_orden_id
  from public.portal_tokens
  where token = p_token
    and expires_at > now();

  if v_orden_id is null then
    return null;
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

grant execute on function public.get_portal_data(uuid) to anon, authenticated;
