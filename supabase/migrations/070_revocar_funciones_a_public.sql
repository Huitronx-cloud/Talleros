-- Cierra de verdad las funciones que no deberían ser públicas.
--
-- ── Por qué hace falta esta migración ──────────────────────────────────────
--
-- La 069 terminaba con:
--
--   revoke execute on function public.get_taller_para_pdf(uuid) from anon;
--
-- Y no sirvió de nada. En Postgres, toda función nace con EXECUTE concedido a
-- PUBLIC, y `anon` lo hereda de ahí. Revocarle a `anon` su permiso propio deja
-- el de PUBLIC intacto, así que sigue pudiendo llamarla.
--
-- Se vio en el ACL de la función:
--
--   =X/postgres | postgres=X/postgres | authenticated=X/postgres | ...
--    ↑ ese primer registro sin nombre delante ES PUBLIC
--
-- Y la comprobación lo confirmó: `select get_taller_para_pdf('uuid-inventado')`
-- como anon devolvía null —la función ejecutándose y no encontrando taller— en
-- vez de "permission denied".
--
-- Lo que la 069 SÍ arregló, que era lo urgente: la función dejó de devolver la
-- fila completa, así que los tokens de Google ya no salen. Esto es la segunda
-- cerradura.
--
-- ── Qué se cierra y qué no ─────────────────────────────────────────────────
--
-- Se cierran las cuatro que no tienen por qué ser públicas. Las tres de
-- contadores además ESCRIBEN: siguiente_numero_orden incrementa el contador de
-- cualquier taller, y quien la llamara en bucle dejaba a un taller con su
-- próxima orden en el número noventa mil.
--
-- Los llamadores se comprobaron uno por uno y todos van con sesión o con rol de
-- servicio:
--
--   ordenes/actions.ts:153       siguiente_numero_orden       (authenticated)
--   cotizaciones/actions.ts:33   siguiente_numero_cotizacion  (authenticated)
--   clientes/actions.ts:190      reiniciar_contador_orden     (authenticated)
--   lib/datos-ejemplo.ts:94      siguiente_numero_orden       (service_role)
--   + las dos rutas de PDF y ordenes/actions.ts  get_taller_para_pdf (authenticated)
--
-- NO se tocan, porque son el portal del cliente y la página pública de
-- reservas, y tienen que seguir abiertas:
--
--   get_portal_data, get_historial_vehiculo,
--   get_citas_config_publica, get_citas_ocupadas_publicas
--
-- NO se toca `get_my_taller_id()` aunque el linter la señale: la usan las
-- políticas de RLS, y esas se evalúan también para visitantes anónimos cuando
-- alguien abre la página pública de un taller. Quitarle el permiso a anon
-- convertiría un "no cumple la política" en un error de permisos y tiraría la
-- página de reservas. Devuelve null para quien no tiene sesión, que es
-- exactamente lo que debe hacer.
--
-- NO se tocan `crear_suscripcion_trial()` ni `handle_new_user()`: son funciones
-- de trigger y Postgres las rechaza si se llaman por RPC. Comprobado:
--   ERROR: 0A000: trigger functions can only be called as triggers
-- Son ruido del linter, y tocar handle_new_user arriesgaría el registro.

revoke execute on function public.get_taller_para_pdf(uuid)         from public, anon;
revoke execute on function public.siguiente_numero_orden(uuid)      from public, anon;
revoke execute on function public.siguiente_numero_cotizacion(uuid) from public, anon;
revoke execute on function public.reiniciar_contador_orden(uuid)    from public, anon;

-- Explícito y no heredado. Revocar a PUBLIC quita el permiso de debajo de todo
-- el mundo, así que a quien sí debe poder llamarlas se le concede por su
-- nombre. Es idempotente: si ya lo tenían, no cambia nada.
grant execute on function public.get_taller_para_pdf(uuid)         to authenticated, service_role;
grant execute on function public.siguiente_numero_orden(uuid)      to authenticated, service_role;
grant execute on function public.siguiente_numero_cotizacion(uuid) to authenticated, service_role;
grant execute on function public.reiniciar_contador_orden(uuid)    to authenticated, service_role;

-- Verificación (correr aparte):
--
--   select p.proname,
--          has_function_privilege('anon', p.oid, 'EXECUTE')          as anon_puede,
--          has_function_privilege('authenticated', p.oid, 'EXECUTE') as auth_puede
--   from pg_proc p join pg_namespace n on n.oid = p.pronamespace
--   where n.nspname = 'public'
--     and p.proname in ('get_taller_para_pdf','siguiente_numero_orden',
--                       'siguiente_numero_cotizacion','reiniciar_contador_orden',
--                       'get_portal_data','get_historial_vehiculo')
--   order by p.proname;
--
-- Las cuatro primeras: anon_puede = false, auth_puede = true.
-- get_portal_data y get_historial_vehiculo: las DOS en true — si salen en false
-- se rompió el portal del cliente.
