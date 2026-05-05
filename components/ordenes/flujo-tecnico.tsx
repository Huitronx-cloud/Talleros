'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Orden, EstadoOrden } from '@/types'
import { cambiarEstado } from '@/app/(dashboard)/ordenes/actions'
import {
  ArrowLeft, Car, User, CheckCircle2, Camera, MapPin,
  ChevronRight, Loader2, ClipboardCheck
} from 'lucide-react'
import Link from 'next/link'
import BadgeEstado from './badge-estado'
import FotosDiagnostico from './fotos-diagnosticos'
import InspeccionDanos from './inspeccion-danos'
import { createClient } from '@/lib/supabase/client'
import TimerOrden from './timer-orden'
import NotaVoz from './nota-voz'


const ITEMS_CHECKLIST = [
  'Revisé el problema reportado por el cliente',
  'Tomé fotos del estado inicial del vehículo',
  'Verifiqué las herramientas necesarias',
  'Revisé el diagnóstico previo',
  'Tengo las refacciones o piezas necesarias',
]

const ESTADOS_SIGUIENTE: Partial<Record<EstadoOrden, EstadoOrden>> = {
  recibido:   'en_proceso',
  en_proceso: 'listo',
  listo:      'entregado',
}

const LABEL_SIGUIENTE: Partial<Record<EstadoOrden, string>> = {
  recibido:   'Iniciar trabajo',
  en_proceso: 'Marcar como listo',
  listo:      'Marcar como entregado',
}

type Paso = 'info' | 'checklist' | 'fotos' | 'danos' | 'listo'

interface Props {
  orden: Orden
  nombreTecnico: string
}

