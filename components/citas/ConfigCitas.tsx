'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Save, Loader2, Plus, X, Clock, Calendar, Settings } from 'lucide-react'

const DIAS = [
  { key: 'lunes',     label: 'Lunes'     },
  { key: 'martes',    label: 'Martes'    },
  { key: 'miercoles', label: 'Miércoles' },
  { key: 'jueves',    label: 'Jueves'    },
  { key: 'viernes',   label: 'Viernes'   },
  { key: 'sabado',    label: 'Sábado'    },
  { key: 'domingo',   label: 'Domingo'   },
]

const HORAS = Array.from({ length: 28 }, (_, i) => {
  const h = Math.floor(i / 2) + 7
  const m = i % 2 === 0 ? '00' : '30'
  return `${String(h).padStart(2, '0')}:${m}`
})

interface HorarioDia {
  abre:  string
  cierra: string
}

interface Config {
  id?:             string
  horario:         Record<string, HorarioDia | null>
  limite_por_dia:  number
  dias_bloqueados: string[]
}

interface Props {
  tallerId: string
  configInicial: Config | null
}

export default function ConfigCitas({ tallerId, configInicial }: Props) {
  const supabase = createClient()

  const defaultConfig: Config = {
    horario: {
      lunes:     { abre: '08:00', cierra: '18:00' },
      martes:    { abre: '08:00', cierra: '18:00' },
      miercoles: { abre: '08:00', cierra: '18:00' },
      jueves:    { abre: '08:00', cierra: '18:00' },
      viernes:   { abre: '08:00', cierra: '18:00' },
      sabado:    { abre: '09:00', cierra: '14:00' },
      domingo:   null,
    },
    limite_por_dia:  8,
    dias_bloqueados: [],
  }

  const [config, setConfig]       = useState<Config>(configInicial ?? defaultConfig)
  const [guardando, setGuardando] = useState(false)
  const [exito, setExito]         = useState(false)
  const [nuevaFecha, setNuevaFecha] = useState('')

  function toggleDia(dia: string) {
    setConfig(prev => ({
      ...prev,
      horario: {
        ...prev.horario,
        [dia]: prev.horario[dia] ? null : { abre: '08:00', cierra: '18:00' },
      },
    }))
  }

  function setHora(dia: string, campo: 'abre' | 'cierra', valor: string) {
    setConfig(prev => ({
      ...prev,
      horario: {
        ...prev.horario,
        [dia]: { ...(prev.horario[dia] as HorarioDia), [campo]: valor },
      },
    }))
  }

  function agregarDiaBloqueado() {
    if (!nuevaFecha) return
    if (config.dias_bloqueados.includes(nuevaFecha)) return
    setConfig(prev => ({
      ...prev,
      dias_bloqueados: [...prev.dias_bloqueados, nuevaFecha].sort(),
    }))
    setNuevaFecha('')
  }

  function quitarDiaBloqueado(fecha: string) {
    setConfig(prev => ({
      ...prev,
      dias_bloqueados: prev.dias_bloqueados.filter(d => d !== fecha),
    }))
  }

  async function guardar() {
    setGuardando(true)
    setExito(false)

    const payload = {
      taller_id:       tallerId,
      horario:         config.horario,
      limite_por_dia:  config.limite_por_dia,
      dias_bloqueados: config.dias_bloqueados,
    }

    const { error } = config.id
      ? await supabase.from('citas_config').update(payload).eq('id', config.id)
      : await supabase.from('citas_config').insert(payload)

    if (!error) {
      setExito(true)
      setTimeout(() => setExito(false), 3000)
    }
    setGuardando(false)
  }

  return (
    <div className="space-y-6">

      {/* Horario por día */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-5">
          <Clock className="w-5 h-5 text-blue-600" />
          <h3 className="text-base font-bold text-gray-900">Horario de atención</h3>
        </div>
        <div className="space-y-3">
          {DIAS.map(({ key, label }) => {
            const activo = !!config.horario[key]
            const horario = config.horario[key] as HorarioDia | null
            return (
              <div key={key} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                activo ? 'border-blue-200 bg-blue-50' : 'border-gray-100 bg-gray-50'
              }`}>
                {/* Toggle día */}
                <button
                  type="button"
                  onClick={() => toggleDia(key)}
                  className={`w-10 h-6 rounded-full transition-all flex-shrink-0 relative ${
                    activo ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${
                    activo ? 'left-4' : 'left-0.5'
                  }`} />
                </button>

                {/* Nombre del día */}
                <span className={`text-sm font-semibold w-24 flex-shrink-0 ${
                  activo ? 'text-blue-900' : 'text-gray-400'
                }`}>
                  {label}
                </span>

                {/* Horas */}
                {activo && horario ? (
                  <div className="flex items-center gap-2 flex-1">
                    <select
                      value={horario.abre}
                      onChange={e => setHora(key, 'abre', e.target.value)}
                      className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {HORAS.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                    <span className="text-gray-400 text-sm">a</span>
                    <select
                      value={horario.cierra}
                      onChange={e => setHora(key, 'cierra', e.target.value)}
                      className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {HORAS.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                ) : (
                  <span className="text-sm text-gray-400 flex-1">Cerrado</span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Límite por día */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Settings className="w-5 h-5 text-blue-600" />
          <h3 className="text-base font-bold text-gray-900">Capacidad del taller</h3>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Máximo de citas por día
            </label>
            <p className="text-xs text-gray-400 mb-3">
              Cuando se alcance este límite, ese día aparecerá como no disponible para los clientes.
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setConfig(p => ({ ...p, limite_por_dia: Math.max(1, p.limite_por_dia - 1) }))}
                className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 font-bold text-lg"
              >
                −
              </button>
              <span className="text-2xl font-bold text-blue-600 w-12 text-center">
                {config.limite_por_dia}
              </span>
              <button
                type="button"
                onClick={() => setConfig(p => ({ ...p, limite_por_dia: Math.min(50, p.limite_por_dia + 1) }))}
                className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 font-bold text-lg"
              >
                +
              </button>
              <span className="text-sm text-gray-500">citas por día</span>
            </div>
          </div>
        </div>
      </div>

      {/* Días bloqueados */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-blue-600" />
          <h3 className="text-base font-bold text-gray-900">Días bloqueados</h3>
        </div>
        <p className="text-xs text-gray-400 mb-4">
          Bloquea fechas específicas por vacaciones, festivos o cualquier motivo. Los clientes no podrán agendar en esos días.
        </p>

        <div className="flex gap-2 mb-4">
          <input
            type="date"
            value={nuevaFecha}
            onChange={e => setNuevaFecha(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={agregarDiaBloqueado}
            disabled={!nuevaFecha}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" /> Bloquear
          </button>
        </div>

        {config.dias_bloqueados.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">No hay días bloqueados</p>
        ) : (
          <div className="space-y-2">
            {config.dias_bloqueados.map(fecha => (
              <div key={fecha} className="flex items-center justify-between bg-red-50 border border-red-100 rounded-lg px-4 py-2.5">
                <span className="text-sm font-medium text-red-800">
                  {new Date(fecha + 'T12:00:00').toLocaleDateString('es-MX', {
                    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
                  })}
                </span>
                <button
                  type="button"
                  onClick={() => quitarDiaBloqueado(fecha)}
                  className="text-red-400 hover:text-red-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Guardar */}
      <button
        type="button"
        onClick={guardar}
        disabled={guardando}
        className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors"
      >
        {guardando
          ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</>
          : exito
          ? '✅ ¡Guardado!'
          : <><Save className="w-4 h-4" /> Guardar configuración</>
        }
      </button>
    </div>
  )
}