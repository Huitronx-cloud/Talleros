'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Orden, EstadoOrden } from '@/types'
import { Car, Clock, AlertTriangle, CheckCircle2, Wrench, ClipboardList, Loader2, ChevronRight } from 'lucide-react'
import BadgeEstado from './badge-estado'
import { cambiarEstado } from '@/app/(dashboard)/ordenes/actions'

interface Props {
  ordenes: Orden[]
  nombreTecnico: string
}

function getPrioridad(orden: Orden): 'urgente' | 'hoy' | 'normal' {
  if (!orden.fecha_prometida) return 'normal'
  const hoy       = new Date()
  hoy.setHours(0, 0, 0, 0)
  const prometida = new Date(orden.fecha_prometida + 'T12:00:00')
  const diff      = Math.floor((prometida.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
  if (diff < 0)   return 'urgente'
  if (diff === 0) return 'hoy'
  return 'normal'
}

const PRIORIDAD_CONFIG = {
  urgente: {
    label:     'Vencida',
    color:     'border-l-red-500 bg-red-50',
    badge:     'bg-red-100 text-red-700',
    icon:      AlertTriangle,
    iconColor: 'text-red-500',
  },
  hoy: {
    label:     'Para hoy',
    color:     'border-l-amber-500 bg-amber-50',
    badge:     'bg-amber-100 text-amber-700',
    icon:      Clock,
    iconColor: 'text-amber-500',
  },
  normal: {
    label:     'En tiempo',
    color:     'border-l-blue-400 bg-white',
    badge:     'bg-blue-100 text-blue-700',
    icon:      CheckCircle2,
    iconColor: 'text-blue-400',
  },
}

const ESTADOS_SIGUIENTE: Partial<Record<EstadoOrden, EstadoOrden>> = {
  recibido:   'en_proceso',
  en_proceso: 'listo',
  listo:      'entregado',
}

const LABEL_BOTON: Partial<Record<EstadoOrden, string>> = {
  recibido:   '▶ Iniciar trabajo',
  en_proceso: '✓ Marcar como listo',
  listo:      '📦 Marcar entregado',
}

const COLOR_BOTON: Partial<Record<EstadoOrden, string>> = {
  recibido:   'bg-blue-600 hover:bg-blue-700 text-white',
  en_proceso: 'bg-green-600 hover:bg-green-700 text-white',
  listo:      'bg-purple-600 hover:bg-purple-700 text-white',
}

function OrdenCard({ orden }: { orden: Orden }) {
  const [estadoActual, setEstadoActual] = useState<EstadoOrden>(orden.estado)
  const [cambiando, setCambiando]       = useState(false)

  const prioridad = getPrioridad({ ...orden, estado: estadoActual })
  const cfg       = PRIORIDAD_CONFIG[prioridad]
  const Icon      = cfg.icon
  const siguiente = ESTADOS_SIGUIENTE[estadoActual]

  const handleCambiarEstado = async (e: React.MouseEvent) => {
    e.preventDefault() // evitar que navegue al detalle
    if (!siguiente) return
    setCambiando(true)
    const resultado = await cambiarEstado(orden.id, siguiente)
    if (!resultado.error) setEstadoActual(siguiente)
    setCambiando(false)
  }

  return (
    <div className={`rounded-xl border border-gray-200 border-l-4 overflow-hidden transition-all ${cfg.color}`}>
      {/* Área clickeable → detalle */}
      <Link href={`/ordenes/${orden.id}`} className="block p-4 hover:opacity-90 transition-opacity">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {/* Número, estado y prioridad */}
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="text-xs font-bold text-gray-400 font-mono">
                #{String(orden.numero_orden).padStart(4, '0')}
              </span>
              <BadgeEstado estado={estadoActual} />
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.badge}`}>
                {cfg.label}
              </span>
            </div>

            {/* Cliente */}
            <p className="text-sm font-bold text-gray-900 mb-1">
              {orden.clientes?.nombre ?? 'Cliente no asignado'}
            </p>

            {/* Vehículo */}
            {(orden.vehiculo_marca || orden.placas) && (
              <div className="flex items-center gap-1.5 text-sm text-gray-600 mb-1">
                <Car className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                <span>
                  {[orden.vehiculo_marca, orden.vehiculo_modelo, orden.vehiculo_año]
                    .filter(Boolean).join(' ')}
                </span>
                {orden.placas && (
                  <span className="font-mono text-xs bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded">
                    {orden.placas}
                  </span>
                )}
              </div>
            )}

            {/* Problema */}
            {orden.descripcion_problema && (
              <p className="text-xs text-gray-500 truncate">{orden.descripcion_problema}</p>
            )}
          </div>

          {/* Fecha e ícono */}
          <div className="flex-shrink-0 flex flex-col items-end gap-1">
            <Icon className={`w-5 h-5 ${cfg.iconColor}`} />
            {orden.fecha_prometida && (
              <p className="text-xs text-gray-500 text-right">
                {new Date(orden.fecha_prometida + 'T12:00:00').toLocaleDateString('es-MX', {
                  weekday: 'short', day: 'numeric', month: 'short',
                })}
              </p>
            )}
            <ChevronRight className="w-3.5 h-3.5 text-gray-300 mt-1" />
          </div>
        </div>
      </Link>

      {/* Botón de cambio de estado — fuera del Link */}
      {siguiente && (
        <div className="px-4 pb-4">
          <button
            onClick={handleCambiarEstado}
            disabled={cambiando}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-60 ${COLOR_BOTON[estadoActual]}`}
          >
            {cambiando
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Actualizando...</>
              : LABEL_BOTON[estadoActual]
            }
          </button>
        </div>
      )}

      {/* Entregado — sin botón */}
      {estadoActual === 'entregado' && (
        <div className="px-4 pb-4">
          <div className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold bg-gray-100 text-gray-400">
            <CheckCircle2 className="w-4 h-4" /> Entregado
          </div>
        </div>
      )}
    </div>
  )
}

