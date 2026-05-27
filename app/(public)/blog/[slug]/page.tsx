'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Clock, Calendar, Loader2 } from 'lucide-react'

export default function ArticuloPage() {
  const params                      = useParams()
  const slug                        = params.slug as string
  const [art, setArt]               = useState<any>(null)
  const [rel, setRel]               = useState<any[]>([])
  const [loading, setLoading]       = useState(true)
  const [notFound, setNotFound]     = useState(false)

  useEffect(() => {
    if (!slug) return
    fetch(`/api/blog/${slug}`)
      .then(r => {
        if (r.status === 404) { setNotFound(true); setLoading(false); return null }
        return r.json()
      })
      .then(data => {
        if (!data) return
        setArt(data)
        setLoading(false)
        fetch('/api/blog')
          .then(r => r.json())
          .then(all => setRel((all ?? []).filter((a: any) => a.slug !== slug).slice(0, 3)))
      })
      .catch(() => setLoading(false))
  }, [slug])

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
    </div>
  )

  if (notFound || !art) return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
      <p className="text-gray-500 text-lg font-semibold">Artículo no encontrado</p>
      <Link href="/blog" className="text-blue-600 hover:underline text-sm">← Volver al blog</Link>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-black">T</span>
            </div>
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