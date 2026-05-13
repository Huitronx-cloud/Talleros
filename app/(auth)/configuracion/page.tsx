'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PLANES } from '@/lib/stripe'
import { CheckCircle, Loader2, Zap, Star, AlertTriangle } from 'lucide-react'

type Suscripcion = {
  plan:                   string
  estado:                 string
  trial_fin:              string | null
  periodo_fin:            string | null
  cancelar_al_periodo:    boolean
  stripe_subscription_id: string | null
}

export default function PlanPage() {
  const [suscripcion, setSuscripcion] = useState<Suscripcion | null>(null)
  const [cargando,    setCargando]    = useState(true)
  const [procesando,  setProcesando]  = useState<string | null>(null)
  const [billingAnual, setBillingAnual] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    async function cargar() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: usuario } = await supabase
        .from('usuarios')
        .select('taller_id')
        .eq('id', user.id)
        .single()

      if (!usuario) return

      const { data } = await supabase
        .from('suscripciones')
        .select('plan, estado, trial_fin, periodo_fin, cancelar_al_periodo, stripe_subscription_id')
        .eq('taller_id', usuario.taller_id)
        .single()

      setSuscripcion(data)
      setCargando(false)
    }
    cargar()
  }, [])

  async function handleUpgrade(precioId: string) {
    setProcesando(precioId)
    try {
      const res  = await fetch('/api/stripe/checkout', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ precio_id: precioId }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } catch {
      alert('Error al iniciar el pago. Intenta de nuevo.')
    } finally {
      setProcesando(null)
    }
  }

  function diasRestantes(fecha: string | null) {
    if (!fecha) return 0
    const diff = new Date(fecha).getTime() - Date.now()
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
  }

  if (cargando) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    )
  }

  const esTrial   = suscripcion?.plan === 'trial'
  const esEsencial = suscripcion?.plan === 'esencial'
  const esPro     = suscripcion?.plan === 'pro'
  const dias      = diasRestantes(suscripcion?.trial_fin ?? null)

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Plan y facturación</h1>
        <p className="text-gray-500 mt-1">Gestiona tu suscripción a TallerOS</p>
      </div>

      {/* Banner trial */}
      {esTrial && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-800">
              {dias > 0
                ? `Tu período de prueba termina en ${dias} día${dias !== 1 ? 's' : ''}`
                : 'Tu período de prueba ha terminado'}
            </p>
            <p className="text-sm text-amber-600 mt-0.5">
              Elige un plan para seguir usando TallerOS sin interrupciones.
            </p>
          </div>
        </div>
      )}

      {/* Toggle mensual/anual */}
      <div className="flex items-center justify-center gap-3 mb-8">
        <span className={`text-sm font-medium ${!billingAnual ? 'text-gray-900' : 'text-gray-400'}`}>
          Mensual
        </span>
        <button
          onClick={() => setBillingAnual(!billingAnual)}
          className={`relative w-12 h-6 rounded-full transition-colors ${billingAnual ? 'bg-blue-600' : 'bg-gray-200'}`}
        >
          <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${billingAnual ? 'translate-x-7' : 'translate-x-1'}`} />
        </button>
        <span className={`text-sm font-medium ${billingAnual ? 'text-gray-900' : 'text-gray-400'}`}>
          Anual <span className="text-green-600 font-semibold">-20%</span>
        </span>
      </div>

      {/* Planes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Plan Esencial */}
        <div className={`bg-white rounded-2xl border-2 p-6 ${esEsencial ? 'border-blue-500' : 'border-gray-200'}`}>
          {esEsencial && (
            <span className="inline-block bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full mb-4">
              Plan actual
            </span>
          )}
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-bold text-gray-900">Esencial</h2>
          </div>
          <div className="mb-4">
            <span className="text-3xl font-bold text-gray-900">
              ${billingAnual ? '19' : '24'}
            </span>
            <span className="text-gray-500 text-sm">/mes</span>
            {billingAnual && (
              <p className="text-green-600 text-xs mt-1">$228 facturado anualmente</p>
            )}
          </div>
          <ul className="space-y-2 mb-6 text-sm text-gray-600">
            {[
              'Órdenes de trabajo ilimitadas',
              'Gestión de clientes y vehículos',
              'Notificaciones básicas por WhatsApp',
              'Portal del cliente en tiempo real',
              'Multi-usuario (hasta 5)',
              'Soporte por email',
            ].map(f => (
              <li key={f} className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                {f}
              </li>
            ))}
          </ul>
          {!esEsencial && (
            <button
              onClick={() => handleUpgrade(billingAnual ? PLANES.esencial_anual : PLANES.esencial_mensual)}
              disabled={!!procesando}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-medium py-2.5 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
            >
              {procesando === (billingAnual ? PLANES.esencial_anual : PLANES.esencial_mensual)
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : 'Elegir Esencial'}
            </button>
          )}
        </div>

        {/* Plan Pro */}
        <div className={`bg-white rounded-2xl border-2 p-6 relative ${esPro ? 'border-purple-500' : 'border-gray-200'}`}>
          <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
            Más popular
          </span>
          {esPro && (
            <span className="inline-block bg-purple-100 text-purple-700 text-xs font-semibold px-3 py-1 rounded-full mb-4">
              Plan actual
            </span>
          )}
          <div className="flex items-center gap-2 mb-2">
            <Star className="w-5 h-5 text-purple-500" />
            <h2 className="text-lg font-bold text-gray-900">Pro</h2>
          </div>
          <div className="mb-4">
            <span className="text-3xl font-bold text-gray-900">
              ${billingAnual ? '39' : '49'}
            </span>
            <span className="text-gray-500 text-sm">/mes</span>
            {billingAnual && (
              <p className="text-green-600 text-xs mt-1">$468 facturado anualmente</p>
            )}
          </div>
          <ul className="space-y-2 mb-6 text-sm text-gray-600">
            {[
              'Todo lo del plan Esencial',
              'Recordatorios automáticos de mantenimiento',
              'Solicitud automática de reseñas en Google',
              'Reportes y métricas avanzadas',
              'Usuarios ilimitados',
              'Soporte prioritario',
            ].map(f => (
              <li key={f} className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                {f}
              </li>
            ))}
          </ul>
          {!esPro && (
            <button
              onClick={() => handleUpgrade(billingAnual ? PLANES.pro_anual : PLANES.pro_mensual)}
              disabled={!!procesando}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white font-medium py-2.5 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
            >
              {procesando === (billingAnual ? PLANES.pro_anual : PLANES.pro_mensual)
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : 'Elegir Pro'}
            </button>
          )}
        </div>
      </div>

      {/* Info suscripción activa */}
      {(esEsencial || esPro) && suscripcion?.periodo_fin && (
        <div className="mt-6 bg-gray-50 rounded-xl p-4 text-sm text-gray-600">
          {suscripcion.cancelar_al_periodo
            ? `Tu plan se cancela el ${new Date(suscripcion.periodo_fin).toLocaleDateString('es-MX', { dateStyle: 'long' })}`
            : `Próxima renovación: ${new Date(suscripcion.periodo_fin).toLocaleDateString('es-MX', { dateStyle: 'long' })}`
          }
        </div>
      )}
    </div>
  )
}