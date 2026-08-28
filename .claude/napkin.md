# Napkin Runbook — TallerOS

Guía de ejecución para sesiones futuras. No es un historial: si algo deja de
ser útil o recurrente, se borra.

## Reglas de curación
- Reordenar por importancia en cada lectura.
- Solo notas recurrentes y de alto valor.
- Máximo 10 puntos por categoría.
- Cada punto lleva fecha y una línea "Hacer en su lugar".

## Ejecución y verificación (máxima prioridad)

1. **[2026-08-20] `const { data }` sin mirar el `error` esconde averías durante semanas**
   Tres veces en una sola sesión, siempre igual: la consulta falla, `data` llega
   null, y el código lo interpreta como "no había nada". Los crons de onboarding
   y trial devolvían 200 con `procesados: 0` porque pedían `usuarios.telefono`,
   que no existe. El checkout de Stripe devolvía "Error interno" sin decir que
   Stripe rechazaba por mezclar monedas. Y el portal del cliente respondía 404 en
   **todos** los enlaces de **todos** los talleres porque la RPC ni se ejecutaba.
   Ninguna de las tres se detectó desde dentro: las reportaron los clientes.
   Hacer en su lugar: desestructurar siempre `{ data, error }` y ramificar por
   `error` antes de mirar `data`. Un fallo de consulta y un resultado vacío
   necesitan salidas distintas — si acaban en el mismo `notFound()` o el mismo
   `return 0`, la avería es invisible. Vale para Supabase y para cualquier
   respuesta con forma `{ data, error }`.

2. **[2026-08-20] Las migraciones describen tablas que en producción son otras**
   `024_missing_tables.sql` declara `portal_tokens.token` como `uuid`, pero usa
   `create table if not exists` y la tabla ya existía: en producción es `text`
   con `encode(gen_random_bytes(32),'hex')`. La migración 037 escribió
   `get_portal_data(p_token uuid)` copiando el archivo, y el portal entero llevaba
   semanas en 404.
   Hacer en su lugar: antes de escribir SQL que dependa del esquema, leer el
   esquema **de la base**, no del archivo — `information_schema.columns` para
   tipos, `pg_get_function_identity_arguments` para firmas. Todo archivo con
   `create table if not exists` es una descripción sin garantía.

3. **[2026-08-27] Quitar una política de RLS exige inventariar quién escribe, no solo quién lee**
   La 036 quitó políticas de `storage.objects` que dejaban listar archivos sin
   filtrar por taller. Para `notas-voz` quitó la suya y **volvió a crear** el
   INSERT, porque ese bucket se escribe desde el cliente. Para `logos` la quitó
   y no creó nada, razonando que las descargas van por `getPublicUrl` y no
   dependen de RLS — cierto para **leer**, pero los logos también se **suben**
   desde el cliente, en Configuración y en el onboarding. Resultado: durante
   semanas, cualquier taller que intentara poner su logo chocaba con "new row
   violates row-level security policy". Solo se vio cuando el dueño entró por
   Configuración; el onboarding se lo tragaba con un `if` sin rama `else`.
   Hacer en su lugar: antes de tocar políticas de un bucket o una tabla,
   `grep` de todos los sitios que escriben en él desde el cliente y reponer una
   política por cada verbo que se use. Ojo con `upsert`: necesita **UPDATE**
   además de INSERT, y es fácil de olvidar porque la primera subida funciona y
   solo falla al reemplazar. El modelo bueno es
   `supabase/migrations/030_storage_diagnosticos.sql`.

4. **[2026-08-28] Antes de decir que algo funciona: `npm run verify`**
   Ejecuta las tres cosas en orden: tipos sin regresiones, 91 pruebas, y el
   build. Es lo mismo que corre el CI en cada PR (`.github/workflows/verificar.yml`).
   · `npm run typecheck` NO exige cero errores: exige que no **crezcan**. El
     repo arrastra **19 previos** y `next.config.mjs` tiene
     `ignoreBuildErrors: true`, así que "✓ Compiled successfully" nunca ha
     dicho nada sobre TypeScript. `scripts/tsc-baseline.mjs` pone el tope; si
     arreglas alguno, baja el número y ya no se puede volver atrás.
   · `npm test` cubre lo que toca dinero y permisos: precios (que lo mostrado
     sea lo cobrado en las 16 combinaciones), topes de plan, roles, links de
     WhatsApp y monedas por país.
   Hacer en su lugar: nunca reportar "verificado" sin haberlo corrido.

