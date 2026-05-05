'use client'

import { useState } from 'react'
import { Orden } from '@/types'
import { MessageCircle, Loader2, CheckCircle2 } from 'lucide-react'

interface Props {
  orden: Orden
}

export default function BotonAvisarListo({ orden }: Props) {
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado]   = useState(false)

  const handleAvisar = async () => {
    setEnviando(true)
    try {
      await fetch('/api/notificaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo: 'orden_lista', ordenId: orden.id }),
      })
      setEnviado(true)
    } finally {
      setEnviando(false)
    }
  }

  if (enviado) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-2.5 bg-green-50 text-green-600 rounded-lg text-xs font-semibold">
        <CheckCircle2 className="w-3.5 h-3.5" /> Avisado
      </div>
    )
  }

  return (
    <button
      onClick={handleAvisar}
      disabled={enviando || !orden.clientes?.telefono}
      title={!orden.clientes?.telefono ? 'El cliente no tiene teléfono registrado' : ''}
      className="flex items-center gap-1.5 px-3 py-2.5 bg-green-100 hover:bg-green-200 disabled:opacity-40 text-green-700 rounded-lg text-xs font-semibold transition-colors"
    >
      {enviando
        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
        : <MessageCircle className="w-3.5 h-3.5" />
      }
      Avisar WA
    </button>
  )
}