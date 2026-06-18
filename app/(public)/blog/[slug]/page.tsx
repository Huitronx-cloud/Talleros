export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { ArrowLeft, ArrowRight, Clock, Calendar } from 'lucide-react'
import type { Metadata } from 'next'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function getArticulo(slug: string) {
  try {
    const supabase = getSupabase()
    const { data } = await supabase
      .from('articulos_blog')
      .select('*')
      .eq('slug', slug)
      .eq('publicado', true)
      .single()
    return data
  } catch (e) {
    console.error('Error cargando articulo:', e)
    return null
  }
}

async function getRelacionados(slug: string) {
  try {
    const supabase = getSupabase()
    const { data } = await supabase
      .from('articulos_blog')
      .select('titulo, slug')
      .eq('publicado', true)
      .neq('slug', slug)
      .order('published_at', { ascending: false })
      .limit(3)
    return data ?? []
  } catch (e) {
    console.error('Error cargando relacionados:', e)
    return []
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const art = await getArticulo(params.slug)
  if (!art) return {}

  const descripcion = art.excerpt || art.titulo
  const url = `https://www.tallerosapp.com/blog/${art.slug}`

  return {
    title: `${art.titulo} | TallerOS`,
    description: descripcion,
    alternates: { canonical: `/blog/${art.slug}` },
    openGraph: {
      type: 'article',
      url,
      title: art.titulo,
      description: descripcion,
      publishedTime: art.published_at,
    },
    twitter: {
      card: 'summary_large_image',
      title: art.titulo,
      description: descripcion,
    },
  }
}

export default async function ArticuloPage({ params }: { params: { slug: string } }) {
  const art = await getArticulo(params.slug)
  if (!art) notFound()

  const rel = await getRelacionados(params.slug)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: art.titulo,
    description: art.excerpt,
    datePublished: art.published_at,
    dateModified: art.published_at,
    author: { '@type': 'Organization', name: 'TallerOS' },
    publisher: {
      '@type': 'Organization',
      name: 'TallerOS',
      logo: { '@type': 'ImageObject', url: 'https://www.tallerosapp.com/icon-512.png' },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': `https://www.tallerosapp.com/blog/${art.slug}` },
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <nav className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src="/icon-512.png" alt="TallerOS" className="w-7 h-7 rounded-lg" />
            <span className="font-bold text-gray-900">TallerOS</span>
          </Link>
          <Link href="/registro" className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
            Prueba gratis <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-10">
        <Link href="/blog" className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Blog
        </Link>

        <header className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 leading-tight mb-4">{art.titulo}</h1>
          <div className="flex items-center gap-4 text-sm text-gray-400">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              {new Date(art.published_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              5 min de lectura
            </span>
          </div>
        </header>

        <article
          className="blog-content"
          dangerouslySetInnerHTML={{ __html: art.contenido }}
        />

        <div className="my-10 bg-blue-50 border border-blue-200 rounded-2xl p-6 text-center">
          <p className="font-black text-gray-900 text-lg mb-2">¿Quieres implementar esto en tu taller?</p>
          <p className="text-gray-500 text-sm mb-4">TallerOS te ayuda a digitalizar tu taller en minutos. 14 días gratis, sin tarjeta.</p>
          <Link href="/registro" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl transition-colors">
            Empezar gratis <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {rel.length > 0 && (
          <div className="mt-12 pt-8 border-t border-gray-200">
            <h3 className="text-lg font-black text-gray-900 mb-5">También te puede interesar</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {rel.map((r: any) => (
                <Link key={r.slug} href={`/blog/${r.slug}`} className="group bg-white rounded-xl border border-gray-200 p-4 hover:border-blue-300 hover:shadow-sm transition-all">
                  <h4 className="text-sm font-bold text-gray-900 leading-snug group-hover:text-blue-600 transition-colors line-clamp-3">{r.titulo}</h4>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
