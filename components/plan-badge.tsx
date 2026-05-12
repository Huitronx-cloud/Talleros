'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Zap, Star, Clock, ChevronUp } from 'lucide-react'

type Plan = 'trial' | 'esencial' | 'pro'

export default function PlanBadge() {
  const [plan,      setPlan]      = useState<Plan | null>(null)
  const [diasTrial, setDiasTrial] = useState<number | null>(null)
  const [promo,     setPromo]     = useState<any>(null)
  const router   = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function cargar() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: usuario } = await supabase
        .from('usuarios')
        .select('taller_id, rol')
        .eq('id', user.id)
        .single()

      if (!usuario) return

      // Solo propietario y admin ven el badge de plan
      if (!['propietario', 'admin'].includes(usuario.rol)) return

      const { data: sus } = await supabase
        .from('suscripciones')
        .select('plan, trial_fin')
        .eq('taller_id', usuario.taller_id)
        .single()

      if (sus) {
        setPlan(sus.plan as Plan)
        if (sus.plan === 'trial' && sus.trial_fin) {
          const dias = Math.max(0, Math.ceil(
            (new Date(sus.trial_fin).getTime() - Date.now()) / 86400000
          ))
          setDiasTrial(dias)
        }
      }

      const { data: promos } = await supabase
        .from('promociones')
        .select('*')
        .contains('planes_objetivo', [sus?.plan ?? 'trial'])
        .limit(1)

      if (promos && promos.length > 0) setPromo(promos[0])
    }
    cargar()
  }, [])

  if (!plan) return null

  const config = {
    trial: {
      label:  `Trial · ${diasTrial ?? 0}d`,
      icon:   Clock,
      bg:     'bg-amber-100',
      text:   'text-amber-700',
      border: 'border-amber-200',
    },
    esencial: {
      label:  'Esencial',
      icon:   Zap,
      bg:     'bg-blue-100',
      text:   'text-blue-700',
      border: 'border-blue-200',
    },
    pro: {
      label:  'Pro',
      icon:   Star,
      bg:     'bg-purple-100',
      text:   'text-purple-700',
      border: 'border-purple-200',
    },
  }[plan]

  const Icono = config.icon

  return (
    <div className="space-y-2">
      <button
        onClick={() => router.push('/configuracion/plan')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all hover:shadow-md ${config.bg} ${config.text} ${config.border}`}
      >
        <Icono className="w-3.5 h-3.5" />
        {config.label}
        {plan !== 'pro' && <ChevronUp className="w-3 h-3 opacity-60" />}
      </button>

      {promo && plan !== 'pro' && (
        <button
          onClick={() => router.push('/configuracion/plan')}
          className={`w-full text-left px-3 py-2 rounded-xl border text-xs font-medium transition-all hover:shadow-md ${
            promo.color === 'purple'
              ? 'bg-purple-50 border-purple-200 text-purple-700'
              : promo.color === 'amber'
              ? 'bg-amber-50 border-amber-200 text-amber-700'
              : promo.color === 'green'
              ? 'bg-green-50 border-green-200 text-green-700'
              : 'bg-blue-50 border-blue-200 text-blue-700'
          }`}
        >
          <span className="font-bold">{promo.descuento} OFF</span> · {promo.mensaje}
        </button>
      )}
    </div>
  )
}