-- El VIN decodificado, guardado una vez y aprovechado por todos.
--
-- Un VIN identifica un coche concreto y se decodifica igual sea quien sea el
-- que pregunte, así que esta tabla NO lleva taller_id: si un taller de Puebla
-- consulta un Jetta, el de Monterrey que reciba ese mismo coche —o uno del
-- mismo lote— ya no tiene que volver a preguntar. Es la única tabla del
-- proyecto compartida entre talleres, y es a propósito.
--
-- ── Qué se guarda ───────────────────────────────────────────────────────────
--
-- Las columnas sueltas son las que se enseñan en pantalla. `datos` guarda la
-- respuesta entera ya ordenada, para poder sacar más campos en el futuro sin
-- volver a llamar a NHTSA por coches que ya preguntamos.
--
-- `limpio` viene del ErrorCode de NHTSA: "0" significa que decodificó el VIN
-- entero sin dudas. Cualquier otro código significa que rellenó lo que pudo, y
-- entonces la pantalla lo marca para que el mecánico verifique. Esto no se
-- puede deducir mirando si los campos vienen llenos: probando con coches
-- reales, un Jetta con ErrorCode "5,14" trajo el motor perfecto ("1.4 TSI") y
-- una NP300 con el MISMO código trajo una cilindrada equivocada.
--
-- ── Quién puede escribir ────────────────────────────────────────────────────
--
-- Solo el servidor, con service role. Si los talleres pudieran insertar, uno
-- podría envenenar el caché que usan todos los demás — y como aquí no hay
-- taller_id que acote el daño, sería un dato falso para toda la plataforma.
-- Leer sí puede cualquiera con sesión.

create table if not exists public.vin_cache (
  vin           text primary key check (length(vin) = 17),
  marca         text,
  modelo        text,
  anio          integer,
  motor         text,
  version       text,
  transmision   text,
  traccion      text,
  carroceria    text,
  rin           text,
  fabricante    text,
  planta        text,
  -- NHTSA decodificó sin dudas (su ErrorCode "0").
  limpio        boolean not null default false,
  -- La respuesta útil completa, por si mañana queremos más campos.
  datos         jsonb,
  origen        text not null default 'nhtsa',
  consultado_at timestamptz not null default now()
);

alter table public.vin_cache enable row level security;

drop policy if exists "vin_cache: lectura con sesion" on public.vin_cache;
create policy "vin_cache: lectura con sesion"
  on public.vin_cache for select
  to authenticated
  using (true);

-- Sin políticas de insert ni update a propósito: escribe la ruta de API con
-- service role, que se salta la RLS. Lo que no existe no se puede abusar.
