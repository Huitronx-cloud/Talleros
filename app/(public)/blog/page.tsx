export const dynamic = 'force-dynamic'
export const revalidate = 0

import Image from 'next/image'
import Link from 'next/link'
import { createPublicReadClient } from '@/lib/supabase-public'
import { ArrowRight, Clock, BookOpen } from 'lucide-react'
import type { Metadata } from 'next'

const POR_PAGINA = 24   // múltiplo de 3, que es el número de columnas de la rejilla

const DESCRIPCION = 'Guías prácticas sobre gestión, clientes, tecnología y marketing para dueños de talleres mecánicos en México, Colombia y Perú.'

function leerPagina(searchParams?: { page?: string }): number {
  const n = parseInt(searchParams?.page ?? '1', 10)
  return Number.isFinite(n) && n > 1 ? n : 1
}

// Cada página se apunta a sí misma con la canónica. Si todas apuntaran a /blog,
// Google trataría las páginas 2 en adelante como duplicados de la primera.
export function generateMetadata({ searchParams }: { searchParams?: { page?: string } }): Metadata {
  const pagina = leerPagina(searchParams)
  const ruta   = pagina > 1 ? `/blog?page=${pagina}` : '/blog'
  const titulo = pagina > 1
    ? `Blog para talleres mecánicos — página ${pagina} | TallerOS`
    : 'Blog para talleres mecánicos — Gestión, clientes y tecnología | TallerOS'

  return {
    title: titulo,
    description: DESCRIPCION,
    alternates: { canonical: ruta },
    openGraph: {
      type: 'website',
      url: `https://www.tallerosapp.com${ruta}`,
      title: pagina > 1 ? `Blog para talleres mecánicos — página ${pagina}` : 'Blog para talleres mecánicos — TallerOS',
      description: DESCRIPCION,
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Blog para talleres mecánicos — TallerOS',
      description: 'Guías prácticas sobre gestión, clientes, tecnología y marketing para dueños de talleres mecánicos.',
    },
  }
}

const PAIS_LABEL: Record<string, string> = {
  MX: '🇲🇽 México',
  CO: '🇨🇴 Colombia',
  PE: '🇵🇪 Perú',
}

// Antes pedía .limit(50) sin paginar. Con 77 artículos publicados eso dejaba 27
// fuera de toda página del sitio: existían y estaban en el sitemap, pero ningún
// enlace llevaba a ellos, y el número crecía uno por día porque el cron publica
// a diario y el tope no se movía.
async function getArticulos(pagina: number) {
  try {
    const supabase = createPublicReadClient()
    const desde = (pagina - 1) * POR_PAGINA
    const { data, count } = await supabase
      .from('articulos_blog')
      .select('titulo, slug, excerpt, pais, published_at, imagen_url', { count: 'exact' })
      .eq('publicado', true)
      .order('published_at', { ascending: false })
      .range(desde, desde + POR_PAGINA - 1)
    return { articulos: data ?? [], total: count ?? 0 }
  } catch (e) {
    console.error('Error cargando articulos_blog:', e)
    return { articulos: [], total: 0 }
  }
}