5. **[2026-08-03] Las migraciones van ANTES del merge — salvo cuando van después**
   Fusionar a `main` dispara el deploy de producción en Vercel. Si el código
   consulta una columna que aún no existe, tumba las pantallas de todos.
   Hacer en su lugar: pasarle el SQL al usuario, esperar confirmación de que lo
   corrió, y solo entonces fusionar.
   **La excepción [2026-08-20]:** cuando lo que cambia es la *forma de lo que
   devuelve* la base y no un campo nuevo, el orden se invierte. La 044 hizo que
   `get_portal_data` devolviera `{expirado:true}`; correrla antes habría dado ese
   objeto a la página vieja, que iba directa a leer la orden y habría respondido
   500. Preguntarse siempre quién habla primero: si la base empieza a decir algo
   que el código desplegado no sabe interpretar, el código va primero.

6. **[2026-08-03] La rama diverge tras cada squash merge**
   La PR sale `mergeable_state: dirty` porque la rama conserva los commits que
   en `main` entraron aplastados en uno.
   Hacer en su lugar: comprobar que los árboles coinciden
   (`git diff --stat <ultimo-commit-fusionado> origin/main` vacío) y rebasar con
   `git rebase --onto origin/main <ultimo-commit-fusionado> <rama>`.
   **Ojo con `git checkout -B <rama> origin/main`**: deja el upstream apuntando a
   `origin/main`, así que `git rev-parse HEAD @{u}` sale idéntico y parece todo
   sincronizado mientras la rama del servidor sigue en el commit viejo. Para
   saber dónde está de verdad: `git ls-remote origin <rama>`.

7. **[2026-08-28] El build local falla en 4 páginas de auth — y tiene arreglo**
   `/login`, `/registro`, `/nueva-password` y `/recuperar-password` fallan al
   exportar cuando **faltan** las variables de Supabase. Durante meses se dio
   por inevitable; no lo es. Con variables de relleno el build pasa entero:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://ejemplo.supabase.co \
   NEXT_PUBLIC_SUPABASE_ANON_KEY=relleno \
   SUPABASE_SERVICE_ROLE_KEY=relleno \
   npm run build
   ```
   Hacer en su lugar: correrlo así, que es como lo corre el CI. Comprobar solo
   `Compiled successfully` deja pasar fallos de las cuatro páginas de auth.

8. **[2026-08-03] Supabase MCP y los registros de build de Vercel piden aprobación**
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

4. **[2026-08-06] `server: cloudflare` NO dice quién generó la respuesta**
   Cloudflare reescribe esa cabecera en todo lo que atraviesa su proxy, así que
   solo prueba que la respuesta pasó por ahí. Deducir lo contrario mandó al
   dueño a buscar en Cloudflare una regla que no existía: el 307 de raíz→www lo
   emitía Vercel, que es su valor por defecto, y Cloudflare lo repetía. El DNS
   ya lo insinuaba: `tallerosapp.com` → IPs de Cloudflare con proxy activo,
   `www` → `vercel-dns-017.com` → Vercel.
   Hacer en su lugar: detrás de un proxy, averiguar quién manda mirando dónde
   está configurada la regla, no la cabecera `server`. El dominio raíz se
   gestiona en **Vercel → Settings → Domains** (hoy en 308, verificado).

5. **[2026-08-13] Buscar por el valor, nunca por la forma del atributo**
   `grep 'href="/blog"'` no encontró nada y se concluyó que el blog no estaba
   enlazado desde ninguna landing. Sí lo estaba, dos veces en cada una: los
   enlaces se generan desde objetos (`{l:'Blog',h:'/blog'}`, `['/blog','Blog']`),
   así que la cadena literal no existe en el código.
   Hacer en su lugar: buscar `/blog` a secas, o `'/blog'\|"/blog"`. Una búsqueda
   que no encuentra nada es sospechosa, no concluyente — sobre todo antes de
   reportarla como hallazgo.

6. **[2026-08-03] Capturas del navegador**
   Hacer en su lugar: `playwright-core` con
   `executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'`
   (corregido el 27/08: `/opt/pw-browsers/chromium` no existe, la carpeta lleva
   el número de build). No ejecutar `playwright install`. No está en
   `package.json`: instalarlo en el scratchpad, no en el proyecto.

7. **[2026-08-27] Lo que el dueño va a copiar y pegar, va completo**
   Dos veces en una sesión le costaron tiempo: un `as $ ... $;` con los puntos
   suspensivos literales dentro (error de sintaxis en el editor de Supabase) y
   una ruta abreviada `migrations/046_...` en vez de
   `supabase/migrations/046_...` (404 en GitHub).
   Hacer en su lugar: rutas y SQL siempre enteros, sin abreviar y sin elidir.
   La abreviatura ahorra una línea al escribir y cuesta un viaje de ida y vuelta.

