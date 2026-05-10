'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { CheckCircle, X, Zap, Star } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function UpgradeSuccessModal() {
  const [visible,     setVisible]     = useState(false)
  const [plan,        setPlan]        = useState<string>('esencial')
  const searchParams  = useSearchParams()
  const router        = useRouter()
  const supabase      = createClient()

  useEffect(() => {
    if (searchParams.get('upgrade') !== 'success') return

    // Obtener plan actual
    async function obtenerPlan() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: usuario } = await supabase
        .from('usuarios')
        .select('taller_id')
        .eq('id', user.id)
        .single()

      if (!usuario) return

      const { data: suscripcion } = await supabase
        .from('suscripciones')
        .select('plan')
        .eq('taller_id', usuario.taller_id)
        .single()

      if (suscripcion?.plan) setPlan(suscripcion.plan)
      setVisible(true)
    }

    obtenerPlan()
  }, [searchParams])

  function cerrar() {
    setVisible(false)
    router.replace('/dashboard')
  }

  if (!visible) return null

  const esPro      = plan === 'pro'
  const color      = esPro ? 'purple' : 'blue'
  const nombrePlan = esPro ? 'Pro' : 'Esencial'
  const emoji      = esPro ? '🚀' : '🎉'

  const features = esPro
    ? [
        'Órdenes ilimitadas',
        'Recordatorios automáticos de mantenimiento',
        'Reseñas de Google automáticas',
        'Reportes y métricas avanzadas',
        'Usuarios ilimitados',
        'Soporte prioritario',
      ]
    : [
        'Órdenes ilimitadas',
        'Notificaciones por WhatsApp',
        'Portal del cliente en tiempo real',
        'Gestión de clientes y vehículos',
        'Hasta 5 usuarios',
        'Soporte por email',
      ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
         style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-300">

        {/* Header */}
        <div className={`bg-gradient-to-br ${esPro ? 'from-purple-600 to-purple-800' : 'from-blue-600 to-blue-800'} p-8 text-center relative`}>
          <button onClick={cerrar}
            className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
          <div className="text-5xl mb-3">{emoji}</div>
          <h2 className="text-2xl font-bold text-white mb-1">
            ¡Bienvenido al plan {nombrePlan}!
          </h2>
          <p className="text-white/70 text-sm">
            Tomaste la mejor decisión para tu taller
          </p>
        </div>

        {/* Body */}
        <div className="p-6">
          <div className={`${esPro ? 'bg-purple-50' : 'bg-blue-50'} rounded-xl p-4 mb-6`}>
            <div className="flex items-center gap-2 mb-3">
              {esPro
                ? <Star className="w-4 h-4 text-purple-600" />
                : <Zap className="w-4 h-4 text-blue-600" />
              }
              <p className={`text-sm font-semibold ${esPro ? 'text-purple-700' : 'text-blue-700'}`}>
                Lo que tienes disponible ahora:
              </p>
            </div>
            <ul className="space-y-2">
              {features.map(f => (
                <li key={f} className="flex items-start gap-2 text-sm text-gray-700">
                  <CheckCircle className={`w-4 h-4 mt-0.5 shrink-0 ${esPro ? 'text-purple-500' : 'text-blue-500'}`} />
                  {f}
                </li>
              ))}
            </ul>
          </div>

          <button
            onClick={cerrar}
            className={`w-full py-3 rounded-xl font-semibold text-white transition-colors ${
              esPro
                ? 'bg-purple-600 hover:bg-purple-700'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            Ir a mi taller →
          </button>
        </div>

      </div>
    </div>
  )
}