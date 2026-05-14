'use client'

import { useState, useEffect } from 'react'
import { Smartphone, X } from 'lucide-react'
import Link from 'next/link'

const MAX_VISTAS = 3
const KEY = 'talleros_instalar_vistas'

export default function BannerInstalar() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // No mostrar si ya está instalada como PWA
    if (window.matchMedia('(display-mode: standalone)').matches) return

    const vistas = parseInt(localStorage.getItem(KEY) ?? '0')
    if (vistas < MAX_VISTAS) {
      setVisible(true)
      localStorage.setItem(KEY, String(vistas + 1))
    }
  }, [])

  if (!visible) return null

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-4">
      <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
        <Smartphone className="w-5 h-5 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-blue-900">
          Instala TallerOS en tu teléfono
        </p>
        <p className="text-xs text-blue-600 mt-0.5">
          Accede más rápido y recibe notificaciones en tiempo real.
        </p>
      </div>
      <Link
        href="/ayuda/instalar"
        className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors"
      >
        Ver cómo
      </Link>
      <button
        onClick={() => {
          setVisible(false)
          localStorage.setItem(KEY, String(MAX_VISTAS))
        }}
        className="shrink-0 text-blue-400 hover:text-blue-600 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}