## Guardarraíles del producto

1. **[2026-08-03] Los topes del plan cuentan TODAS las filas**
   Cualquier fila que no deba gastar cupo hay que excluirla a mano en los **seis**
   sitios donde se mide: `clientes/actions.ts`, `ordenes/actions.ts`,
   `clientes/page.tsx`, `ordenes/page.tsx`, `ordenes/nueva/page.tsx` y el
   `UsageMeter` de `dashboard/page.tsx`.
   Hacer en su lugar: filtrar por `es_ejemplo` al contar; las listas sí las enseñan.

2. **[2026-08-28] Un número escrito a mano al lado de una realidad que se mueve**
   Dos veces, y las dos invisibles hasta que alguien miró:
   · **Los precios.** La web calculaba el precio local multiplicando dólares por
     una tabla de tipos de cambio escrita a mano, y Stripe cobraba en dólares.
     Dos números para el mismo hecho, cada uno por su lado. Se separaron: a un
     argentino se le anunciaba un **31% menos** de lo que se le cobraba, y a un
     colombiano un **33% más** de lo que costaba de verdad. Nadie tocaba esa
     tabla desde hacía meses.
   · **El blog.** `/blog` pedía `.limit(50)` sin paginar mientras el cron
     publica un artículo al día. Con 77 publicados, 27 quedaron sin ningún
     enlace que llevara a ellos, y el número crecía solo.
   Hacer en su lugar: cuando dos sitios calculan el mismo hecho, acaban
   diciendo cosas distintas — que lo calcule uno y el otro lo lea
   (`lib/precios.ts` es el ejemplo: la pantalla y el checkout leen la misma
   tabla, así que no pueden divergir). Y cuando un número fijo convive con algo
   que cambia solo, o se saca del cálculo o se le pone encima un aviso de
   antigüedad visible — `/admin` avisa a los 30 días de los tipos de cambio,
   precisamente porque confiar en que alguien se acuerde ya falló.

3. **[2026-08-27] El middleware es una llamada de red delante de TODA la app**
   Se degradó la red entre el borde de Vercel y Supabase —ni el código ni la
   base tenían nada: Supabase respondió 200 a las 18 peticiones que le llegaron
   y `middleware.ts` no se tocaba desde el 31/07— y como la consulta de sesión
   no tenía límite propio, cada petición se colgaba hasta el corte de Vercel a
   los 25 s: **504 en todas las rutas con sesión iniciada**, incluido el dueño.
   El reparto de daños lo delata: `/admin` y el blog seguían en 200 porque
   salen del middleware antes de tocar Supabase.
   Hacer en su lugar: toda llamada de red en el middleware lleva su propio
   `Promise.race` con límite (5 s hoy) y decide qué pasa al expirar. Y no
   asumir "no hay sesión": eso echa de la app a quien sí la tiene, y `/login`
   depende del mismo servicio caído. Se deja pasar y decide la página, que
   vuelve a comprobar desde la función serverless. Corolario: **el middleware
   es la primera capa, nunca la única** — si una comprobación solo vive ahí,
   desaparece entera cuando el middleware no puede resolver. Así apareció que
   `/api/promociones` nunca verificaba el rol (el middleware excluye `/api/`)
   y un técnico podía escribirle a todos los clientes del taller.

4. **[2026-08-03] El CSS del proyecto le gana a lo que escribas en la página**
   Dos trampas: `globals.css` declara `input, select, textarea { color: #0f172a
   !important }`, así que sobre fondo oscuro el texto del campo desaparece (la
   clase `.input-on-dark` lo arregla, cubre `input` y `textarea`); y las cuatro
   landings (`home-client.tsx`, `mexico/colombia/peru-client.tsx`) son archivos
   separados que comparten el mismo juego de clases (`.lh1`, `.lsh2`,
   `.lplan-*`…).
   Hacer en su lugar: replicar todo cambio visual en las cuatro landings, o
   extraerlo a `globals.css` bajo `.lr`, como ya se hizo con la tipografía.

