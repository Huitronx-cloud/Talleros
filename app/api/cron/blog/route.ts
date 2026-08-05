import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
export const revalidate = 0
// La generación con Claude (artículo + scripts) tarda más que el default:
// sin esto la función puede morir a medias (artículo sin script).
export const maxDuration = 60
import { createPublicReadClient } from '@/lib/supabase-public'
import { PREMISA_PROMPT } from '@/lib/premisa'
import redireccionesBlog from '@/lib/blog-redirecciones.json'

// Errores no fatales (artículo publicado pero script fallido, banco de temas
// agotado): avisar por email en vez de perderse en logs que expiran en 1h.
async function enviarAlertaBlog(detalle: string): Promise<void> {
  try {
    await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': process.env.BREVO_API_KEY!, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sender:      { name: 'TallerOS Alertas', email: 'hola@tallerosapp.com' },
        to:          [{ email: 'hola@tallerosapp.com', name: 'Ivan' }],
        subject:     '⚠️ Aviso del agente de blog — TallerOS',
        htmlContent: `<p>El cron del blog (<code>/api/cron/blog</code>) reporta:</p><p style="color:#dc2626;">${detalle}</p>`,
      }),
    })
  } catch {
    // Si la alerta misma falla, no hay más visibilidad que los logs
  }
}

