'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { AlertTriangle, Zap, X } from 'lucide-react'
const PLANES = {
  esencial_mensual: 'price_1TVAoRRFpmo4G9XHOUNFQDGJ',
  esencial_anual:   'price_1TVApHRFpmo4G9XHrbpflGrA',
  pro_mensual:      'price_1TVApeRFpmo4G9XHUD6EDGbQ',
  pro_anual:        'price_1TVAq3RFpmo4G9XHKh2QHkjK',
}

export default function BannerUpgrade({ tallerId }: { tallerId?: string }) {
  const [suscripcion, setSuscripcion] = useState<any>(null)
  const [cerrado,     setCerrado]     = useState(false)
  const [procesando,  setProcesando]  = useState(false)

  const supabase = createClient()

  useEffect(() => {
    if (!tallerId) return
    supabase
      .from('suscripciones')
      .select('plan, estado, trial_fin, periodo_fin')
      .eq('taller_id', tallerId)
      .single()
      .then(({ data }) => setSuscripcion(data))
  }, [tallerId])

  async function handleUpgrade() {
    setProcesando(true)
    const res  = await fetch('/api/stripe/checkout', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ precio_id: PLANES.esencial_mensual }),
    })
    const data = await res.json()
    if (data.url) window.location.href = data.url
    setProcesando(false)
  }

  if (!suscripcion || cerrado) return null

  const esTrial   = suscripcion.plan === 'trial'
  const esVencida = suscripcion.estado === 'vencida'

  if (!esTrial && !esVencida) return null

  const dias = esTrial && suscripcion.trial_fin
    ? Math.max(0, Math.ceil((new Date(suscripcion.trial_fin).getTime() - Date.now()) / 86400000))
    : 0

  const urgente = dias <= 3 || esVencida

  return (
    <div className={`rounded-xl border p-4 flex items-center gap-4 ${
      urgente
        ? 'bg-red-50 border-red-200'
        : 'bg-amber-50 border-amber-200'
    }`}>
      <AlertTriangle className={`w-5 h-5 shrink-0 ${urgente ? 'text-red-500' : 'text-amber-500'}`} />

      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold ${urgente ? 'text-red-800' : 'text-amber-800'}`}>
          {esVencida
            ? 'Tu suscripción ha vencido'
            : dias === 0
            ? 'Tu período de prueba terminó hoy'
            : `Tu período de prueba termina en ${dias} día${dias !== 1 ? 's' : ''}`}
        </p>
        <p className={`text-xs mt-0.5 ${urgente ? 'text-red-600' : 'text-amber-600'}`}>
          Elige un plan para seguir usando TallerOS sin interrupciones.
        </p>
      </div>

      <button
        onClick={handleUpgrade}
        disabled={procesando}
        className={`shrink-0 flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-lg transition-colors ${
          urgente
            ? 'bg-red-600 hover:bg-red-700 text-white'
            : 'bg-amber-500 hover:bg-amber-600 text-white'
        }`}
      >
        <Zap className="w-4 h-4" />
        {procesando ? 'Redirigiendo…' : 'Elegir plan'}
      </button>

      {!esVencida && (
        <button onClick={() => setCerrado(true)} className="shrink-0 text-gray-400 hover:text-gray-600">
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}