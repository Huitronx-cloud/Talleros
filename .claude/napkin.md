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
   **Ojo con `git checkout -B <rama> origin/main`**: deja el upstream apuntando a
   `origin/main`, así que `git rev-parse HEAD @{u}` sale idéntico y parece todo
   sincronizado mientras la rama del servidor sigue en el commit viejo. Para
   saber dónde está de verdad: `git ls-remote origin <rama>`.

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

8. **[2026-08-05] Las redirecciones del blog viven en un solo JSON**
   `lib/blog-redirecciones.json` lo leen `next.config.mjs` (para emitir los 301) y
   `app/sitemap.ts` (para no publicar esas URLs). Cuando vivían solo en el config,
   el sitemap seguía ofreciéndole a Google 10 URLs que redirigían.
   Hacer en su lugar: añadir o quitar redirecciones **solo** en el JSON; nunca
   escribir una lista paralela en ninguno de los dos consumidores.

9. **[2026-08-05] La canónica no puede depender de que Supabase responda**
   Si la consulta falla, la página se renderiza sin `<link rel="canonical">` y
   Search Console la marca sin canónica.
   Hacer en su lugar: construir la canónica con el `slug` de la URL, no con el
   dato que vuelve de la base.

10. **[2026-08-03] Patrón recurrente: funciones construidas pero nunca conectadas**
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

7. **[2026-08-05] Dos temas del blog descartados por el dueño**
   Ni artículos de facturación electrónica por país (CFDI, DIAN, SUNAT) ni
   corregir la errata del slug `tallerados-vs-excel-gestion-taller`. Se
   propusieron y se rechazaron.
   Hacer en su lugar: no volver a ofrecerlos.

## Trabajo pendiente

1. **[2026-08-05] Medir la activación del onboarding nuevo — en dos fechas**
   El 18/08 solo para detectar desastre (¿algún taller nuevo creó una orden
   real?); el veredicto va el 01/09, con cuatro semanas de altas. Con 73 talleres
   en total, dos semanas son ruido y leerlas como veredicto es el error a evitar.
   Hacer en su lugar: correr `supabase/consultas/activacion-onboarding.sql`, que
   ya compara cohortes con la misma ventana y lleva escritos sus dos límites (no
   aísla el onboarding de los datos de ejemplo, y la muestra es diminuta).

2. **[2026-08-05] Search Console: esperar, no volver a tocar el código**
   Tras el PR #62 hay que pedir la reindexación del sitemap y dejar pasar
   días/semanas. Las 10 "Página con redirección" deberían desaparecer y el
   artículo sin canónica pasar a indexado.
   Hacer en su lugar: si el informe sigue igual a los pocos días, es latencia de
   Google, no una regresión; no reescribir el sitemap por impaciencia.

3. **[2026-08-06] `server: cloudflare` NO significa que redirija Cloudflare**
   Cloudflare reescribe esa cabecera en todo lo que atraviesa su proxy, así que
   solo prueba que la respuesta pasó por ahí. Se dedujo lo contrario y mandó al
   panel equivocado: en Cloudflare **no hay ninguna Redirect Rule**, el 307 de
   raíz→www lo emite Vercel (es su valor por defecto) y Cloudflare lo repite.
   El DNS lo explica: `tallerosapp.com` → 104.21.64.56 / 172.67.176.96
   (Cloudflare, proxy activo) y `www` → `vercel-dns-017.com` → Vercel.
   Hacer en su lugar: para saber quién genera una respuesta detrás de un proxy,
   mirar dónde está configurada la regla, no la cabecera `server`. El cambio del
   código de estado va en **Vercel → Settings → Domains**.
   La cadena es de dos saltos, conserva la ruta (`/blog` → `/blog`) y acaba en
   200: **no hay bucle ni URLs profundas cayendo en la portada**. Y "Página con
   redirección" en Search Console es el estado normal de una raíz que redirige,
   no un fallo que perseguir.
