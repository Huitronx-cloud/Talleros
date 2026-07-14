import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
// La generación con Claude (artículo + scripts) tarda más que el default:
// sin esto la función puede morir a medias (artículo sin script).
export const maxDuration = 60
import { createClient } from '@supabase/supabase-js'

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

const TEMAS = [
  // Administración
  { titulo: 'Cómo administrar un taller mecánico sin perder el control',                          slug: 'administrar-taller-mecanico-sin-perder-control',        pais: null },
  { titulo: 'Los errores de administración que más le cuestan a un taller mecánico',              slug: 'errores-administracion-taller-mecanico',                pais: null },
  { titulo: 'Cómo organizar el día a día de un taller con varios mecánicos',                      slug: 'organizar-dia-taller-varios-mecanicos',                 pais: null },

  // Rentabilidad
  { titulo: 'Cuánto debería ganar realmente un taller mecánico al mes',                           slug: 'cuanto-debe-ganar-taller-mecanico',                     pais: null },
  { titulo: 'Por qué tu taller trabaja mucho y gana poco',                                        slug: 'taller-trabaja-mucho-gana-poco',                        pais: null },
  { titulo: 'Cómo saber si tu taller mecánico es rentable de verdad',                             slug: 'taller-mecanico-rentable-de-verdad',                    pais: null },

  // Personas
  { titulo: 'Cómo delegar tareas en tu taller mecánico y dejar de hacerlo todo tú',              slug: 'delegar-tareas-taller-mecanico',                        pais: null },
  { titulo: 'Cómo contratar al mecánico correcto para tu taller',                                 slug: 'contratar-mecanico-correcto-taller',                    pais: null },

  // Digitalización
  { titulo: 'Digitalizar tu taller mecánico: por dónde empezar',                                  slug: 'digitalizar-taller-mecanico-por-donde-empezar',         pais: null },
  { titulo: 'Órdenes de trabajo digitales vs papel: qué conviene más',                            slug: 'ordenes-trabajo-digitales-vs-papel-taller',             pais: null },

  // Marketing
  { titulo: 'Marketing de boca en boca: cómo activarlo en tu taller mecánico',                   slug: 'marketing-boca-en-boca-taller-mecanico',               pais: null },
  { titulo: 'Redes sociales para talleres mecánicos: qué publicar para generar confianza',        slug: 'redes-sociales-taller-mecanico-confianza',              pais: null },
  { titulo: 'Marketing para talleres mecánicos: por dónde empezar sin gastar en publicidad',      slug: 'marketing-taller-mecanico-sin-publicidad',              pais: null },
  { titulo: 'Cómo conseguir más clientes para tu taller mecánico sin bajar precios',              slug: 'conseguir-clientes-taller-mecanico-sin-bajar-precios',  pais: null },

  // ── Fondo de embudo (intención comercial) ──────────────────────────────────
  { titulo: 'Sistema de gestión para taller mecánico: qué es y cómo elegir el mejor',            slug: 'sistema-gestion-taller-mecanico-como-elegir',           pais: null },
  { titulo: 'Cuánto cuesta un software para taller mecánico en México',                           slug: 'cuanto-cuesta-software-taller-mecanico-mexico',         pais: 'MX' },
  { titulo: 'TallerOS vs Excel: por qué una hoja de cálculo no alcanza para gestionar un taller', slug: 'tallerados-vs-excel-gestion-taller',                    pais: null },
  { titulo: 'Los mejores software para talleres mecánicos en LATAM: comparativa 2026',            slug: 'mejores-software-talleres-mecanicos-latam-2026',        pais: null },
  { titulo: 'Cómo hacer una orden de trabajo profesional en tu taller mecánico',                  slug: 'orden-trabajo-profesional-taller-mecanico',             pais: null },
  { titulo: 'Cómo cobrar mejor en tu taller: facturación digital sin errores',                    slug: 'cobrar-mejor-taller-mecanico-facturacion-digital',      pais: null },

  // ── Geolocalización ────────────────────────────────────────────────────────
  { titulo: 'Cómo digitalizar un taller mecánico en Guadalajara',                                 slug: 'digitalizar-taller-mecanico-guadalajara',               pais: 'MX' },
  { titulo: 'Cómo digitalizar un taller mecánico en Bogotá',                                      slug: 'digitalizar-taller-mecanico-bogota',                    pais: 'CO' },
  { titulo: 'Cómo digitalizar un taller mecánico en Lima',                                        slug: 'digitalizar-taller-mecanico-lima',                      pais: 'PE' },
  { titulo: 'Software para talleres mecánicos en Guadalajara: guía 2026',                         slug: 'software-talleres-mecanicos-guadalajara-2026',          pais: 'MX' },
  { titulo: 'Software para talleres mecánicos en Monterrey: guía 2026',                           slug: 'software-talleres-mecanicos-monterrey-2026',            pais: 'MX' },

  // ── Nuevos temas ──────────────────────────────────────────────────────────
  { titulo: 'Por qué los talleres mecánicos pierden clientes sin saberlo',                       slug: 'talleres-mecanicos-pierden-clientes',                pais: null },
  { titulo: 'El error más caro que cometen los talleres mecánicos',                              slug: 'error-mas-caro-talleres-mecanicos',                  pais: null },
  { titulo: 'Cómo administrar un taller mecánico sin perder el control',                         slug: 'administrar-taller-mecanico-sin-perder-control',     pais: null },
  { titulo: 'Los errores de administración que más le cuestan a un taller mecánico',             slug: 'errores-administracion-taller-mecanico',             pais: null },
  { titulo: 'Cómo organizar el día a día de un taller con varios mecánicos',                     slug: 'organizar-dia-taller-varios-mecanicos',              pais: null },
  { titulo: 'Cómo organizar las órdenes de trabajo en tu taller mecánico',                       slug: 'organizar-ordenes-trabajo-taller-mecanico',          pais: null },
  { titulo: 'Tablero Kanban para talleres mecánicos: qué es y cómo usarlo',                      slug: 'kanban-taller-mecanico',                             pais: null },
  { titulo: 'Cómo llevar el inventario de un taller mecánico sin perder dinero',                 slug: 'inventario-taller-mecanico',                         pais: null },
  { titulo: 'Cotizaciones profesionales en tu taller: cómo hacerlas bien',                       slug: 'cotizaciones-profesionales-taller-mecanico',         pais: null },
  { titulo: 'Cómo calcular el precio de tus servicios en un taller mecánico',                    slug: 'calcular-precios-servicios-taller-mecanico',         pais: null },
  { titulo: 'Garantía digital en talleres mecánicos: cómo proteger tu negocio',                  slug: 'garantia-digital-taller-mecanico',                   pais: null },
  { titulo: 'Digitalizar tu taller mecánico: por dónde empezar',                                 slug: 'digitalizar-taller-mecanico-por-donde-empezar',      pais: null },
  { titulo: 'Taller mecánico sin papel: cómo hacer la transición',                               slug: 'taller-mecanico-sin-papel',                          pais: null },

  // El negocio: rentabilidad y finanzas del taller
  { titulo: 'Cuánto debería ganar realmente un taller mecánico al mes',                          slug: 'cuanto-debe-ganar-taller-mecanico',                  pais: null },
  { titulo: 'Por qué tu taller trabaja mucho y gana poco',                                       slug: 'taller-trabaja-mucho-gana-poco',                     pais: null },
  { titulo: 'Cómo saber si tu taller mecánico es rentable de verdad',                            slug: 'taller-mecanico-rentable-de-verdad',                 pais: null },

  // Consejos para dueños de taller
  { titulo: 'Cómo delegar tareas en tu taller mecánico y dejar de hacerlo todo tú',               slug: 'delegar-tareas-taller-mecanico',                     pais: null },
  { titulo: 'Cómo contratar al mecánico correcto para tu taller',                                slug: 'contratar-mecanico-correcto-taller',                 pais: null },
  { titulo: 'Consejos para dueños de taller que están empezando',                                slug: 'consejos-duenos-taller-que-empiezan',                pais: null },
  { titulo: 'Cómo un dueño de taller puede dejar de trabajar 12 horas al día',                   slug: 'dueno-taller-dejar-trabajar-12-horas',               pais: null },

  // Marketing para talleres mecánicos
  { titulo: 'Por qué el 63% de los clientes desconfía de los talleres mecánicos',                slug: 'clientes-desconfian-talleres-mecanicos',             pais: null },
  { titulo: 'Cómo evitar conflictos con clientes en tu taller mecánico',                         slug: 'evitar-conflictos-clientes-taller-mecanico',         pais: null },
  { titulo: 'Por qué los talleres que no piden reseñas pierden frente a la competencia',         slug: 'talleres-sin-resenas-pierden-competencia',           pais: null },
  { titulo: 'Cómo usar WhatsApp para aumentar las ventas de tu taller mecánico',                 slug: 'whatsapp-ventas-taller-mecanico',                    pais: null },
  { titulo: 'Cómo aprobar reparaciones por WhatsApp y eliminar malentendidos',                   slug: 'aprobar-reparaciones-whatsapp-taller',               pais: null },
  { titulo: 'Mensajes de WhatsApp que convierten clientes en tu taller mecánico',                slug: 'mensajes-whatsapp-clientes-taller',                  pais: null },
  { titulo: 'Cómo conseguir más reseñas en Google para tu taller mecánico',                      slug: 'conseguir-resenas-google-taller-mecanico',           pais: null },
  { titulo: 'Guía completa de reseñas en Google para talleres mecánicos en LATAM',               slug: 'resenas-google-talleres-mecanicos-latam',            pais: null },
  { titulo: 'Cuántas reseñas de Google necesita tu taller para conseguir más clientes',          slug: 'cuantas-resenas-google-taller-mecanico',             pais: null },
  { titulo: 'Marketing de boca en boca: cómo activarlo en tu taller mecánico',                   slug: 'marketing-boca-en-boca-taller-mecanico',             pais: null },
  { titulo: 'Redes sociales para talleres mecánicos: qué publicar para generar confianza',       slug: 'redes-sociales-taller-mecanico-confianza',           pais: null },
  { titulo: 'Marketing para talleres mecánicos: por dónde empezar sin gastar en publicidad',     slug: 'marketing-taller-mecanico-sin-publicidad',           pais: null },

  // Cómo conseguir y retener más clientes
  { titulo: '5 señales de que tu taller mecánico está perdiendo clientes sin darte cuenta',      slug: 'senales-taller-mecanico-pierde-clientes',            pais: null },
  { titulo: 'Cómo conseguir más clientes para tu taller mecánico sin bajar precios',             slug: 'conseguir-clientes-taller-mecanico-sin-bajar-precios', pais: null },
  { titulo: 'Cómo un taller mecánico puede conseguir más clientes con tecnología',                slug: 'taller-mecanico-conseguir-clientes-tecnologia',      pais: null },
  { titulo: 'Cómo fidelizar clientes en un taller mecánico',                                     slug: 'fidelizar-clientes-taller-mecanico',                 pais: null },
  { titulo: 'Recordatorios de mantenimiento: la estrategia que recupera clientes',                slug: 'recordatorios-mantenimiento-clientes-taller',        pais: null },
  { titulo: 'Cómo hacer que tus clientes regresen a tu taller mecánico',                         slug: 'clientes-regresen-taller-mecanico',                  pais: null },
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
      model:      'claude-sonnet-4-6',
      max_tokens: 2000,
      messages: [{
        role:    'user',
        content: `Escribe un artículo de blog SEO-optimizado en español para dueños de talleres mecánicos en Latinoamérica.

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
    await enviarAlertaBlog('Los 68 temas del banco ya están publicados — hay que agregar temas nuevos.')
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
      const { data: recientes } = await supabase
        .from('articulos_blog')
        .select('slug, titulo, pais')
        .eq('publicado', true)
        .gte('published_at', new Date(Date.now() - 7 * 86400000).toISOString())
        .order('published_at', { ascending: false })
        .limit(10)

      const slugs = (recientes ?? []).map(a => a.slug)
      const { data: conScript } = slugs.length
        ? await supabase.from('scripts_video').select('slug').in('slug', slugs)
        : { data: [] }
      const tienenScript = new Set((conScript ?? []).map(s => s.slug))
      const sinScript = (recientes ?? []).filter(a => !tienenScript.has(a.slug) && a.slug !== tema!.slug)

      // Máximo 1 reparación por corrida para no alargar la ejecución
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