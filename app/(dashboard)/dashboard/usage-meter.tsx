import Link from 'next/link'
import { getLimites } from '@/lib/plan-limits'
import { TrendingUp } from 'lucide-react'

interface Props {
  plan:       string
  usadas:     number
  rol:        string
}

export default function UsageMeter({ plan, usadas, rol }: Props) {
  const limites = getLimites(plan)
  const limite  = limites.ordenes_mes

  // Solo mostrar medidor cuando hay un límite (trial = 15, paid = -1)
  if (limite === -1) return null
  if (!['propietario', 'admin'].includes(rol)) return null

  const pct     = Math.min(100, Math.round((usadas / limite) * 100))
  const libre   = Math.max(0, limite - usadas)
  const critico = pct >= 80
  const lleno   = usadas >= limite

  const barColor = lleno
    ? 'bg-red-500'
    : critico
    ? 'bg-amber-500'
    : 'bg-blue-500'

  const bgColor = lleno
    ? 'bg-red-50 border-red-200'
    : critico
    ? 'bg-amber-50 border-amber-200'
    : 'bg-white border-gray-200'

  const textColor = lleno
    ? 'text-red-700'
    : critico
    ? 'text-amber-700'
    : 'text-gray-700'

  return (
    <div className={`rounded-xl border p-4 ${bgColor}`}>
      <div className="flex items-center justify-between mb-2">
        <p className={`text-sm font-semibold ${textColor}`}>
          {lleno
            ? '¡Límite de órdenes alcanzado!'
            : critico
            ? `Solo te quedan ${libre} ${libre === 1 ? 'orden' : 'órdenes'} este mes`
            : 'Órdenes este mes'}
        </p>
        <span className={`text-xs font-bold ${textColor}`}>
          {usadas} / {limite}
        </span>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
        <div
          className={`${barColor} h-2 rounded-full transition-all`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {critico && (
        <div className="flex items-center justify-between">
          <p className={`text-xs ${lleno ? 'text-red-600' : 'text-amber-600'}`}>
            {lleno
              ? 'Actualiza tu plan para seguir creando órdenes sin límite.'
              : 'Actualiza tu plan para tener órdenes ilimitadas.'}
          </p>
          <Link
            href="/configuracion/plan"
            className={`flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg text-white transition-colors ml-3 shrink-0 ${
              lleno ? 'bg-red-600 hover:bg-red-700' : 'bg-amber-500 hover:bg-amber-600'
            }`}
          >
            <TrendingUp className="w-3 h-3" />
            Subir plan
          </Link>
        </div>
      )}
    </div>
  )
}