export default function MisOrdenes({ ordenes, nombreTecnico }: Props) {
  const [lista, setLista] = useState(ordenes)

  const urgentes = lista.filter(o => getPrioridad(o) === 'urgente')
  const hoy      = lista.filter(o => getPrioridad(o) === 'hoy')
  const normales = lista.filter(o => getPrioridad(o) === 'normal')

  const grupos = [
    { key: 'urgente', label: '🔴 Vencidas',   items: urgentes },
    { key: 'hoy',     label: '🟡 Para hoy',   items: hoy      },
    { key: 'normal',  label: '🔵 En tiempo',  items: normales },
  ].filter(g => g.items.length > 0)

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Wrench className="w-5 h-5 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Mis órdenes</h1>
        </div>
        <p className="text-gray-500 text-sm">
          Hola <span className="font-semibold text-gray-700">{nombreTecnico}</span> —{' '}
          {lista.length === 0
            ? 'No tienes órdenes asignadas'
            : `Tienes ${lista.length} orden${lista.length !== 1 ? 'es' : ''} asignada${lista.length !== 1 ? 's' : ''}`
          }
        </p>
      </div>

      {/* Resumen rápido */}
      {lista.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-red-600">{urgentes.length}</p>
            <p className="text-xs text-red-500 font-medium mt-0.5">Vencidas</p>
          </div>
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-amber-600">{hoy.length}</p>
            <p className="text-xs text-amber-500 font-medium mt-0.5">Para hoy</p>
          </div>
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-blue-600">{normales.length}</p>
            <p className="text-xs text-blue-500 font-medium mt-0.5">En tiempo</p>
          </div>
        </div>
      )}

      {/* Lista vacía */}
      {lista.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
          <ClipboardList className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 text-sm font-medium">No tienes órdenes asignadas</p>
          <p className="text-gray-300 text-xs mt-1">Cuando el dueño te asigne una orden aparecerá aquí</p>
        </div>
      )}

      {/* Grupos por prioridad */}
      {grupos.map(grupo => (
        <div key={grupo.key} className="mb-6">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 px-1">
            {grupo.label} ({grupo.items.length})
          </p>
          <div className="space-y-3">
            {grupo.items.map(orden => (
              <OrdenCard key={orden.id} orden={orden} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}