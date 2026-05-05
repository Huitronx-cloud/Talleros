'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Play, CheckCircle2, Flag } from 'lucide-react'

interface Props {
  ordenId: string
  tiempoInicial: number
  timerInicio: string | null
}

export default function TimerOrden({ ordenId, tiempoInicial, timerInicio }: Props) {
  const supabase = createClient()
  const [estado, setEstado]   = useState<'sin_iniciar' | 'corriendo' | 'terminado'>(
    timerInicio       ? 'corriendo'   :
    tiempoInicial > 0 ? 'terminado'   :
                        'sin_iniciar'
  )
  const [guardando, setGuardando] = useState(false)

  const handleIniciar = async () => {
    setGuardando(true)
    await supabase
      .from('ordenes')
      .update({ timer_inicio: new Date().toISOString() })
      .eq('id', ordenId)
    setEstado('corriendo')
    setGuardando(false)
  }

  const handleTerminar = async () => {
    setGuardando(true)
    const minutosNuevos = timerInicio
      ? Math.floor((Date.now() - new Date(timerInicio).getTime()) / 60000)
      : 0
    await supabase
      .from('ordenes')
      .update({
        tiempo_trabajado_minutos: tiempoInicial + minutosNuevos,
        timer_inicio: null,
      })
      .eq('id', ordenId)
    setEstado('terminado')
    setGuardando(false)
  }

  if (estado === 'terminado') {
    return (
      <div className="rounded-xl border-2 border-green-400 bg-green-50 p-4 flex items-center gap-3">
        <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold text-green-800">Servicio registrado</p>
          <p className="text-xs text-green-600">El tiempo de trabajo quedó guardado</p>
        </div>
      </div>
    )
  }

  if (estado === 'corriendo') {
    return (
      <div className="rounded-xl border-2 border-blue-400 bg-blue-50 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          <p className="text-sm font-semibold text-blue-800">Trabajando en esta orden</p>
        </div>
        <p className="text-xs text-blue-600">Cuando termines el servicio presiona el botón de abajo.</p>
        <button
          onClick={handleTerminar}
          disabled={guardando}
          className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white text-sm font-bold py-3 rounded-lg transition-colors"
        >
          <Flag className="w-4 h-4" />
          {guardando ? 'Guardando...' : 'Servicio terminado'}
        </button>
      </div>
    )
  }

  return (
    <div className="rounded-xl border-2 border-gray-200 bg-white p-4">
      <p className="text-sm font-semibold text-gray-900 mb-1">¿Listo para empezar?</p>
      <p className="text-xs text-gray-400 mb-3">Presiona el botón cuando comiences a trabajar en esta orden.</p>
      <button
        onClick={handleIniciar}
        disabled={guardando}
        className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-bold py-3 rounded-lg transition-colors"
      >
        <Play className="w-4 h-4" />
        {guardando ? 'Iniciando...' : 'Iniciar trabajo'}
      </button>
    </div>
  )
}