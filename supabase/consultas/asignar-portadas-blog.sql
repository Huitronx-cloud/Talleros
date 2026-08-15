-- ═══════════════════════════════════════════════════════════════════════════
-- Asignar portada a los artículos del blog que no tienen
-- ═══════════════════════════════════════════════════════════════════════════
--
-- De 77 artículos publicados, 76 tienen imagen_url en null. Las 23 portadas
-- 16:9 están en public/blog/ desde el PR #60 y el código ya las renderiza en la
-- lista, en el artículo, en Open Graph y en el JSON-LD — pero NADA en el
-- repositorio escribe esa columna. La migración 043 la creó, cuatro sitios la
-- leen, y el cable entre ambas cosas nunca se conectó.
--
-- Consecuencia hoy: el blog se ve pelado y cada artículo compartido en WhatsApp
-- sale con la imagen genérica del sitio en vez de una propia.
--
-- Hay 23 imágenes para 77 artículos, así que se repiten. Una portada repetida
-- es mejor que ninguna para cómo se ve al compartir; si algún día hay más
-- imágenes, basta con volver a correr esto sobre las que sigan en null.
--
-- Cómo se elige: primero por tema, buscando palabras en el slug (whatsapp →
-- mecánico con celular, frenos → discos y balatas, etc.). Lo que no casa con
-- ninguna regla se reparte de forma rotatoria entre las 23, para que quede
-- variado y no todas iguales.
--
-- SOLO toca filas con imagen_url null, así que respeta la que ya tenías puesta
-- a mano y se puede correr otra vez sin deshacer nada.
--
-- Para deshacerlo entero:
--   update public.articulos_blog set imagen_url = null where publicado;
--   (ojo: eso también borra la que pusiste a mano)
--
-- ── PASO 1: ver qué haría, sin cambiar nada ────────────────────────────────
-- Cambia la palabra "update" del final por un select para previsualizar, o
-- corre esto:
--
--   with x as ( ...mismos CTE... ) select slug, url from x order by slug;
--
-- ── PASO 2: aplicarlo ──────────────────────────────────────────────────────

with imagenes(i, url) as (values
  ( 1, '/blog/alineacion-computarizada-portada.webp'),
  ( 2, '/blog/caja-herramientas-portada.webp'),
  ( 3, '/blog/carro-en-rampa-portada.webp'),
  ( 4, '/blog/escaner-diagnostico-portada.webp'),
  ( 5, '/blog/fachada-el-barrio-portada.webp'),
  ( 6, '/blog/fachada-el-sol-noche-portada.webp'),
  ( 7, '/blog/fachada-santa-fe-noche-portada.webp'),
  ( 8, '/blog/frenos-discos-balatas-portada.webp'),
  ( 9, '/blog/mecanico-rampa-celular-portada.webp'),
  (10, '/blog/mostrador-tablet-ordenes-portada.webp'),
  (11, '/blog/motor-turbo-portada.webp'),
  (12, '/blog/pared-de-llaves-portada.webp'),
  (13, '/blog/pasillo-refacciones-portada.webp'),
  (14, '/blog/recepcion-certificados-portada.webp'),
  (15, '/blog/sala-de-espera-portada.webp'),
  (16, '/blog/suspension-vista-inferior-portada.webp'),
  (17, '/blog/taller-abierto-computadora-portada.webp'),
  (18, '/blog/taller-autos-deportivos-portada.webp'),
  (19, '/blog/taller-banco-tablet-portada.webp'),
  (20, '/blog/taller-barrio-lleno-portada.webp'),
  (21, '/blog/taller-clasicos-portada.webp'),
  (22, '/blog/taller-moderno-rampas-portada.webp'),
  (23, '/blog/transmision-engranes-portada.webp')
),