export default async function BlogPage({ searchParams }: { searchParams?: { page?: string } }) {
  const pagina = leerPagina(searchParams)
  const { articulos, total } = await getArticulos(pagina)
  const totalPaginas = Math.max(1, Math.ceil(total / POR_PAGINA))

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/icon-512.png" alt="TallerOS" width={56} height={56} className="w-7 h-7 rounded-lg" />
            <span className="font-bold text-gray-900">TallerOS</span>
          </Link>
          <Link href="/registro" className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
            Prueba gratis <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </nav>

      <div className="bg-white border-b border-gray-200 px-4 py-14 text-center">
        <div className="max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-5">
            <BookOpen className="w-3.5 h-3.5" />
            Recursos para talleres mecánicos
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 mb-4">
            Aprende a hacer crecer tu taller
          </h1>
          <p className="text-gray-500 text-base leading-relaxed">
            Guías prácticas sobre gestión, clientes, tecnología y marketing para dueños de talleres mecánicos en México, Colombia y Perú.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-12">
        {articulos.length === 0 ? (
          <div className="text-center py-20">
            <BookOpen className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400">Los artículos se están generando. Vuelve pronto.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articulos.map((art: any) => (
              <Link key={art.slug} href={`/blog/${art.slug}`} className="group bg-white rounded-2xl border border-gray-200 overflow-hidden hover:border-blue-300 hover:shadow-md transition-all flex flex-col">
                {/* La portada solo aparece si el artículo tiene una: los que no
                    la tengan siguen viéndose como hasta ahora, sin un hueco. */}
                {art.imagen_url && (
                  <div className="relative aspect-[16/9] bg-gray-100 overflow-hidden">
                    <Image
                      src={art.imagen_url}
                      alt={art.titulo}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                )}
                <div className="p-6 flex flex-col flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    {art.pais && (
                      <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                        {PAIS_LABEL[art.pais] ?? art.pais}
                      </span>
                    )}
                    <span className="text-xs text-gray-400 flex items-center gap-1 ml-auto">
                      <Clock className="w-3 h-3" />
                      {new Date(art.published_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  <h2 className="text-base font-bold text-gray-900 leading-snug mb-3 group-hover:text-blue-600 transition-colors flex-1">
                    {art.titulo}
                  </h2>
                  {art.excerpt && (
                    <p className="text-sm text-gray-500 leading-relaxed line-clamp-3 mb-4">{art.excerpt}</p>
                  )}
                  <span className="text-sm font-semibold text-blue-600 flex items-center gap-1 mt-auto">
                    Leer artículo <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}

        {totalPaginas > 1 && (
          // Enlaces de verdad, no botones con JavaScript: si Google no puede
          // seguirlos, los artículos de las páginas siguientes vuelven a quedar
          // sin ningún enlace que lleve a ellos, que es el problema que esto
          // viene a resolver.
          <nav className="mt-12 flex items-center justify-center gap-2 flex-wrap" aria-label="Paginación del blog">
            {pagina > 1 && (
              <Link
                href={pagina === 2 ? '/blog' : `/blog?page=${pagina - 1}`}
                rel="prev"
                className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm font-semibold text-gray-700 hover:border-blue-400 hover:text-blue-600 transition-colors"
              >
                ← Anterior
              </Link>
            )}

            {Array.from({ length: totalPaginas }, (_, i) => i + 1).map(n => (
              <Link
                key={n}
                href={n === 1 ? '/blog' : `/blog?page=${n}`}
                aria-current={n === pagina ? 'page' : undefined}
                className={`w-10 h-10 flex items-center justify-center rounded-lg text-sm font-semibold transition-colors ${
                  n === pagina
                    ? 'bg-blue-600 text-white'
                    : 'border border-gray-300 bg-white text-gray-700 hover:border-blue-400 hover:text-blue-600'
                }`}
              >
                {n}
              </Link>
            ))}

            {pagina < totalPaginas && (
              <Link
                href={`/blog?page=${pagina + 1}`}
                rel="next"
                className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm font-semibold text-gray-700 hover:border-blue-400 hover:text-blue-600 transition-colors"
              >
                Siguiente →
              </Link>
            )}
          </nav>
        )}

        {total > 0 && (
          <p className="mt-6 text-center text-xs text-gray-400">
            {total} artículos · página {pagina} de {totalPaginas}
          </p>
        )}
      </div>

      <div className="bg-blue-600 py-14 px-4 text-center">
        <div className="max-w-xl mx-auto">
          <h2 className="text-2xl font-black text-white mb-3">¿Listo para digitalizar tu taller?</h2>
          <p className="text-blue-100 mb-6 text-sm">Gratis para siempre. Sin tarjeta de crédito. Soporte en español.</p>
          <Link href="/registro" className="inline-flex items-center gap-2 bg-white text-blue-700 font-bold px-6 py-3 rounded-xl hover:bg-blue-50 transition-colors">
            Empezar gratis <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}
