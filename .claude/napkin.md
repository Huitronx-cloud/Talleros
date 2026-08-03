# Napkin Runbook — TallerOS

Guía de ejecución para sesiones futuras. No es un historial: si algo deja de
ser útil o recurrente, se borra.

## Reglas de curación
- Reordenar por importancia en cada lectura.
- Solo notas recurrentes y de alto valor.
- Máximo 10 puntos por categoría.
- Cada punto lleva fecha y una línea "Hacer en su lugar".

## Ejecución y verificación (máxima prioridad)

1. **[2026-08-03] `next build` NO valida tipos**
   `next.config.mjs` tiene `ignoreBuildErrors: true` e `ignoreDuringBuilds: true`,
   así que "✓ Compiled successfully" no dice nada sobre TypeScript.
   Hacer en su lugar: `npx tsc --noEmit`. El repo arrastra **19 errores previos**;
   comparar el total antes y después para saber si añadiste alguno.

2. **[2026-08-03] Las migraciones van ANTES del merge**
   Fusionar a `main` dispara el deploy de producción en Vercel. Si el código
   consulta una columna que aún no existe, tumba las pantallas de todos.
   Hacer en su lugar: pasarle el SQL al usuario, esperar confirmación de que lo
   corrió, y solo entonces fusionar.

3. **[2026-08-03] La rama diverge tras cada squash merge**
   La PR sale `mergeable_state: dirty` porque la rama conserva los commits que
   en `main` entraron aplastados en uno.
   Hacer en su lugar: comprobar que los árboles coinciden
   (`git diff --stat <ultimo-commit-fusionado> origin/main` vacío) y rebasar con
   `git rebase --onto origin/main <ultimo-commit-fusionado> <rama>`.

4. **[2026-08-03] El build local falla en 4 páginas de auth y es normal**
   `/login`, `/registro`, `/nueva-password` y `/recuperar-password` fallan al
   exportar por falta de variables de Supabase. No es una regresión.
   Hacer en su lugar: darlo por esperado; comprobar solo `Compiled successfully`.

5. **[2026-08-03] Supabase MCP y los registros de build de Vercel piden aprobación**
   No se pueden usar en sesiones no interactivas.
   Hacer en su lugar: leer el esquema en `supabase/migrations/`, y seguir el
   estado del deploy con `get_deployment` (`state: READY` + `aliasError: null`).

## Fiabilidad de comandos

1. **[2026-08-03] `pkill -f "next dev"` mata la propia shell**
   Devuelve 144 y aborta todo lo encadenado después con `&&`. Ya provocó que un
   commit no llegara a ejecutarse.
   Hacer en su lugar: lanzar el `pkill` solo, en su propia llamada.

2. **[2026-08-03] El proxy deniega los dominios del propio producto**
   `tallerosapp.com` y `*.vercel.app` dan 403 en el CONNECT.
   Hacer en su lugar: verificar contra un servidor local y **decirle al usuario
   que no se comprobó en vivo**, en vez de dar por buena la producción.

3. **[2026-08-03] El servidor de desarrollo necesita variables de Supabase**
   Sin ellas el middleware responde 500 en todas las rutas.
   Hacer en su lugar: arrancarlo con `NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY` y `SUPABASE_SERVICE_ROLE_KEY` de relleno.

4. **[2026-08-03] Capturas del navegador**
   Hacer en su lugar: `playwright-core` con
   `executablePath: '/opt/pw-browsers/chromium'`. No ejecutar `playwright install`.

## Guardarraíles del producto

1. **[2026-08-03] Los topes del plan cuentan TODAS las filas**
   Cualquier fila que no deba gastar cupo hay que excluirla a mano en los **seis**
   sitios donde se mide: `clientes/actions.ts`, `ordenes/actions.ts`,
   `clientes/page.tsx`, `ordenes/page.tsx`, `ordenes/nueva/page.tsx` y el
   `UsageMeter` de `dashboard/page.tsx`.
   Hacer en su lugar: filtrar por `es_ejemplo` al contar; las listas sí las enseñan.

2. **[2026-08-03] La CSP bloquea tipografías y hojas externas**
   `next.config.mjs` declara `style-src 'self'` y `font-src 'self'`. Un `@import`
   a Google Fonts se rechaza en silencio y la web cae a la fuente del sistema
   (pasó durante meses con Plus Jakarta Sans).
   Hacer en su lugar: `next/font/google`, que las autoaloja.