// Banco de temas. Un slug solo puede aparecer una vez: las entradas repetidas
// no publicaban dos veces (slugExiste las filtra) pero inflaban el conteo, y por
// eso el aviso de banco agotado hablaba de 68 temas que nunca existieron.
const BANCO = [
  // ── Administración ─────────────────────────────────────────────────────────
  { titulo: 'Cómo administrar un taller mecánico sin perder el control',                          slug: 'administrar-taller-mecanico-sin-perder-control',        pais: null },
  { titulo: 'Los errores de administración que más le cuestan a un taller mecánico',              slug: 'errores-administracion-taller-mecanico',                pais: null },
  { titulo: 'Cómo organizar el día a día de un taller con varios mecánicos',                      slug: 'organizar-dia-taller-varios-mecanicos',                 pais: null },
  { titulo: 'Cómo organizar las órdenes de trabajo en tu taller mecánico',                        slug: 'organizar-ordenes-trabajo-taller-mecanico',             pais: null },
  { titulo: 'Tablero Kanban para talleres mecánicos: qué es y cómo usarlo',                       slug: 'kanban-taller-mecanico',                                pais: null },
  { titulo: 'Cómo llevar el inventario de un taller mecánico sin perder dinero',                  slug: 'inventario-taller-mecanico',                            pais: null },
  { titulo: 'Cotizaciones profesionales en tu taller: cómo hacerlas bien',                        slug: 'cotizaciones-profesionales-taller-mecanico',            pais: null },
  { titulo: 'Cómo calcular el precio de tus servicios en un taller mecánico',                     slug: 'calcular-precios-servicios-taller-mecanico',            pais: null },
  { titulo: 'Garantía digital en talleres mecánicos: cómo proteger tu negocio',                   slug: 'garantia-digital-taller-mecanico',                      pais: null },
  { titulo: 'Cómo hacer una orden de trabajo profesional en tu taller mecánico',                  slug: 'orden-trabajo-profesional-taller-mecanico',             pais: null },

  // ── Rentabilidad y finanzas ────────────────────────────────────────────────
  { titulo: 'Cuánto debería ganar realmente un taller mecánico al mes',                           slug: 'cuanto-debe-ganar-taller-mecanico',                     pais: null },
  { titulo: 'Por qué tu taller trabaja mucho y gana poco',                                        slug: 'taller-trabaja-mucho-gana-poco',                        pais: null },
  { titulo: 'Cómo saber si tu taller mecánico es rentable de verdad',                             slug: 'taller-mecanico-rentable-de-verdad',                    pais: null },
  { titulo: 'Cómo calcular la tarifa de mano de obra de tu taller mecánico',                      slug: 'calcular-tarifa-mano-de-obra-taller',                   pais: null },
  { titulo: 'Cuánto margen dejar en las refacciones sin espantar al cliente',                     slug: 'margen-refacciones-taller-mecanico',                    pais: null },
  { titulo: 'Cómo subir los precios de tu taller sin perder clientes',                            slug: 'subir-precios-taller-mecanico',                         pais: null },
  { titulo: 'Por qué tu taller tiene trabajo pero nunca tiene dinero: el flujo de caja',          slug: 'flujo-de-caja-taller-mecanico',                         pais: null },
  { titulo: 'Cómo separar el dinero del taller del dinero de tu casa',                            slug: 'separar-dinero-taller-y-personal',                      pais: null },
  { titulo: 'El punto de equilibrio de un taller mecánico: cuánto necesitas facturar',            slug: 'punto-equilibrio-taller-mecanico',                      pais: null },
  { titulo: 'Los gastos fijos de un taller mecánico que casi nadie tiene completos',              slug: 'gastos-fijos-taller-mecanico',                          pais: null },
  { titulo: 'Cómo dejar de fiar en tu taller sin perder a los buenos clientes',                   slug: 'cuentas-por-cobrar-taller-mecanico',                    pais: null },
  { titulo: 'Cuánto te cuesta tener un carro parado en tu taller',                                slug: 'costo-carro-parado-taller-mecanico',                    pais: null },
  { titulo: 'Cómo pedir un anticipo de la reparación sin incomodar al cliente',                   slug: 'anticipo-reparacion-taller-mecanico',                   pais: null },
  { titulo: 'Cómo cobrar mejor en tu taller: facturación digital sin errores',                    slug: 'cobrar-mejor-taller-mecanico-facturacion-digital',      pais: null },

  // ── Operación del taller ───────────────────────────────────────────────────
  { titulo: 'Cómo medir la productividad de tus mecánicos sin generar pleitos',                   slug: 'medir-productividad-mecanicos-taller',                  pais: null },
  { titulo: 'Cuántos vehículos puede atender tu taller al día',                                   slug: 'capacidad-taller-mecanico-vehiculos-dia',               pais: null },
  { titulo: 'Checklist de recepción del vehículo: la hoja que te evita reclamos',                 slug: 'checklist-recepcion-vehiculo-taller',                   pais: null },
  { titulo: 'El historial de servicio por vehículo: el activo que más vale en tu taller',         slug: 'historial-servicio-vehiculo-taller',                    pais: null },
  { titulo: 'Cómo manejar los trabajos de garantía sin perder dinero',                            slug: 'trabajos-garantia-taller-mecanico',                     pais: null },
  { titulo: 'Refacciones y proveedores: cómo pedir sin frenar la orden de trabajo',               slug: 'refacciones-proveedores-taller-mecanico',               pais: null },
  { titulo: 'Cómo organizar la agenda de tu taller para no tener horas muertas',                  slug: 'agenda-citas-taller-mecanico',                          pais: null },
  { titulo: 'Qué hacer con los vehículos que el cliente no recoge',                               slug: 'vehiculos-no-recogidos-taller-mecanico',                pais: null },
  { titulo: 'Cómo cotizar un trabajo cuando no sabes cuánto va a tardar',                         slug: 'cotizar-trabajo-duracion-incierta-taller',              pais: null },

  // ── Dueños y equipo ────────────────────────────────────────────────────────
  { titulo: 'Cómo delegar tareas en tu taller mecánico y dejar de hacerlo todo tú',               slug: 'delegar-tareas-taller-mecanico',                        pais: null },
  { titulo: 'Cómo contratar al mecánico correcto para tu taller',                                 slug: 'contratar-mecanico-correcto-taller',                    pais: null },
  { titulo: 'Consejos para dueños de taller que están empezando',                                 slug: 'consejos-duenos-taller-que-empiezan',                   pais: null },
  { titulo: 'Cómo un dueño de taller puede dejar de trabajar 12 horas al día',                    slug: 'dueno-taller-dejar-trabajar-12-horas',                  pais: null },
  { titulo: 'Cuándo conviene contratar a otro mecánico: los números que lo dicen',                slug: 'cuando-contratar-otro-mecanico-taller',                 pais: null },
  { titulo: 'Cómo pagarle a tus mecánicos: sueldo fijo, comisión o mixto',                        slug: 'como-pagar-mecanicos-taller',                           pais: null },
  { titulo: 'Cómo capacitar a un mecánico nuevo sin frenar el taller',                            slug: 'capacitar-mecanico-nuevo-taller',                       pais: null },

  // ── Crecimiento ────────────────────────────────────────────────────────────
  { titulo: 'Cómo abrir una segunda sucursal de tu taller sin perder el control',                 slug: 'segunda-sucursal-taller-mecanico',                      pais: null },
  { titulo: 'Especializarte en una marca o atender todas: qué le conviene a tu taller',           slug: 'especializar-taller-marca-o-todas',                     pais: null },
  { titulo: 'Cómo conseguir clientes de flotillas y empresas para tu taller',                     slug: 'clientes-flotillas-empresas-taller',                    pais: null },
  { titulo: 'Trabajar con aseguradoras en tu taller: cuándo conviene y cuándo no',                slug: 'trabajar-con-aseguradoras-taller',                      pais: null },

  // ── Clientes ───────────────────────────────────────────────────────────────
  { titulo: 'Por qué muchos clientes desconfían de los talleres mecánicos',                       slug: 'clientes-desconfian-talleres-mecanicos',                pais: null },
  { titulo: 'Qué decirle al cliente cuando la reparación se va a tardar más',                     slug: 'avisar-cliente-reparacion-retrasada',                   pais: null },
  { titulo: 'Cómo explicar una reparación cara sin que suene a abuso',                            slug: 'explicar-reparacion-cara-cliente-taller',               pais: null },
  { titulo: 'Qué hacer cuando el cliente pide una segunda opinión',                               slug: 'cliente-pide-segunda-opinion-taller',                   pais: null },
  { titulo: 'Cómo recuperar a los clientes que dejaron de venir a tu taller',                     slug: 'recuperar-clientes-perdidos-taller',                    pais: null },
  { titulo: 'Cómo fidelizar clientes en un taller mecánico',                                      slug: 'fidelizar-clientes-taller-mecanico',                    pais: null },
  { titulo: 'Recordatorios de mantenimiento: la estrategia que recupera clientes',                slug: 'recordatorios-mantenimiento-clientes-taller',           pais: null },
  { titulo: '5 señales de que tu taller mecánico está perdiendo clientes sin darte cuenta',       slug: 'senales-taller-mecanico-pierde-clientes',               pais: null },
  { titulo: 'El error más caro que cometen los talleres mecánicos',                               slug: 'error-mas-caro-talleres-mecanicos',                     pais: null },

  // ── Marketing ──────────────────────────────────────────────────────────────
  { titulo: 'Marketing de boca en boca: cómo activarlo en tu taller mecánico',                    slug: 'marketing-boca-en-boca-taller-mecanico',                pais: null },
  { titulo: 'Redes sociales para talleres mecánicos: qué publicar para generar confianza',        slug: 'redes-sociales-taller-mecanico-confianza',              pais: null },
  { titulo: 'Marketing para talleres mecánicos: por dónde empezar sin gastar en publicidad',      slug: 'marketing-taller-mecanico-sin-publicidad',              pais: null },
  { titulo: 'Cómo conseguir más clientes para tu taller mecánico sin bajar precios',              slug: 'conseguir-clientes-taller-mecanico-sin-bajar-precios',  pais: null },
  { titulo: 'Precio o valor: cómo dejar de competir contra el taller de la esquina',              slug: 'competir-precio-taller-mecanico',                       pais: null },
  { titulo: 'Guía completa de reseñas en Google para talleres mecánicos en LATAM',                slug: 'resenas-google-talleres-mecanicos-latam',               pais: null },
  { titulo: 'Cómo usar WhatsApp para aumentar las ventas de tu taller mecánico',                  slug: 'whatsapp-ventas-taller-mecanico',                       pais: null },
  { titulo: 'Cómo aprobar reparaciones por WhatsApp y eliminar malentendidos',                    slug: 'aprobar-reparaciones-whatsapp-taller',                  pais: null },

  // ── Digitalización ─────────────────────────────────────────────────────────
  { titulo: 'Digitalizar tu taller mecánico: por dónde empezar',                                  slug: 'digitalizar-taller-mecanico-por-donde-empezar',         pais: null },
  { titulo: 'Órdenes de trabajo digitales vs papel: qué conviene más',                            slug: 'ordenes-trabajo-digitales-vs-papel-taller',             pais: null },
  { titulo: 'Taller mecánico sin papel: cómo hacer la transición',                                slug: 'taller-mecanico-sin-papel',                             pais: null },
  { titulo: 'Los números que deberías revisar cada semana en tu taller',                          slug: 'indicadores-semanales-taller-mecanico',                 pais: null },
  { titulo: 'Cómo pasar de la libreta al sistema sin perder tu historial',                        slug: 'migrar-libreta-a-sistema-taller',                       pais: null },
  { titulo: 'Cómo proteger la información de tu taller y no perderla nunca',                      slug: 'proteger-informacion-taller-mecanico',                  pais: null },

  // ── Fondo de embudo (intención comercial) ──────────────────────────────────
  { titulo: 'Sistema de gestión para taller mecánico: qué es y cómo elegir el mejor',             slug: 'sistema-gestion-taller-mecanico-como-elegir',           pais: null },
  { titulo: 'TallerOS vs Excel: por qué una hoja de cálculo no alcanza para gestionar un taller', slug: 'tallerados-vs-excel-gestion-taller',                    pais: null },
  { titulo: 'Los mejores software para talleres mecánicos en LATAM: comparativa 2026',            slug: 'mejores-software-talleres-mecanicos-latam-2026',        pais: null },
  { titulo: 'Cuánto cuesta un software para taller mecánico en México',                           slug: 'cuanto-cuesta-software-taller-mecanico-mexico',         pais: 'MX' },
  { titulo: 'Cuánto cuesta un software para taller mecánico en Colombia',                         slug: 'cuanto-cuesta-software-taller-mecanico-colombia',       pais: 'CO' },
  { titulo: 'Cuánto cuesta un software para taller mecánico en Perú',                             slug: 'cuanto-cuesta-software-taller-mecanico-peru',           pais: 'PE' },

  // ── Geolocalización ────────────────────────────────────────────────────────
  { titulo: 'Cómo digitalizar un taller mecánico en Guadalajara',                                 slug: 'digitalizar-taller-mecanico-guadalajara',               pais: 'MX' },
  { titulo: 'Cómo digitalizar un taller mecánico en Monterrey',                                   slug: 'digitalizar-taller-mecanico-monterrey',                 pais: 'MX' },
  { titulo: 'Cómo digitalizar un taller mecánico en Ciudad de México',                            slug: 'digitalizar-taller-mecanico-cdmx',                      pais: 'MX' },
  { titulo: 'Cómo digitalizar un taller mecánico en Bogotá',                                      slug: 'digitalizar-taller-mecanico-bogota',                    pais: 'CO' },
  { titulo: 'Cómo digitalizar un taller mecánico en Medellín',                                    slug: 'digitalizar-taller-mecanico-medellin',                  pais: 'CO' },
  { titulo: 'Cómo digitalizar un taller mecánico en Lima',                                        slug: 'digitalizar-taller-mecanico-lima',                      pais: 'PE' },
  { titulo: 'Software para talleres mecánicos en Guadalajara: guía 2026',                         slug: 'software-talleres-mecanicos-guadalajara-2026',          pais: 'MX' },
  { titulo: 'Software para talleres mecánicos en Monterrey: guía 2026',                           slug: 'software-talleres-mecanicos-monterrey-2026',            pais: 'MX' },
  { titulo: 'Software para talleres mecánicos en Ciudad de México: guía 2026',                    slug: 'software-talleres-mecanicos-cdmx-2026',                 pais: 'MX' },
  { titulo: 'Software para talleres mecánicos en Bogotá: guía 2026',                              slug: 'software-talleres-mecanicos-bogota-2026',               pais: 'CO' },
  { titulo: 'Software para talleres mecánicos en Lima: guía 2026',                                slug: 'software-talleres-mecanicos-lima-2026',                 pais: 'PE' },
]