-- Orden = prioridad. La primera regla que case con el slug gana, así que las
-- más específicas van arriba.
reglas(orden, patron, url) as (values
  ( 1, 'whatsapp',      '/blog/mecanico-rampa-celular-portada.webp'),
  ( 2, 'resena',        '/blog/recepcion-certificados-portada.webp'),
  ( 3, 'freno',         '/blog/frenos-discos-balatas-portada.webp'),
  ( 4, 'transmision',   '/blog/transmision-engranes-portada.webp'),
  ( 5, 'suspension',    '/blog/suspension-vista-inferior-portada.webp'),
  ( 6, 'alineacion',    '/blog/alineacion-computarizada-portada.webp'),
  ( 7, 'diagnostico',   '/blog/escaner-diagnostico-portada.webp'),
  ( 8, 'escaner',       '/blog/escaner-diagnostico-portada.webp'),
  ( 9, 'motor',         '/blog/motor-turbo-portada.webp'),
  (10, 'inventario',    '/blog/pasillo-refacciones-portada.webp'),
  (11, 'refaccion',     '/blog/pasillo-refacciones-portada.webp'),
  (12, 'herramienta',   '/blog/caja-herramientas-portada.webp'),
  (13, 'orden',         '/blog/mostrador-tablet-ordenes-portada.webp'),
  (14, 'kanban',        '/blog/mostrador-tablet-ordenes-portada.webp'),
  (15, 'cotiza',        '/blog/mostrador-tablet-ordenes-portada.webp'),
  (16, 'cliente',       '/blog/sala-de-espera-portada.webp'),
  (17, 'fidelizar',     '/blog/sala-de-espera-portada.webp'),
  (18, 'precio',        '/blog/taller-banco-tablet-portada.webp'),
  (19, 'tarifa',        '/blog/taller-banco-tablet-portada.webp'),
  (20, 'cobrar',        '/blog/taller-banco-tablet-portada.webp'),
  (21, 'ganar',         '/blog/taller-banco-tablet-portada.webp'),
  (22, 'rentab',        '/blog/taller-banco-tablet-portada.webp'),
  (23, 'flujo',         '/blog/taller-banco-tablet-portada.webp'),
  (24, 'margen',        '/blog/taller-banco-tablet-portada.webp'),
  (25, 'gastos',        '/blog/taller-banco-tablet-portada.webp'),
  (26, 'software',      '/blog/taller-abierto-computadora-portada.webp'),
  (27, 'sistema',       '/blog/taller-abierto-computadora-portada.webp'),
  (28, 'digitaliz',     '/blog/taller-abierto-computadora-portada.webp'),
  (29, 'excel',         '/blog/taller-abierto-computadora-portada.webp'),
  (30, 'papel',         '/blog/taller-abierto-computadora-portada.webp'),
  (31, 'marketing',     '/blog/fachada-el-sol-noche-portada.webp'),
  (32, 'redes',         '/blog/fachada-el-sol-noche-portada.webp'),
  (33, 'mecanico',      '/blog/taller-barrio-lleno-portada.webp'),
  (34, 'contratar',     '/blog/taller-barrio-lleno-portada.webp'),
  (35, 'delegar',       '/blog/taller-barrio-lleno-portada.webp'),
  (36, 'productividad', '/blog/taller-barrio-lleno-portada.webp'),
  (37, 'sucursal',      '/blog/taller-moderno-rampas-portada.webp'),
  (38, 'flotilla',      '/blog/taller-moderno-rampas-portada.webp'),
  (39, 'capacidad',     '/blog/taller-moderno-rampas-portada.webp'),
  (40, 'guadalajara',   '/blog/fachada-santa-fe-noche-portada.webp'),
  (41, 'monterrey',     '/blog/fachada-santa-fe-noche-portada.webp'),
  (42, 'cdmx',          '/blog/fachada-santa-fe-noche-portada.webp'),
  (43, 'bogota',        '/blog/fachada-el-barrio-portada.webp'),
  (44, 'medellin',      '/blog/fachada-el-barrio-portada.webp'),
  (45, 'lima',          '/blog/fachada-el-barrio-portada.webp'),
  (46, 'garantia',      '/blog/recepcion-certificados-portada.webp'),
  (47, 'vehiculo',      '/blog/carro-en-rampa-portada.webp'),
  (48, 'historial',     '/blog/pared-de-llaves-portada.webp')
),

pendientes as (
  select id, slug,
         row_number() over (order by published_at, id) - 1 as n
  from public.articulos_blog
  where publicado and imagen_url is null
),

elegidas as (
  select p.id,
         p.slug,
         coalesce(
           (select r.url from reglas r
             where p.slug like '%' || r.patron || '%'
             order by r.orden limit 1),
           (select i.url from imagenes i where i.i = (p.n % 23) + 1)
         ) as url
  from pendientes p
)

update public.articulos_blog a
   set imagen_url = e.url
  from elegidas e
 where a.id = e.id;

-- ── PASO 3: comprobar ──────────────────────────────────────────────────────
-- select count(*) filter (where imagen_url is not null) as con_imagen,
--        count(*) filter (where imagen_url is null)     as sin_imagen
--   from public.articulos_blog where publicado;
--
-- Debe quedar con_imagen = 77 y sin_imagen = 0.