3. **[2026-08-03] React escapa las comillas dentro de `<style>`**
   Como hijo de texto, `"` pasa a `&quot;` en el servidor, pero el navegador no
   decodifica entidades dentro de `<style>`: falla la hidratación y React tira
   todo el HTML del servidor.
   Hacer en su lugar: `<style dangerouslySetInnerHTML={{ __html: \`...\` }} />`.

4. **[2026-08-03] Nada que dependa del reloj se calcula en el render**
   `useState(algoConDate())` da un valor en el servidor y otro en el cliente.
   Hacer en su lugar: arrancar en `null`, calcular en `useEffect`, y no pintar
   nada hasta tener valor.

5. **[2026-08-03] Las cuatro landings comparten el mismo juego de clases**
   `home-client.tsx` y `mexico/colombia/peru-client.tsx` usan las mismas clases
   (`.lh1`, `.lsh2`, `.lplan-*`…) pero son archivos separados.
   Hacer en su lugar: replicar todo cambio visual en las cuatro, o extraerlo a
   `globals.css` bajo `.lr`, como ya se hizo con la tipografía.

6. **[2026-08-03] `globals.css` fuerza texto casi negro en todo campo**
   La regla `input, select, textarea { color: #0f172a !important }` le gana a
   Tailwind, así que sobre fondo oscuro el texto se pierde.
   Hacer en su lugar: añadir la clase `.input-on-dark` (cubre `input` y `textarea`).

7. **[2026-08-03] El número de orden sale de un contador atómico**
   `siguiente_numero_orden(taller_id)` incrementa `contadores_orden`, que bajo RLS
   es de **solo lectura** desde el cliente.
   Hacer en su lugar: no escribir esa tabla directamente; usar funciones
   `security definer` (ver `reiniciar_contador_orden`).

8. **[2026-08-03] Patrón recurrente: funciones construidas pero nunca conectadas**
   Ya pasó con los dos crons, el `UsageMeter`, `/api/stats`, las cuatro puertas de
   plan y el bloqueo del trial.
   Hacer en su lugar: antes de construir algo nuevo, comprobar si ya existe y solo
   le falta el cable.

## Directivas del usuario

1. **[2026-08-03] A FASTCAR no se le toca nada**
   Es el único cliente de pago.
   Hacer en su lugar: verificar el impacto sobre su taller antes de cualquier
   migración o cambio de límites.

2. **[2026-08-03] Ninguna cifra de prueba social inventada**
   Los números de talleres salen de la base de datos o no se ponen.
   Hacer en su lugar: leer el conteo real; si no hay dato, no pintar el bloque.

3. **[2026-08-03] Los testimonios se quedan como están**
   Decisión razonada del dueño: la prueba social de varias personas convence más.

4. **[2026-08-03] No atacar a WhatsApp en el copy**
   La aprobación por WhatsApp es una función que se vende, no el enemigo.
   Hacer en su lugar: apuntar a lo que se pierde sin registro, no al canal.

5. **[2026-08-03] Los datos de ejemplo son solo para altas nuevas**
   Los 73 talleres ya registrados no se rellenan hacia atrás.

6. **[2026-08-03] Filosofía de producto, para todo el copy**
   "Ayudamos a que los dueños de talleres ganen más dinero administrando mejor su
   negocio."

## Trabajo pendiente

1. **[2026-08-03] Imágenes del blog — sesión dedicada**
   El blog **no tiene imágenes en ninguna capa**: falta la columna en
   `articulos_blog`, guardar la ruta por artículo y pintarla en las dos vistas
   (`app/(public)/blog/page.tsx` y `blog/[slug]/page.tsx`). Lleva migración.
   Son 24 fotos de ~2,5 MB. El tope de GitHub es 25 MB **por archivo**, así que
   caben sueltas; el problema era intentar subir el ZIP de 61 MB como un archivo.
   **La subida por la web de GitHub le falló y no llegamos a averiguar por qué.**
   Sospechas sin confirmar: hacerlo desde el navegador del teléfono, archivos
   HEIC de iPhone, o el peso total de una sola tanda.
   Hacer en su lugar: **empezar por diagnosticar ese fallo**, no repetir la misma
   instrucción. Pedir el mensaje de error exacto y probar desde una computadora
   con 5-6 archivos por commit antes de intentar las 24 de golpe. El chat no
   sirve de canal (tope de 5 imágenes) y el proxy deniega enlaces externos tipo
   Drive: la única vía real es el repositorio.
   Cuando lleguen: comprimir con `sharp` a 1200 px y WebP (~150-250 KB cada una)
   y fusionar solo las optimizadas, nunca los originales a `main`.
