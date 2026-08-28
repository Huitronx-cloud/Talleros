'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AlertTriangle, Zap, X } from 'lucide-react'
import { enTrial } from '@/lib/plan-limits'
import { puedeGestionarTaller } from '@/lib/permisos'

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

  if (!puedeGestionarTaller(rol)) return null
  if (!suscripcion || cerrado) return null

  const esTrial   = suscripcion.plan === 'trial'
  const esVencida = suscripcion.estado === 'vencida'

  if (!esTrial && !esVencida) return null

  // Durante los 14 días el taller corre con acceso Pro completo; al terminar
  // cae al plan gratis sin bloquearse. El banner cuenta los días que quedan de
  // prueba, pero sin amenazar con perder el acceso: no se pierde.
  const enPrueba = esTrial && enTrial(suscripcion.trial_fin)
  const dias     = enPrueba
    ? Math.max(0, Math.ceil((new Date(suscripcion.trial_fin).getTime() - Date.now()) / 86400000))
    : 0

  const urgente = esVencida
  const medio   = enPrueba && dias <= 3

  const titulo = esVencida
    ? 'Tu suscripción ha vencido'
    : enPrueba
    ? `Te ${dias === 1 ? 'queda' : 'quedan'} ${dias} ${dias === 1 ? 'día' : 'días'} con todas las funciones abiertas`
    : 'Estás en el plan gratis'

  const subtitulo = esVencida
    ? 'Actualiza tu método de pago para reactivar tu plan.'
    : enPrueba
    ? 'Después pasas al plan gratis: 5 órdenes al mes, 15 clientes y 1 usuario. No se bloquea nada.'
    : 'Hasta 5 órdenes al mes, 15 clientes y 1 usuario. Con Esencial se te quitan los topes.'

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