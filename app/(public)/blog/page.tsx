'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Clock, BookOpen, Loader2 } from 'lucide-react'

const PAIS_LABEL: Record<string, string> = {
  MX: '🇲🇽 México',
  CO: '🇨🇴 Colombia',
  PE: '🇵🇪 Perú',
}

export default function BlogPage() {
  const [articulos, setArticulos] = useState<any[]>([])
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    fetch('/api/blog')
      .then(r => r.json())
      .then(data => { setArticulos(data ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
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
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        ) : articulos.length === 0 ? (
          <div className="text-center py-20">
            <BookOpen className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400">Los artículos se están generando. Vuelve pronto.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articulos.map((art: any) => (
              <Link key={art.slug} href={`/blog/${art.slug}`} className="group bg-white rounded-2xl border border-gray-200 p-6 hover:border-blue-300 hover:shadow-md transition-all flex flex-col">
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
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="bg-blue-600 py-14 px-4 text-center">
        <div className="max-w-xl mx-auto">
          <h2 className="text-2xl font-black text-white mb-3">¿Listo para digitalizar tu taller?</h2>
          <p className="text-blue-100 mb-6 text-sm">14 días gratis. Sin tarjeta de crédito. Soporte en español.</p>
          <Link href="/registro" className="inline-flex items-center gap-2 bg-white text-blue-700 font-bold px-6 py-3 rounded-xl hover:bg-blue-50 transition-colors">
            Empezar gratis <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}