// Un tema cuyo slug quedó consolidado en otro artículo no puede seguir en el
// banco: el artículo se generaría y su URL redirige (301) a otra parte, así que
// Google nunca lo indexaría. Ocho temas estaban justo así y ya salieron de la
// lista de arriba. Este filtro es el que impide que vuelva a pasar: la próxima
// consolidación los saca del banco sola, sin tener que acordarse de los dos
// archivos. Hoy no descarta ninguno, y eso es exactamente lo que debe pasar.
const SLUGS_REDIRIGIDOS = new Set(redireccionesBlog.redirecciones.map(r => r.origen))
const TEMAS = BANCO.filter(t => !SLUGS_REDIRIGIDOS.has(t.slug))

async function limpiarArticulosExistentes(supabase: any): Promise<void> {
  const { data: articulos } = await supabase
    .from('articulos_blog')
    .select('id, contenido')

  for (const art of articulos ?? []) {
    const limpio = limpiarContenidoIA(art.contenido ?? '')
    if (limpio !== art.contenido) {
      await supabase.from('articulos_blog').update({ contenido: limpio }).eq('id', art.id)
    }
  }
}

async function slugExiste(supabase: any, slug: string): Promise<boolean> {
  const { data } = await supabase
    .from('articulos_blog')
    .select('id')
    .eq('slug', slug)
    .single()
  return !!data
}

