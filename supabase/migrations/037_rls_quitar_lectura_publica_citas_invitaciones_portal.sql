-- ── RLS: quitar políticas "using (true)" que exponen datos entre talleres ────
-- citas / citas_config / portal_tokens necesitan ser leíbles sin sesión
-- (páginas públicas de agendar cita y de seguimiento del cliente), pero su
-- política actual es `using (true)`, lo que las deja abiertas vía la API de
-- PostgREST a CUALQUIERA con la anon key (no solo a la query que hace la
-- app): cualquiera puede pedir `select=*` y leer teléfonos/emails/nombres de
-- clientes y citas de TODOS los talleres, no solo del taller que está
-- consultando. invitaciones tiene el mismo problema pero ni siquiera se usa
-- (todo el código que lee `invitaciones` ya usa el service role).
--
-- Se reemplazan por funciones SECURITY DEFINER parametrizadas por el dato
-- público que ya actúa como llave (taller_id o token), igual que ya se hace
-- con get_taller_para_pdf para las páginas de PDF.

drop policy if exists "citas: lectura publica por taller_id" on public.citas;
drop policy if exists "citas_config: lectura publica"        on public.citas_config;
drop policy if exists "invitaciones: lectura publica por token" on public.invitaciones;
drop policy if exists "portal_tokens: lectura publica por token" on public.portal_tokens;

-- ── Agenda pública de citas ──────────────────────────────────────────────────
-- Solo expone fecha/hora (para marcar horarios ocupados), nunca datos del
-- cliente.
create or replace function public.get_citas_ocupadas_publicas(
  p_taller_id uuid,
  p_desde     date,
  p_hasta     date
)
returns table (fecha date, hora time)
language sql
security definer
set search_path = public
as $$
  select fecha, hora
  from public.citas
  where taller_id = p_taller_id
    and fecha between p_desde and p_hasta
    and estado <> 'cancelada';
$$;

grant execute on function public.get_citas_ocupadas_publicas(uuid, date, date) to anon, authenticated;

create or replace function public.get_citas_config_publica(p_taller_id uuid)
returns public.citas_config
language sql
security definer
set search_path = public
as $$
  select * from public.citas_config where taller_id = p_taller_id limit 1;
$$;

grant execute on function public.get_citas_config_publica(uuid) to anon, authenticated;

-- El formulario público de agendar cita (app/citas/[tallerId]) inserta la
-- cita sin sesión: cualquiera con el link del taller puede agendar, por
-- diseño (es el equivalente a llamar por teléfono). No es un leak de
-- información porque un INSERT no puede leer datos de otros talleres, solo
-- crear una fila nueva — se deja explícita en migraciones para que no
-- dependa de una política creada fuera de control de versiones.
drop policy if exists "citas: insert publico" on public.citas;
create policy "citas: insert publico"
  on public.citas for insert
  with check (true);

-- ── Portal de seguimiento del cliente ────────────────────────────────────────
-- Valida el token (y que no haya expirado) y devuelve solo lo que la página
-- del portal necesita mostrar: nada de notas_internas ni otros datos del
-- taller fuera de lo que ya se mostraba.
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
