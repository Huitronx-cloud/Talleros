-- ─────────────────────────────────────────────────────────────────────────────
-- Las monedas dejan de estar limitadas a México y Colombia
--
-- La migración 006 puso `check (moneda in ('MXN','COP'))` en dos sitios:
-- talleres.moneda y cotizaciones.moneda. Desde entonces:
--
--   - El selector de Configuración ofrece 16 monedas, pero la base solo acepta
--     dos: un taller argentino que eligiera ARS recibía un error de la base.
--   - Y como el alta nunca escribía `moneda`, los 21 talleres de fuera de
--     México se quedaban en MXN sin que nadie lo notara.
--
-- La lista de aquí es la misma que la del selector y la de CURRENCY_CONFIG en
-- lib/utils.ts. Si se añade una moneda al producto, se añade en los tres sitios.
--
-- Ejecutar en: Supabase > SQL Editor
-- Va ANTES de migraciones-datos/001_moneda_por_pais.sql, que es el relleno de
-- los talleres que ya existen: sin esta, aquel update falla en la primera fila
-- argentina.
-- ─────────────────────────────────────────────────────────────────────────────

-- Las restricciones de la 006 se declararon en línea, sin nombre, así que el
-- que tienen se lo puso Postgres. Adivinarlo y equivocarse sería peor que no
-- hacer nada: el `drop` no encontraría nada, la nueva restricción se añadiría
-- al lado, y la vieja seguiría rechazando ARS. Por eso se buscan por lo que
-- son —restricciones CHECK sobre la columna `moneda`— y no por su nombre.
do $$
declare
  r record;
  monedas constant text :=
    '''MXN'',''COP'',''ARS'',''CLP'',''PEN'',''GTQ'',''CRC'',''DOP'','
    '''BOB'',''PYG'',''UYU'',''HNL'',''NIO'',''USD'',''CAD'',''EUR''';
begin
  for r in
    select rel.relname as tabla, con.conname as nombre
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace ns on ns.oid = rel.relnamespace
    where ns.nspname = 'public'
      and rel.relname in ('talleres', 'cotizaciones')
      and con.contype = 'c'
      and pg_get_constraintdef(con.oid) ilike '%moneda%'
  loop
    execute format('alter table public.%I drop constraint %I', r.tabla, r.nombre);
    raise notice 'Restricción retirada: %.%', r.tabla, r.nombre;
  end loop;

  execute format(
    'alter table public.talleres add constraint talleres_moneda_check check (moneda in (%s))',
    monedas);
  execute format(
    'alter table public.cotizaciones add constraint cotizaciones_moneda_check check (moneda in (%s))',
    monedas);
end $$;

-- Comprobar que quedaron las dos, y solo las dos, con la lista nueva.
select rel.relname as tabla, con.conname as restriccion,
       pg_get_constraintdef(con.oid) as definicion
from pg_constraint con
join pg_class rel on rel.oid = con.conrelid
join pg_namespace ns on ns.oid = rel.relnamespace
where ns.nspname = 'public'
  and rel.relname in ('talleres', 'cotizaciones')
  and con.contype = 'c'
  and pg_get_constraintdef(con.oid) ilike '%moneda%'
order by tabla;