async function generarArticulo(tema: typeof TEMAS[0]): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key':         process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
      'Content-Type':      'application/json',
    },
    body: JSON.stringify({
      model:      'claude-sonnet-4-6',
      max_tokens: 2000,
      messages: [{
        role:    'user',
        content: `${PREMISA_PROMPT}Escribe un artículo de blog SEO-optimizado en español para dueños de talleres mecánicos en Latinoamérica.

Título: "${tema.titulo}"
Keyword principal: "${tema.slug.replace(/-/g, ' ')}"
${tema.pais ? `País objetivo: ${tema.pais === 'MX' ? 'México' : tema.pais === 'CO' ? 'Colombia' : 'Perú'}` : ''}

Instrucciones:
- Tono: directo, como un colega dueño de taller que ya resolvió el problema. Sin condescendencia.
- Longitud: 1200-1500 palabras
- La keyword principal debe aparecer en el primer párrafo de forma natural
- Estructura: introducción directa (sin "en este artículo veremos"), 4-5 secciones H2, 1-2 subsecciones H3, conclusión con CTA
- Incluye datos reales cuando aplique
- Usa ejemplos concretos de situaciones en talleres de LATAM
- Al final menciona naturalmente que TallerOS resuelve el problema, con CTA a https://www.tallerosapp.com/registro
- Formato: HTML limpio con <h2>, <h3>, <p>, <ul>, <li>, <strong>. Sin <html>, <body>, <head>, <article> ni <h1>.
- NO uses markdown. No envuelvas la respuesta en backticks ni code fences.
- PROHIBIDO empezar con frases como: "Seamos honestos", "Vamos directo al grano", "En este artículo", "Si eres dueño de taller". Entra directo al tema desde la primera oración.`,
      }],
    }),
  })
  const data = await res.json()
  return limpiarContenidoIA(data.content?.[0]?.text ?? '')
}

