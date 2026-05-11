'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AlertTriangle, Zap, X } from 'lucide-react'
const PLANES = {
  esencial_mensual: 'price_1TVxQ1RFpmo4G9XHSD938Kyf',
  esencial_anual:   'price_1TVxQORFpmo4G9XHZjkw3iSc',
  pro_mensual:      'price_1TVxQgRFpmo4G9XHTVC0jRSB',
  pro_anual:        'price_1TVxR3RFpmo4G9XHtmdwzFAf',
}

export default function BannerUpgrade({ tallerId }: { tallerId?: string }) {
  const [suscripcion, setSuscripcion] = useState<any>(null)
  const [cerrado,     setCerrado]     = useState(false)
  const [procesando,  setProcesando]  = useState(false)

  const router   = useRouter()
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

  function handleUpgrade() {
    router.push('/configuracion/plan')
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
        disabled={false}
        className={`shrink-0 flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-lg transition-colors ${
          urgente
            ? 'bg-red-600 hover:bg-red-700 text-white'
            : 'bg-amber-500 hover:bg-amber-600 text-white'
        }`}
      >
        <Zap className="w-4 h-4" />
        {'Ver planes'}
      </button>

      {!esVencida && (
        <button onClick={() => setCerrado(true)} className="shrink-0 text-gray-400 hover:text-gray-600">
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}