5. **[2026-08-20] De un mapa histórico no se borra nunca una entrada**
   `PRECIOS_A_PLAN` traduce el precio que manda Stripe → plan. Al cambiar los
   precios de CAD a USD se sacaron los viejos del mapa "porque ya no se
   ofrecen", pero las suscripciones vivas seguían corriendo sobre ellos: el
   siguiente `customer.subscription.updated` —una renovación cobrada sin
   problema— caía en el `?? 'trial'` y degradaba al único cliente de pago a los
   topes del plan gratis. Estuvo así tres semanas sin que nada lo reportara.
   Hacer en su lugar: los mapas de traducción incluyen lo retirado; lo que
   cambia es qué se **ofrece** (`PLANES`), no qué se sabe **leer**. Y un valor
   desconocido nunca justifica bajarle el plan a nadie: se conserva lo que
   había y se avisa.

6. **[2026-08-27] Una tarjeta con botón propio y vista previa dice "guardado" aunque no lo esté**
   El logo del taller se subía a Storage, se pintaba al instante en su
   recuadro y ahí se quedaba: `logo_url` no llegaba a la base hasta pulsar
   "Guardar cambios" al final de una página larga. La tarjeta tiene su propio
   botón, su propio "Subiendo…" y enseña el resultado — se lee como una acción
   terminada, y nadie tiene por qué adivinar que falta otro botón abajo. Meses
   de talleres subiendo su logo y volviendo al panel con la llave genérica.
   Hacer en su lugar: si un control tiene botón e indicador propios, que
   escriba él. Guardar en el envío del formulario solo vale cuando el control
   se ve claramente como un campo más del formulario. Y ojo con dónde se lee
   el dato: la barra lateral vive en el layout del grupo, así que
   `revalidatePath('/configuracion')` no la alcanzaba — hacía falta
   `revalidatePath('/', 'layout')`.

7. **[2026-08-27] Trabajo encadenado que no depende entre sí = espera regalada**
   El alta hacía once llamadas de red **en fila** mientras el dueño mira
   "Creando tu taller…". Los tres tramos finales —datos del taller, muestra
   inicial y correo de bienvenida— solo necesitaban el `taller_id`, ninguno
   el resultado de los otros; el más caro (Auth + Resend) estaba el último.
   Y la espera del trigger dormía **antes** de preguntar, pagando 200 ms en
   todos los registros por una fila que ya estaba commiteada.
   Hacer en su lugar: en cualquier handler largo, preguntarse por cada `await`
   de quién depende de verdad. Lo independiente va en `Promise.all` con su
   propio `.catch` — un rechazo suelto tumbaría un alta ya confirmada en Auth.
   Y un `sleep` antes de la primera comprobación es siempre sospechoso: mirar
   si el trigger es síncrono antes de asumir que hay carrera.

8. **[2026-08-03] El número de orden sale de un contador atómico**
   `siguiente_numero_orden(taller_id)` incrementa `contadores_orden`, que bajo RLS
   es de **solo lectura** desde el cliente.
   Hacer en su lugar: no escribir esa tabla directamente; usar funciones
   `security definer` (ver `reiniciar_contador_orden`).

9. **[2026-08-13] SEO del blog: la fuente única y la canónica a prueba de fallos**
   Las redirecciones viven **solo** en `lib/blog-redirecciones.json`, que leen
   `next.config.mjs` (emite los 301) y `app/sitemap.ts` (los excluye); cuando
   vivían solo en el config, el sitemap seguía ofreciendo 10 URLs que redirigían.
   La canónica se arma con el `slug` de la URL y no con lo que devuelva Supabase:
   si la consulta falla, la página salía sin `<link rel="canonical">`. Y en
   listados paginados cada página se canoniza a sí misma, o Google trata de la
   segunda en adelante como duplicados de la primera.
   Hacer en su lugar: nunca una lista paralela de redirecciones, nunca una
   canónica que dependa de la base, nunca una canónica fija en un listado que
   pagina.

10. **[2026-08-03] Patrón recurrente: funciones construidas pero nunca conectadas**
   Ya pasó con los dos crons, el `UsageMeter`, `/api/stats`, las cuatro puertas de
   plan, el bloqueo del trial y —el más caro— `imagen_url`: la migración 043 creó
   la columna, cuatro sitios la leen, las 23 portadas llevaban meses en
   `public/blog/`, y **nada en el repositorio la escribía**. 76 de 77 artículos
   sin imagen.
   Hacer en su lugar: antes de construir algo nuevo, comprobar si ya existe y solo
   le falta el cable. Que una columna exista y se lea no significa que alguien la
   rellene: para eso, contar filas en la base, no leer el código.

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