function limpiarContenidoIA(raw: string): string {
  let html = raw.trim()

  // El modelo a veces envuelve la respuesta en un code fence de markdown pese a las instrucciones
  html = html.replace(/^```(?:html)?\s*\n?/i, '').replace(/\n?```\s*$/, '').trim()

  // El modelo a veces envuelve el contenido en su propio <article>, duplicando el que ya pone la página
  const articleMatch = html.match(/^<article[^>]*>([\s\S]*)<\/article>\s*$/i)
  if (articleMatch) html = articleMatch[1].trim()

  // La página ya renderiza su propio <h1> con el título; quitamos el duplicado si el modelo lo agregó
  html = html.replace(/^<h1[^>]*>[\s\S]*?<\/h1>\s*/i, '')

  return html.trim()
}

async function generarScript(tema: typeof TEMAS[0]): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key':         process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
      'Content-Type':      'application/json',
    },
    body: JSON.stringify({
      model:      'claude-haiku-4-5',
      max_tokens: 500,
      messages: [{
        role:    'user',
        content: `${PREMISA_PROMPT}Escribe un script de video de 60 segundos para TikTok y YouTube Shorts en español mexicano.

Tema: "${tema.titulo}"
${tema.pais ? `País: ${tema.pais === 'MX' ? 'México' : tema.pais === 'CO' ? 'Colombia' : 'Perú'}` : 'LATAM'}

Instrucciones:
- Usa el efecto Zeigarnik: abre con una pregunta o situación sin resolver, da contenido de valor real durante el video, y termina dejando una idea incompleta que genere curiosidad para buscar más
- El contenido debe ser 100% de valor para el mecánico, sin tono de venta ni mencionar TallerOS directamente
- Si mencionas una herramienta o sistema, hazlo de forma natural como referencia, nunca como anuncio
- Tono: como un colega mecánico exitoso que comparte lo que aprendió, directo y con lenguaje mexicano natural
- Estructura:
  [GANCHO - 5 seg]: Pregunta o dato que deja al espectador con la duda
  [CONTENIDO - 45 seg]: 3 puntos de valor real y accionable sobre el tema
  [CIERRE ZEIGARNIK - 10 seg]: Termina con una idea a medias o una pregunta que genera curiosidad, sin resolverla completamente
- Máximo 150 palabras
- Sin hashtags, sin emojis, solo el texto que va a decir el avatar
- Formato: texto plano`,
      }],
    }),
  })
  const data = await res.json()
  return data.content?.[0]?.text ?? ''
}

