'use client'

import { useState } from 'react'
import { X, Wrench } from 'lucide-react'

interface Props {
  logoUrl:      string | null
  nombreTaller: string
}

export default function LogoFullscreen({ logoUrl, nombreTaller }: Props) {
  const [abierto, setAbierto] = useState(false)

  return (
    <>
      {/* Logo clickeable */}
      <button
        onClick={() => setAbierto(true)}
        className="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0 bg-gray-800 flex items-center justify-center hover:ring-2 hover:ring-blue-500 transition-all"
        title="Ver logo"
      >
        {logoUrl ? (
          <img src={logoUrl} alt={nombreTaller} className="w-full h-full object-contain" />
        ) : (
          <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
            <Wrench className="w-4 h-4 text-white" />
          </div>
        )}
      </button>

      {/* Modal fullscreen */}
      {abierto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.92)' }}
          onClick={() => setAbierto(false)}
        >
          <button
            onClick={() => setAbierto(false)}
            className="absolute top-6 right-6 text-white/60 hover:text-white transition-colors"
          >
            <X className="w-8 h-8" />
          </button>

          <div
            className="flex flex-col items-center gap-6 p-8"
            onClick={e => e.stopPropagation()}
          >
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={nombreTaller}
                className="max-w-sm max-h-64 object-contain drop-shadow-2xl"
              />
            ) : (
              <div className="w-40 h-40 bg-blue-600 rounded-3xl flex items-center justify-center shadow-2xl">
                <Wrench className="w-20 h-20 text-white" />
              </div>
            )}
            <p className="text-white text-2xl font-bold tracking-tight">
              {nombreTaller}
            </p>
            <p className="text-white/40 text-sm">
              Click fuera para cerrar
            </p>
          </div>
        </div>
      )}
    </>
  )
}