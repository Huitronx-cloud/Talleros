-- El enlace propio del vehículo: la libreta de servicio del coche.
--
-- El portal del cliente apunta a UNA orden y dura 7 días. Esto es otra cosa:
-- apunta al COCHE, no caduca, y el cliente lo guarda. Es lo que enseña cuando
-- vende el coche y el comprador pregunta qué mantenimientos lleva.
--
-- ── Por qué una columna y no otra tabla ─────────────────────────────────────
--
-- Un vehículo tiene como mucho un enlace, y el enlace no tiene vida propia:
-- nace con el coche y muere con él. Una tabla aparte solo añadiría un join y
-- una fila huérfana que limpiar. `portal_tokens` sí es tabla porque cada orden
-- puede acumular varios tokens caducados.
--
-- El token se genera SOLO cuando el taller pulsa compartir. Sin default: un
-- coche que nunca se compartió no tiene enlace que filtrar.
--
-- ── Qué sale y qué no ───────────────────────────────────────────────────────
--
-- Este enlace está pensado para pasárselo a un desconocido —el que compra el
-- coche—, así que lleva menos cosas que el portal, no más:
--
--   · NO sale el nombre del dueño. Si el coche cambia de manos, el comprador
--     no se lleva de regalo el nombre del dueño anterior. Decisión del dueño
--     del producto, 06/09/2026.
--   · NO sale el VIN. Es el documento de identidad del coche: con él se sacan
--     registros a nombre de otro. En un enlace que no caduca, menos aún.
--   · NO salen notas internas, diagnóstico ni mecánico asignado. El historial
--     es lo que se le hizo al coche, no cómo se organiza el taller por dentro.
--   · SÍ salen los importes, igual que en el portal: al vender el coche son la
--     prueba de lo que se invirtió y juegan a favor del dueño y del taller.
--   · Solo órdenes ENTREGADAS. Una en curso no tiene total final, y enseñar un
--     importe que todavía puede cambiar es peor que no enseñarlo.
--
-- ── Revocar ─────────────────────────────────────────────────────────────────
--
-- Poner el token a null mata el enlace. Es lo que se necesita si el cliente
-- pierde el móvil o vende el coche y quiere cortar el acceso. Después se puede
-- generar otro distinto.

alter table public.vehiculos
  add column if not exists historial_token text;

-- Único, pero con muchos nulos: un coche sin compartir no ocupa el hueco de
-- otro. En Postgres los nulos no chocan entre sí en un índice único.
create unique index if not exists vehiculos_historial_token_idx
  on public.vehiculos (historial_token)
  where historial_token is not null;

-- ── La función que lee el historial sin sesión ──────────────────────────────
--
-- security definer, igual que get_portal_data: quien abre el enlace es el
-- dueño del coche o alguien a quien se lo pasó, y no tiene cuenta. La RLS de
-- `vehiculos` exige taller_id = get_my_taller_id(), que sin sesión no resuelve.
--
-- La firma es `text` y no `uuid`, que es la lección que costó dos veces: los
-- tokens son hexadecimal, no UUIDs. Ver la 044 y la 056.
create or replace function public.get_historial_vehiculo(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_vehiculo_id uuid;
  v_result      jsonb;
begin
  select id into v_vehiculo_id
  from public.vehiculos
  where historial_token = p_token
    and historial_token is not null;

  -- Token inventado o revocado: no se distinguen, y está bien que no se
  -- distingan. Los dos son 404.
  if v_vehiculo_id is null then
    return null;
  end if;

  select jsonb_build_object(
    'vehiculo', jsonb_build_object(
                  'marca',  v.marca,
                  'modelo', v.modelo,
                  'anio',   v.anio,
                  'placas', v.placas
                ),
    'taller',   jsonb_build_object(
                  'nombre',    t.nombre,
                  'telefono',  t.telefono,
                  'logo_url',  t.logo_url,
                  'direccion', t.direccion
                ),
    'visitas',  coalesce((
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
                  where h.taller_id = v.taller_id
                    and h.estado    = 'entregado'
                    and (
                      h.vehiculo_id = v.id
                      -- La migración 051 solo pudo enlazar 70 órdenes por
                      -- placas; las demás conservan las suyas sin enlace. Sin
                      -- esta rama, a un coche con cuatro visitas le saldrían
                      -- dos y parecería que el taller perdió su historial.
                      or (
                        v.placas is not null and h.placas is not null
                        and upper(regexp_replace(h.placas, '[^A-Za-z0-9]', '', 'g'))
                          = upper(regexp_replace(v.placas, '[^A-Za-z0-9]', '', 'g'))
                      )
                    )
                ), '[]'::jsonb)
  )
  into v_result
  from public.vehiculos v
  left join public.talleres t on t.id = v.taller_id
  where v.id = v_vehiculo_id;

  return v_result;
end;
$$;

grant execute on function public.get_historial_vehiculo(text) to anon, authenticated;
