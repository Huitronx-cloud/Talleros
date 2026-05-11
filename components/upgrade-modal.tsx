'use client'

import { useRouter } from 'next/navigation'
import { X, Zap, Lock } from 'lucide-react'

interface Props {
  feature:  string
  mensaje:  string
  onCerrar: () => void
}

export default function UpgradeModal({ feature, mensaje, onCerrar }: Props) {
  const router = useRouter()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
         style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">

        <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-6 relative">
          <button onClick={onCerrar}
            className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-3">
            <Lock className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-xl font-bold text-white">Límite alcanzado</h2>
          <p className="text-blue-200 text-sm mt-1">{feature}</p>
        </div>

        <div className="p-6">
          <p className="text-gray-600 text-sm leading-relaxed mb-6">{mensaje}</p>

          <div className="bg-blue-50 rounded-xl p-4 mb-6">
            <p className="text-sm font-semibold text-blue-700 mb-2">
              Actualiza tu plan para desbloquear:
            </p>
            <ul className="space-y-1.5 text-sm text-blue-600">
              {[
                'Órdenes ilimitadas',
                'Más usuarios en tu equipo',
                'Recordatorios automáticos de mantenimiento',
                'Reseñas en Google automáticas',
              ].map(f => (
                <li key={f} className="flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onCerrar}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={() => { onCerrar(); router.push('/configuracion/plan') }}
              className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition-colors flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4" />
              Ver planes
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}