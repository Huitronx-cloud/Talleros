'use client'

import { useState } from 'react'
import { Orden } from '@/types'
import { MessageCircle, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react'

interface Props {
  orden: Orden
}

export default function BotonAvisarListo({ orden }: Props) {
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado]   = useState(false)
  const [error, setError]       = useState('')

  const handleAvisar = async () => {
    setEnviando(true)
    setError('')
    try {
      const res = await fetch('/api/notificaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo: 'orden_lista', ordenId: orden.id }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? 'No se pudo avisar al cliente.')
        return
      }
      setEnviado(true)
    } catch {
      setError('No se pudo avisar al cliente.')
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
    <div className="flex flex-col items-start gap-1">
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
      {error && (
        <span className="flex items-center gap-1 text-xs text-red-600">
          <AlertTriangle className="w-3 h-3" /> {error}
        </span>
      )}
    </div>
  )
}