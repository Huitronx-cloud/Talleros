import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { createClient } from '@supabase/supabase-js'

const TEMAS = [
  { titulo: 'Por qué los talleres mecánicos pierden clientes sin saberlo',                slug: 'talleres-mecanicos-pierden-clientes',            pais: null },
  { titulo: 'El error más caro que cometen los talleres mecánicos en México',             slug: 'error-caro-talleres-mecanicos-mexico',           pais: 'MX' },
  { titulo: 'Por qué el 63% de los clientes desconfía de los talleres mecánicos',        slug: 'clientes-desconfian-talleres-mecanicos',         pais: null },
  { titulo: 'Cómo evitar conflictos con clientes en tu taller mecánico',                 slug: 'evitar-conflictos-clientes-taller-mecanico',     pais: null },
  { titulo: 'Por qué los talleres que no piden reseñas pierden frente a la competencia', slug: 'talleres-sin-resenas-pierden-competencia',       pais: null },
  { titulo: 'Cómo usar WhatsApp para aumentar las ventas de tu taller mecánico',         slug: 'whatsapp-ventas-taller-mecanico',                pais: null },
  { titulo: 'Cómo aprobar reparaciones por WhatsApp y eliminar malentendidos',           slug: 'aprobar-reparaciones-whatsapp-taller',           pais: null },
  { titulo: 'Mensajes de WhatsApp que convierten clientes en tu taller mecánico',        slug: 'mensajes-whatsapp-clientes-taller',              pais: null },
  { titulo: 'Cómo conseguir más reseñas en Google para tu taller mecánico',              slug: 'conseguir-resenas-google-taller-mecanico',       pais: null },
  { titulo: 'Guía completa de reseñas en Google para talleres mecánicos en LATAM',       slug: 'resenas-google-talleres-mecanicos-latam',        pais: null },
  { titulo: 'Cuántas reseñas de Google necesita tu taller para conseguir más clientes',  slug: 'cuantas-resenas-google-taller-mecanico',         pais: null },
  { titulo: 'Cómo organizar las órdenes de trabajo en tu taller mecánico',               slug: 'organizar-ordenes-trabajo-taller-mecanico',      pais: null },
  { titulo: 'Tablero Kanban para talleres mecánicos: qué es y cómo usarlo',              slug: 'kanban-taller-mecanico',                         pais: null },
  { titulo: 'Cómo llevar el inventario de un taller mecánico sin perder dinero',         slug: 'inventario-taller-mecanico',                     pais: null },
  { titulo: 'Cotizaciones profesionales en tu taller: cómo hacerlas bien',               slug: 'cotizaciones-profesionales-taller-mecanico',     pais: null },
  { titulo: 'Cómo calcular el precio de tus servicios en un taller mecánico',            slug: 'calcular-precios-servicios-taller-mecanico',     pais: null },
  { titulo: 'Cómo fidelizar clientes en un taller mecánico',                             slug: 'fidelizar-clientes-taller-mecanico',             pais: null },
  { titulo: 'Recordatorios de mantenimiento: la estrategia que recupera clientes',       slug: 'recordatorios-mantenimiento-clientes-taller',    pais: null },
  { titulo: 'Cómo hacer que tus clientes regresen a tu taller mecánico',                 slug: 'clientes-regresen-taller-mecanico',              pais: null },
  { titulo: 'Portal del cliente para talleres mecánicos: qué es y por qué importa',      slug: 'portal-cliente-taller-mecanico',                 pais: null },
  { titulo: 'Software para talleres mecánicos en México: guía completa 2026',            slug: 'software-talleres-mecanicos-mexico-2026',        pais: 'MX' },
  { titulo: 'Software para talleres mecánicos en Colombia: guía completa 2026',          slug: 'software-talleres-mecanicos-colombia-2026',      pais: 'CO' },
  { titulo: 'Software para talleres mecánicos en Perú: guía completa 2026',              slug: 'software-talleres-mecanicos-peru-2026',          pais: 'PE' },
  { titulo: 'Cómo digitalizar un taller mecánico en Monterrey',                          slug: 'digitalizar-taller-mecanico-monterrey',          pais: 'MX' },
  { titulo: 'Cómo digitalizar un taller mecánico en Bogotá',                             slug: 'digitalizar-taller-mecanico-bogota',             pais: 'CO' },
  { titulo: 'Digitalizar tu taller mecánico: por dónde empezar',                         slug: 'digitalizar-taller-mecanico-por-donde-empezar',  pais: null },
  { titulo: 'Software de gestión para talleres mecánicos: qué buscar en 2026',           slug: 'software-gestion-talleres-mecanicos-2026',       pais: null },
  { titulo: 'Taller mecánico sin papel: cómo hacer la transición',                       slug: 'taller-mecanico-sin-papel',                      pais: null },
  { titulo: 'Cómo un taller mecánico puede conseguir más clientes con tecnología',       slug: 'taller-mecanico-conseguir-clientes-tecnologia',  pais: null },
  { titulo: 'Garantía digital en talleres mecánicos: cómo proteger tu negocio',          slug: 'garantia-digital-taller-mecanico',               pais: null },
]

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
      model:      'claude-haiku-4-5',
      max_tokens: 2000,
      messages: [{
        role:    'user',
        content: `Escribe un artículo de blog en español para dueños de talleres mecánicos en Latinoamérica.

Título: "${tema.titulo}"
${tema.pais ? `País objetivo: ${tema.pais === 'MX' ? 'México' : tema.pais === 'CO' ? 'Colombia' : 'Perú'}` : ''}

Instrucciones:
- Tono: directo, práctico, sin rodeos. Habla de tú a tú con el dueño de taller.
- Longitud: 700-900 palabras
- Estructura: introducción con gancho, 3-4 secciones con subtítulos H2, conclusión con CTA
- Incluye datos reales cuando aplique (ej: "el 97% de los clientes lee reseñas antes de elegir un taller")
- Al final menciona naturalmente que TallerOS resuelve el problema principal del artículo, con un CTA a https://www.tallerosapp.com/registro
- Formato: HTML limpio con etiquetas <h2>, <p>, <ul>, <li>, <strong>. Sin <html>, <body>, <head>, <article> ni <h1> (el título ya se muestra aparte, no lo repitas).
- NO uses markdown, solo HTML. No envuelvas la respuesta en \`\`\`html ni en ningún code fence.
- El artículo debe posicionar en Google para la keyword principal del título`,
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
        content: `Escribe un script de video de 60 segundos para TikTok y YouTube Shorts en español mexicano.

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
        content: `Escribe un script de video de 5 minutos para YouTube en español, estilo Alex Hormozi — directo, datos duros, sin relleno, ejemplos específicos, cada oración tiene que valer.

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

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  await limpiarArticulosExistentes(supabase)

  const diaDelAnio = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000)
  const tema = TEMAS[diaDelAnio % TEMAS.length]

  const existe = await slugExiste(supabase, tema.slug)
  if (existe) {
    return NextResponse.json({ ok: true, mensaje: `Artículo "${tema.slug}" ya existe, saltando.` })
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

    const [blogResult, scriptResult] = await Promise.all([
      supabase.from('articulos_blog').insert({
        titulo:       tema.titulo,
        slug:         tema.slug,
        contenido:    contenidoHtml,
        excerpt,
        pais:         tema.pais,
        publicado:    true,
        published_at: new Date().toISOString(),
      }),
      supabase.from('scripts_video').insert({
        slug:              tema.slug,
        titulo:            tema.titulo,
        script,
        duracion_segundos: 60,
        plataforma:        ['tiktok', 'youtube_shorts'],
        publicado:         false,
      }),
    ])

    if (blogResult.error) throw new Error(`Blog insert error: ${blogResult.error.message}`)
    if (scriptResult.error) throw new Error(`Script insert error: ${scriptResult.error.message}`)

    if (esDiaLargo && scriptLargo) {
      const { error: largoError } = await supabase.from('scripts_video_largo').insert({
        slug:             tema.slug,
        titulo:           tema.titulo,
        script:           scriptLargo,
        duracion_minutos: 5,
        email_enviado:    false,
      })
      if (largoError) throw new Error(`Script largo insert error: ${largoError.message}`)
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