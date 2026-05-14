'use client'

import { useState } from 'react'
import { Copy, Check, Share2 } from 'lucide-react'

export default function CopiarLinkCitas({ link }: { link: string }) {
  const [copiado, setCopiado] = useState(false)

  const copiar = () => {
    navigator.clipboard.writeText(link)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  const compartir = async () => {
    if (navigator.share) {
      await navigator.share({
        title: 'Agenda tu cita',
        text: 'Agenda tu cita en nuestro taller',
        url: link,
      })
    } else {
      copiar()
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 max-w-xs w-full sm:w-auto">
        <p className="text-xs font-mono text-blue-600 truncate flex-1">{link}</p>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={copiar}
          className="flex items-center gap-1.5 text-xs bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-3 py-2 rounded-lg transition-colors"
        >
          {copiado ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
          {copiado ? 'Copiado' : 'Copiar'}
        </button>
        <button
          onClick={compartir}
          className="flex items-center gap-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg transition-colors"
        >
          <Share2 className="w-3.5 h-3.5" />
          Compartir
        </button>
      </div>
    </div>
  )
}