7. **[2026-08-17] La prospección en frío está apagada a propósito, con dos llaves**
   El agente de `/api/cron/prospecting` gastaba presupuesto de Twilio en
   WhatsApp que no se entregaba: WhatsApp Business no reparte en frío a quien no
   te escribió antes. Decisión del dueño, no un descuido.
   Están **las dos llaves puestas**: el flag `PROSPECTING_AGENT_ENABLED` y, sobre
   todo, que la ruta no está en la lista de `daily/route.ts`. Poner el flag en
   `true` no reactiva nada.
   Hacer en su lugar: no encenderlo por iniciativa propia. Si el dueño lo pide,
   volver **solo por correo** (Brevo no tiene el problema de entrega) y avisarle
   de que hay que tocar las dos llaves. Lo mismo vale para
   `reintentar-prospectos-whatsapp`, que es su reintento.

8. **[2026-08-05] Dos temas del blog descartados por el dueño**
   Ni artículos de facturación electrónica por país (CFDI, DIAN, SUNAT) ni
   corregir la errata del slug `tallerados-vs-excel-gestion-taller`. Se
   propusieron y se rechazaron.
   Hacer en su lugar: no volver a ofrecerlos.

## Trabajo pendiente

1. **[2026-08-28] Los carritos abandonados van ANTES que la lista de inactivos**
   Tres talleres pulsaron pagar y no completaron: Ribec (24/07, lo intentó
   **dos veces** con 69 minutos de diferencia), Apex (19/07) y Llantera
   papagayo (22/08). Los logs de Stripe descartan fallo técnico —todo 200 OK,
   ni un `payment_intent`, y como único evento "Checkout Session expired" a las
   24 h—: llegaron a la pantalla de la tarjeta y no escribieron nada. Los tres
   se registraron y fueron a pagar **el mismo día**, en cuestión de horas.
   Hacer en su lugar: salen solos en la sección "Carritos abandonados" de
   `/admin`, con su link wa.me. Escribirles a ellos primero — están muy por
   delante de los 20 inactivos, porque ya decidieron pagar. **Y preguntarles
   qué les frenó**: son la única fuente fiable de por qué se cayó el checkout,
   y cualquier teoría nuestra (moneda, precio, solo-tarjeta) vale menos que su
   respuesta. Si contestan, hay arreglo concreto que hacer.
   La regla que los detecta: `stripe_customer_id` puesto + plan sin pagar. El
   customer se crea al pulsar pagar, antes de abrir la pantalla.

2. **[2026-08-24] Medir la activación — hacia el 7 de septiembre, no antes**
   Los correos de activación y el portal del cliente estuvieron rotos hasta el
   20-22/08, así que ninguna cohorte anterior sirve de comparación: la secuencia
   nunca llegó a enviarse y el portal daba 404. El reloj empieza ahí.
   Hacer en su lugar: correr `supabase/consultas/activacion-onboarding.sql` y
   comparar contra el 21% de activación medido el 24/08 (19 de 92 talleres
   crearon una orden real). La muestra sigue siendo diminuta; leer dos semanas
   como veredicto es el error a evitar.

3. **[2026-08-24] El cuello de botella NO es la web — no rediseñarla**
   Medido con Google Analytics sobre 30 días: la portada tuvo **18 usuarios**, el
   blog **3**, y todo el sitio 51 usuarios activos (la mayoría dueños entrando a
   `/dashboard` y `/login`). Con 22 registros reales en el mismo periodo, entra
   casi tanta gente a `/registro` como a la portada: el embudo real no es
   "web → registro", la gente llega directa al alta por WhatsApp o de boca en
   boca. Los números de GA van cortos porque solo cuenta a quien acepta el banner
   de cookies, pero la proporción entre páginas sí es válida.
   Hacer en su lugar: si el dueño vuelve a plantear rediseñar la web, enseñarle
   estos números primero. Sus dos problemas son que no llega nadie (canal de
   entrada) y que el 79% de quien se registra nunca usa el producto (activación).
   Rediseñar no ataca ninguno de los dos. Vercel Analytics se montó el 24/08 y
   mide sin el sesgo del banner: a partir de septiembre hay dato limpio.

4. **[2026-08-05] Search Console: esperar, no volver a tocar el código**
   Tras el PR #62 hay que pedir la reindexación del sitemap y dejar pasar
   días/semanas. Las 10 "Página con redirección" deberían desaparecer y el
   artículo sin canónica pasar a indexado. El 06/08 se cambió además la
   redirección raíz→www de 307 a 308 en Vercel (verificado), así que Google ya
   puede consolidar la raíz; eso también tarda semanas en reflejarse.
   Hacer en su lugar: si el informe sigue igual a los pocos días, es latencia de
   Google, no una regresión; no reescribir el sitemap por impaciencia.