export default function FlujoTecnico({ orden, nombreTecnico }: Props) {
  const router   = useRouter()
  const supabase = createClient()

  const [paso, setPaso]               = useState<Paso>('info')
  const [estadoActual, setEstadoActual] = useState<EstadoOrden>(orden.estado)
  const [checks, setChecks]           = useState<Record<string, boolean>>({})
  const [cambiando, setCambiando]     = useState(false)
  const [notasTecnico, setNotasTecnico] = useState('')
  const [guardandoNota, setGuardandoNota] = useState(false)

  const siguienteEstado = ESTADOS_SIGUIENTE[estadoActual]
  const checksTodos     = ITEMS_CHECKLIST.every(i => checks[i])
  const checkCount      = Object.values(checks).filter(Boolean).length

  const handleCambiarEstado = async () => {
    if (!siguienteEstado) return
    setCambiando(true)
    const resultado = await cambiarEstado(orden.id, siguienteEstado)
    if (!resultado.error) {
      setEstadoActual(siguienteEstado)
      setPaso('listo')
    }
    setCambiando(false)
  }

  const handleGuardarNota = async () => {
    if (!notasTecnico.trim()) return
    setGuardandoNota(true)
    await supabase
      .from('ordenes')
      .update({ notas_internas: notasTecnico })
      .eq('id', orden.id)
    setGuardandoNota(false)
  }

  const PASOS: { id: Paso; label: string; icon: any }[] = [
    { id: 'info',      label: 'Info',      icon: User          },
    { id: 'checklist', label: 'Checklist', icon: ClipboardCheck },
    { id: 'fotos',     label: 'Fotos',     icon: Camera        },
    { id: 'danos',     label: 'Daños',     icon: MapPin        },
  ]

  return (
    <div className="max-w-xl mx-auto">

      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <Link
            href="/ordenes"
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 mb-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Mis órdenes
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-gray-900">
              Orden #{String(orden.numero_orden).padStart(4, '0')}
            </span>
            <BadgeEstado estado={estadoActual} />
          </div>
        </div>
      </div>

      {/* Progreso visual */}
      {paso !== 'listo' && (
        <div className="flex items-center gap-1 mb-6">
          {PASOS.map((p, i) => {
            const pasoIdx    = PASOS.findIndex(x => x.id === paso)
            const completado = i < pasoIdx
            const activo     = p.id === paso
            const Icon       = p.icon
            return (
              <div key={p.id} className="flex items-center gap-1 flex-1">
                <button
                  onClick={() => setPaso(p.id)}
                  className={`flex flex-col items-center gap-1 flex-1 py-2 rounded-lg transition-all ${
                    activo     ? 'bg-blue-600 text-white' :
                    completado ? 'bg-green-100 text-green-700' :
                                 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {completado
                    ? <CheckCircle2 className="w-4 h-4" />
                    : <Icon className="w-4 h-4" />
                  }
                  <span className="text-xs font-medium">{p.label}</span>
                </button>
                {i < PASOS.length - 1 && (
                  <div className={`h-0.5 w-2 ${completado ? 'bg-green-400' : 'bg-gray-200'}`} />
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ── PASO: INFO ── */}
      {paso === 'info' && (
        <div className="space-y-4">
          {/* Cliente y vehículo */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-gray-400" />
              <p className="text-sm font-semibold text-gray-900">
                {orden.clientes?.nombre ?? 'Sin cliente'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Car className="w-4 h-4 text-gray-400" />
              <p className="text-sm text-gray-700">
                {[orden.vehiculo_marca, orden.vehiculo_modelo, orden.vehiculo_año].filter(Boolean).join(' ') || '—'}
                {orden.placas && (
                  <span className="ml-2 font-mono text-xs bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded">
                    {orden.placas}
                  </span>
                )}
              </p>
            </div>
            {orden.kilometraje && (
              <p className="text-xs text-gray-400 pl-6">{orden.kilometraje.toLocaleString()} km</p>
            )}
          </div>

          {/* Problema y diagnóstico */}
          {orden.descripcion_problema && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-xs font-bold text-amber-700 uppercase tracking-wide mb-1">Problema reportado</p>
              <p className="text-sm text-amber-900">{orden.descripcion_problema}</p>
            </div>
          )}
          {orden.diagnostico && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="text-xs font-bold text-blue-700 uppercase tracking-wide mb-1">Diagnóstico</p>
              <p className="text-sm text-blue-900">{orden.diagnostico}</p>
            </div>
          )}

          {/* Timer */}
          <TimerOrden
            ordenId={orden.id}
            tiempoInicial={(orden as any).tiempo_trabajado_minutos ?? 0}
            timerInicio={(orden as any).timer_inicio ?? null}
          />

          {/* Nota del técnico */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-sm font-semibold text-gray-900 mb-2">Mis notas</p>
            <textarea
              rows={3}
              value={notasTecnico}
              onChange={e => setNotasTecnico(e.target.value)}
              placeholder="Escribe tus observaciones aquí..."
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400 resize-none mb-2"
            />
            <button
              onClick={handleGuardarNota}
              disabled={guardandoNota || !notasTecnico.trim()}
              className="text-sm font-medium text-blue-600 hover:text-blue-700 disabled:opacity-40 transition-colors"
            >
              {guardandoNota ? 'Guardando...' : 'Guardar nota'}
            </button>
          </div>

          {/* Nota de voz */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-sm font-semibold text-gray-900 mb-1">Notas de voz</p>
            <p className="text-xs text-gray-400 mb-3">Graba un audio con tus observaciones en lugar de escribir.</p>
            <NotaVoz ordenId={orden.id} tallerId={orden.taller_id as string} />
          </div>

          <button
            onClick={() => setPaso('checklist')}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-3 rounded-xl transition-colors"
          >
            Siguiente — Checklist <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── PASO: CHECKLIST ── */}
      {paso === 'checklist' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-gray-900">Checklist de inicio</p>
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                {checkCount}/{ITEMS_CHECKLIST.length}
              </span>
            </div>
            <div className="space-y-3">
              {ITEMS_CHECKLIST.map(item => (
                <button
                  key={item}
                  onClick={() => setChecks(prev => ({ ...prev, [item]: !prev[item] }))}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 text-left transition-all ${
                    checks[item]
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                    checks[item] ? 'border-green-500 bg-green-500' : 'border-gray-300'
                  }`}>
                    {checks[item] && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                  </div>
                  <span className={`text-sm ${checks[item] ? 'text-green-800 font-medium' : 'text-gray-700'}`}>
                    {item}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setPaso('info')}
              className="px-4 py-3 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors"
            >
              ← Atrás
            </button>
            <button
              onClick={() => setPaso('fotos')}
              disabled={!checksTodos}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold py-3 rounded-xl transition-colors"
            >
              {checksTodos ? <>Siguiente — Fotos <ChevronRight className="w-4 h-4" /></> : `Completa los ${ITEMS_CHECKLIST.length - checkCount} restantes`}
            </button>
          </div>
        </div>
      )}

      {/* ── PASO: FOTOS ── */}
      {paso === 'fotos' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-sm font-semibold text-gray-900 mb-1">Fotos de diagnóstico</p>
            <p className="text-xs text-gray-400 mb-4">Toma fotos del estado del vehículo antes de empezar.</p>
            <FotosDiagnostico ordenId={orden.id} tallerId={orden.taller_id as string} />
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setPaso('checklist')}
              className="px-4 py-3 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors"
            >
              ← Atrás
            </button>
            <button
              onClick={() => setPaso('danos')}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-3 rounded-xl transition-colors"
            >
              Siguiente — Mapa de daños <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── PASO: DAÑOS ── */}
      {paso === 'danos' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-sm font-semibold text-gray-900 mb-1">Mapa de daños</p>
            <p className="text-xs text-gray-400 mb-4">Marca los daños preexistentes del vehículo.</p>
            <InspeccionDanos
              ordenId={orden.id}
              tallerId={orden.taller_id as string}
              soloLectura={false}
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setPaso('fotos')}
              className="px-4 py-3 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors"
            >
              ← Atrás
            </button>
            {siguienteEstado && (
              <button
                onClick={handleCambiarEstado}
                disabled={cambiando}
                className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white text-sm font-semibold py-3 rounded-xl transition-colors"
              >
                {cambiando
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Actualizando...</>
                  : <>{LABEL_SIGUIENTE[estadoActual]} ✓</>
                }
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── PASO: LISTO ── */}
      {paso === 'listo' && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">¡Listo!</h2>
          <p className="text-gray-500 text-sm mb-6">
            Estado actualizado a <span className="font-semibold capitalize">{estadoActual.replace('_', ' ')}</span>
          </p>
          <Link
            href="/ordenes"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Volver a mis órdenes
          </Link>
        </div>
      )}

    </div>
  )
}