async function generarScriptLargo(tema: typeof TEMAS[0]): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key':         process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
      'Content-Type':      'application/json',
    },
    body: JSON.stringify({
      model:      'claude-haiku-4-5',
      max_tokens: 2000,
      messages: [{
        role:    'user',
        content: `${PREMISA_PROMPT}Escribe un script de video de 5 minutos para YouTube en español, estilo Alex Hormozi — directo, datos duros, sin relleno, ejemplos específicos, cada oración tiene que valer.

Tema: "${tema.titulo}"
${tema.pais ? `País: ${tema.pais === 'MX' ? 'México' : tema.pais === 'CO' ? 'Colombia' : 'Perú'}` : 'LATAM'}

Instrucciones:
- Tono: empresario exitoso que habla directo con otro empresario. Sin condescendencia, sin motivación barata
- Estructura:
  [GANCHO - 30 seg]: Dato duro o situación específica que golpea en los primeros 5 segundos. Sin introducción, sin "hola qué tal"
  [PROBLEMA - 60 seg]: El problema real con datos concretos. Por qué duele. Cuánto cuesta no resolverlo
  [MARCO - 60 seg]: La forma correcta de pensar sobre este problema. El insight que cambia la perspectiva
  [SOLUCIÓN - 120 seg]: 3 pasos concretos y accionables. Cada uno con un ejemplo específico de un taller real o situación real
  [OBJECIÓN - 30 seg]: La excusa más común que pone el mecánico para no hacer esto. Destrúyela con datos
  [CIERRE - 30 seg]: Qué pasa si lo hace vs si no lo hace. Sin CTA de venta, termina con una pregunta que los haga reflexionar
- Usa datos reales cuando puedas (porcentajes, pesos, tiempos)
- Menciona situaciones específicas de talleres en LATAM
- Nunca menciones TallerOS directamente
- Máximo 750 palabras (ritmo de 150 palabras por minuto)
- Sin hashtags, sin emojis, solo el texto que va a decir el avatar
- Formato: texto plano con saltos de línea entre secciones`,
      }],
    }),
  })
  const data = await res.json()
  return data.content?.[0]?.text ?? ''
}

