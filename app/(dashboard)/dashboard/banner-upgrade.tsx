'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AlertTriangle, Zap, X } from 'lucide-react'

export default function BannerUpgrade({ tallerId, rol }: { tallerId?: string; rol?: string }) {
  const [suscripcion, setSuscripcion] = useState<any>(null)
  const [cerrado,     setCerrado]     = useState(false)

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

  if (!['propietario', 'admin'].includes(rol ?? '')) return null
  if (!suscripcion || cerrado) return null

  const esTrial   = suscripcion.plan === 'trial'
  const esVencida = suscripcion.estado === 'vencida'

  if (!esTrial && !esVencida) return null

  const dias = esTrial && suscripcion.trial_fin
    ? Math.max(0, Math.ceil((new Date(suscripcion.trial_fin).getTime() - Date.now()) / 86400000))
    : 0

  const urgente = dias <= 3 || esVencida
  const medio   = !urgente && dias <= 7

  const titulo = esVencida
    ? 'Tu suscripción ha vencido'
    : dias === 0
    ? 'Tu período de prueba termina hoy'
    : urgente
    ? `⚠️ Tu prueba termina en ${dias} día${dias !== 1 ? 's' : ''} — no pierdas el acceso`
    : medio
    ? `Tu prueba termina en ${dias} días — es un buen momento para elegir tu plan`
    : `Prueba gratuita · ${dias} días restantes`

  const subtitulo = esVencida
    ? 'Tu equipo no puede acceder. Elige un plan para reactivar el taller.'
    : urgente
    ? 'Suscríbete ahora para que tu equipo siga operando sin interrupciones.'
    : medio
    ? 'Sin tarjeta de crédito sorpresa. Cancela cuando quieras.'
    : 'Suscríbete antes de que termine para no perder ningún dato.'

  return (
    <div className={`rounded-xl border p-3 flex flex-col sm:flex-row sm:items-center gap-2 ${
      urgente ? 'bg-red-50 border-red-200' : medio ? 'bg-amber-50 border-amber-200' : 'bg-blue-50 border-blue-200'
    }`}>
      <div className="flex items-start gap-2 flex-1 min-w-0">
        <AlertTriangle className={`w-4 h-4 shrink-0 mt-0.5 ${urgente ? 'text-red-500' : medio ? 'text-amber-500' : 'text-blue-500'}`} />
        <div className="min-w-0">
          <p className={`text-sm font-semibold ${urgente ? 'text-red-800' : medio ? 'text-amber-800' : 'text-blue-800'}`}>
            {titulo}
          </p>
          <p className={`text-xs mt-0.5 ${urgente ? 'text-red-600' : medio ? 'text-amber-600' : 'text-blue-600'}`}>
            {subtitulo}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => router.push('/configuracion/plan')}
          className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
            urgente
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : medio
              ? 'bg-amber-500 hover:bg-amber-600 text-white'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          <Zap className="w-3 h-3" />
          {urgente ? 'Suscribirme ahora' : 'Ver planes'}
        </button>
        {!esVencida && (
          <button onClick={() => setCerrado(true)} className="shrink-0 text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )
}