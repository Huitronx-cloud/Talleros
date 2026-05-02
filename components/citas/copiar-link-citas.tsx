'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

export default function CopiarLinkCitas({ link }: { link: string }) {
  const [copiado, setCopiado] = useState(false)

  const copiar = () => {
    navigator.clipboard.writeText(link)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  return (
    <div className="flex items-center gap-3">
      <div className="text-right">
        <p className="text-xs text-gray-400">Link público de citas</p>
        <p className="text-xs font-mono text-blue-600 truncate max-w-xs">{link}</p>
      </div>
      <button
        onClick={copiar}
        className="flex items-center gap-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg transition-colors"
      >
        {copiado ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
        {copiado ? 'Copiado' : 'Copiar link'}
      </button>
    </div>
  )
}