function extractExcerpt(html: string): string {
  const match = html.match(/<p[^>]*>(.*?)<\/p>/s)
  if (!match) return ''
  return match[1].replace(/<[^>]+>/g, '').slice(0, 200).trim() + '...'
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Sin caché: la lectura de artículos/scripts para la reparación no debe
  // servirse del Data Cache de Next (evita reparaciones/duplicados por leer
  // estado viejo), igual que el fix del envío de scripts y del blog público.
  const supabase = createPublicReadClient()


  const diaDelAnio = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000)

  // El índice del día es el punto de PARTIDA: si ese tema ya se publicó
  // (colisión al ciclar el módulo), se avanza al siguiente disponible en vez
  // de saltarse el día — saltar dejaba días sin artículo nuevo.
  let tema: typeof TEMAS[0] | null = null
  for (let offset = 0; offset < TEMAS.length; offset++) {
    const candidato = TEMAS[(diaDelAnio + offset) % TEMAS.length]
    if (!(await slugExiste(supabase, candidato.slug))) {
      tema = candidato
      break
    }
  }

  if (!tema) {
    await enviarAlertaBlog(`Los ${TEMAS.length} temas del banco ya están publicados — hay que agregar temas nuevos en app/api/cron/blog/route.ts.`)
    return NextResponse.json({ ok: true, mensaje: 'Todos los temas ya están publicados.' })
  }

  const esDiaLargo = diaDelAnio % 2 === 0

  try {
    const [contenidoHtml, script, scriptLargo] = await Promise.all([
      generarArticulo(tema),
      generarScript(tema),
      esDiaLargo ? generarScriptLargo(tema) : Promise.resolve(''),
    ])

    if (!contenidoHtml) {
      return NextResponse.json({ error: 'Claude no devolvió contenido del artículo' }, { status: 500 })
    }

    const excerpt = extractExcerpt(contenidoHtml)

    // SECUENCIAL, no Promise.all: scripts_video.slug tiene una foreign key
    // hacia el artículo. En paralelo era una carrera — si el script llegaba
    // a la base antes de que el artículo estuviera confirmado, violaba la FK
    // (scripts_video_slug_fkey) y el artículo quedaba sin script (pasó el
    // 09/07, 12/07 y 14/07).
    const blogResult = await supabase.from('articulos_blog').insert({
      titulo:       tema.titulo,
      slug:         tema.slug,
      contenido:    contenidoHtml,
      excerpt,
      pais:         tema.pais,
      publicado:    true,
      published_at: new Date().toISOString(),
    })

    if (blogResult.error) throw new Error(`Blog insert error: ${blogResult.error.message}`)

    const scriptResult = await supabase.from('scripts_video').insert({
      slug:              tema.slug,
      titulo:            tema.titulo,
      script,
      duracion_segundos: 60,
      plataforma:        ['tiktok', 'youtube_shorts'],
      publicado:         false,
    })

    // El artículo ya quedó publicado: un fallo en el script no debe perderse
    // en silencio (dejaba artículos sin script y nadie se enteraba) pero
    // tampoco debe tirar la respuesta completa.
    if (scriptResult.error) {
      await enviarAlertaBlog(`El artículo "${tema.slug}" se publicó, pero falló el insert del script: ${scriptResult.error.message}`)
    }

    if (esDiaLargo && scriptLargo) {
      const { error: largoError } = await supabase.from('scripts_video_largo').insert({
        slug:             tema.slug,
        titulo:           tema.titulo,
        script:           scriptLargo,
        duracion_minutos: 5,
        email_enviado:    false,
      })
      if (largoError) {
        await enviarAlertaBlog(`El artículo "${tema.slug}" se publicó, pero falló el insert del script largo: ${largoError.message}`)
      }
    }

    // ── Reparación: artículos recientes que quedaron sin script ──────────────
    // (pasó el 09/07 y el 12/07: artículo publicado, insert del script fallido)
    try {
      // Ventana de 30 días y orden ASCENDENTE (más viejo primero): antes eran
      // 7 días + orden descendente, así que reparaba el artículo más RECIENTE y
      // los viejos se salían de la ventana antes de que les tocara turno (el del
      // 09/07 quedó huérfano porque siempre se reparaba el del día anterior).
      const { data: recientes } = await supabase
        .from('articulos_blog')
        .select('slug, titulo, pais')
        .eq('publicado', true)
        .gte('published_at', new Date(Date.now() - 30 * 86400000).toISOString())
        .order('published_at', { ascending: true })
        .limit(50)

      const slugs = (recientes ?? []).map(a => a.slug)
      const { data: conScript } = slugs.length
        ? await supabase.from('scripts_video').select('slug').in('slug', slugs)
        : { data: [] }
      const tienenScript = new Set((conScript ?? []).map(s => s.slug))
      const sinScript = (recientes ?? []).filter(a => !tienenScript.has(a.slug) && a.slug !== tema!.slug)

      // Máximo 1 reparación por corrida para no alargar la ejecución: se toma
      // el más viejo sin script (sinScript ya viene ordenado ascendente)
      if (sinScript.length > 0) {
        const pendiente = sinScript[0]
        const scriptReparado = await generarScript(pendiente as typeof TEMAS[0])
        if (scriptReparado) {
          const { error: repError } = await supabase.from('scripts_video').insert({
            slug:              pendiente.slug,
            titulo:            pendiente.titulo,
            script:            scriptReparado,
            duracion_segundos: 60,
            plataforma:        ['tiktok', 'youtube_shorts'],
            publicado:         false,
          })
          if (!repError) console.log(`[cron blog] script reparado para ${pendiente.slug} (${sinScript.length - 1} pendientes)`)
        }
      }
    } catch (e) {
      console.error('[cron blog] reparación de scripts falló:', e)
    }

    return NextResponse.json({
      ok:                 true,
      slug:               tema.slug,
      titulo:             tema.titulo,
      chars:              contenidoHtml.length,
      script_chars:       script.length,
      script_largo_chars: scriptLargo.length,
      dia_largo:          esDiaLargo,
    })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}