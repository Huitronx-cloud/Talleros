'use client'

import Link from 'next/link'
import { Orden, EstadoOrden } from '@/types'
import { Car, Clock, AlertTriangle, CheckCircle2, Wrench, ClipboardList } from 'lucide-react'
import BadgeEstado from './badge-estado'

interface Props {
  ordenes: Orden[]
  nombreTecnico: string
}

function getPrioridad(orden: Orden): 'urgente' | 'hoy' | 'normal' {
  if (!orden.fecha_prometida) return 'normal'
  const hoy      = new Date()
  hoy.setHours(0, 0, 0, 0)
  const prometida = new Date(orden.fecha_prometida + 'T12:00:00')
  const diff      = Math.floor((prometida.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
  if (diff < 0)  return 'urgente'
  if (diff === 0) return 'hoy'
  return 'normal'
}

const PRIORIDAD_CONFIG = {
  urgente: {
    label:  'Vencida',
    color:  'border-l-red-500 bg-red-50',
    badge:  'bg-red-100 text-red-700',
    icon:   AlertTriangle,
    iconColor: 'text-red-500',
  },
  hoy: {
    label:  'Para hoy',
    color:  'border-l-amber-500 bg-amber-50',
    badge:  'bg-amber-100 text-amber-700',
    icon:   Clock,
    iconColor: 'text-amber-500',
  },
  normal: {
    label:  'En tiempo',
    color:  'border-l-blue-400 bg-white',
    badge:  'bg-blue-100 text-blue-700',
    icon:   CheckCircle2,
    iconColor: 'text-blue-400',
  },
}

const ESTADO_ORDEN: Record<EstadoOrden, string> = {
  recibido:   'Recibida — pendiente de revisar',
  en_proceso: 'En proceso',
  listo:      'Lista para entregar',
  entregado:  'Entregada',
}

export default function MisOrdenes({ ordenes, nombreTecnico }: Props) {
  const urgentes = ordenes.filter(o => getPrioridad(o) === 'urgente')
  const hoy      = ordenes.filter(o => getPrioridad(o) === 'hoy')
  const normales = ordenes.filter(o => getPrioridad(o) === 'normal')

  const grupos = [
    { key: 'urgente', label: '🔴 Vencidas',    items: urgentes },
    { key: 'hoy',     label: '🟡 Para hoy',    items: hoy      },
    { key: 'normal',  label: '🔵 En tiempo',   items: normales },
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
          {ordenes.length === 0
            ? 'No tienes órdenes asignadas'
            : `Tienes ${ordenes.length} orden${ordenes.length !== 1 ? 'es' : ''} asignada${ordenes.length !== 1 ? 's' : ''}`
          }
        </p>
      </div>

      {/* Resumen rápido */}
      {ordenes.length > 0 && (
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
      {ordenes.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
          <ClipboardList className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 text-sm font-medium">No tienes órdenes asignadas</p>
          <p className="text-gray-300 text-xs mt-1">Cuando el dueño te asigne una orden aparecerá aquí</p>
        </div>
      )}

      {/* Grupos por prioridad */}
      {grupos.map(grupo => {
        const prioridad = grupo.key as 'urgente' | 'hoy' | 'normal'
        const cfg       = PRIORIDAD_CONFIG[prioridad]

        return (
          <div key={grupo.key} className="mb-6">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 px-1">
              {grupo.label} ({grupo.items.length})
            </p>
            <div className="space-y-3">
              {grupo.items.map(orden => {
                const Icon = cfg.icon
                return (
                  <Link
                    key={orden.id}
                    href={`/ordenes/${orden.id}`}
                    className={`block rounded-xl border border-gray-200 border-l-4 p-4 hover:shadow-md transition-all ${cfg.color}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        {/* Número y estado */}
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-bold text-gray-400 font-mono">
                            #{String(orden.numero_orden).padStart(4, '0')}
                          </span>
                          <BadgeEstado estado={orden.estado} />
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
                          <p className="text-xs text-gray-500 truncate">
                            {orden.descripcion_problema}
                          </p>
                        )}
                      </div>

                      {/* Fecha prometida */}
                      <div className="flex-shrink-0 flex flex-col items-end gap-1">
                        <Icon className={`w-5 h-5 ${cfg.iconColor}`} />
                        {orden.fecha_prometida && (
                          <p className="text-xs text-gray-500 text-right">
                            {new Date(orden.fecha_prometida + 'T12:00:00').toLocaleDateString('es-MX', {
                              weekday: 'short', day: 'numeric', month: 'short',
                            })}
                          </p>
                        )}
                        <p className="text-xs text-gray-400">{ESTADO_ORDEN[orden.estado]}</p>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}