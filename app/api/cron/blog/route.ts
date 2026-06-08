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

async function slugExiste(supabase: ReturnType<typeof createClient>, slug: string): Promise<boolean> {
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
      model:      'claude-opus-4-5',
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
- Formato: HTML limpio con etiquetas <h2>, <p>, <ul>, <li>, <strong>. Sin <html>, <body>, ni <head>.
- NO uses markdown, solo HTML
- El artículo debe posicionar en Google para la keyword principal del título`,
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

  const diaDelAnio = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000)
  const tema = TEMAS[diaDelAnio % TEMAS.length]

  const existe = await slugExiste(tema.slug)
  if (existe) {
    return NextResponse.json({ ok: true, mensaje: `Artículo "${tema.slug}" ya existe, saltando.` })
  }

  try {
    const contenidoHtml = await generarArticulo(tema)
    if (!contenidoHtml) {
      return NextResponse.json({ error: 'Claude no devolvió contenido' }, { status: 500 })
    }

    const excerpt = extractExcerpt(contenidoHtml)

    await supabase.from('articulos_blog').insert({
      titulo:       tema.titulo,
      slug:         tema.slug,
      contenido:    contenidoHtml,
      excerpt,
      pais:         tema.pais,
      publicado:    true,
      published_at: new Date().toISOString(),
    })

    return NextResponse.json({ ok: true, slug: tema.slug, titulo: tema.titulo, chars: contenidoHtml.length })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}