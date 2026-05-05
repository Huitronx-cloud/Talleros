'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Orden } from '@/types'
import {
  CalendarDays, ClipboardList, CheckCircle2, Plus,
  Phone, Car, Clock, Bell, ChevronRight, User
} from 'lucide-react'
import BadgeEstado from '@/components/ordenes/badge-estado'
import BotonCobrar from './boton-cobrar'
import BotonAvisarListo from './boton-avisar-listo'

interface Cita {
  id: string
  hora: string
  clientes: { nombre: string; telefono: string | null } | null
  descripcion?: string
  vehiculo_marca?: string
  vehiculo_modelo?: string
}

interface Props {
  citasHoy: Cita[]
  ordenesListas: Orden[]
  ordenesHoy: Orden[]
  nombreRecepcionista: string
}

type Vista = 'agenda' | 'listas' | 'hoy'

const TABS = [
  { id: 'agenda' as Vista, label: 'Agenda',         icon: CalendarDays  },
  { id: 'listas' as Vista, label: 'Listas p/cobrar', icon: CheckCircle2  },
  { id: 'hoy'    as Vista, label: 'Órdenes de hoy', icon: ClipboardList },
]

export default function AgendaRecepcion({
  citasHoy, ordenesListas, ordenesHoy, nombreRecepcionista
}: Props) {
  const [vista, setVista]               = useState<Vista>('agenda')
  const [listasState, setListasState]   = useState(ordenesListas)

  const ahora  = new Date()
  const fecha  = ahora.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })

  const handleCobrado = (ordenId: string) => {
    setListasState(prev => prev.filter(o => o.id !== ordenId))
  }

  return (
    <div className="max-w-2xl mx-auto">

      {/* Header */}
      <div className="mb-6">
        <p className="text-xs text-gray-400 uppercase tracking-wide capitalize">{fecha}</p>
        <h1 className="text-2xl font-bold text-gray-900 mt-0.5">
          Hola, {nombreRecepcionista} 👋
        </h1>
      </div>

      {/* Resumen rápido */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <button onClick={() => setVista('agenda')} className={`rounded-xl p-3 text-center border-2 transition-all ${vista === 'agenda' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'}`}>
          <p className="text-2xl font-bold text-blue-600">{citasHoy.length}</p>
          <p className="text-xs text-gray-500 font-medium mt-0.5">Citas hoy</p>
        </button>
        <button onClick={() => setVista('listas')} className={`rounded-xl p-3 text-center border-2 transition-all ${vista === 'listas' ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-white'}`}>
          <p className="text-2xl font-bold text-green-600">{listasState.length}</p>
          <p className="text-xs text-gray-500 font-medium mt-0.5">P/ cobrar</p>
        </button>
        <button onClick={() => setVista('hoy')} className={`rounded-xl p-3 text-center border-2 transition-all ${vista === 'hoy' ? 'border-purple-500 bg-purple-50' : 'border-gray-200 bg-white'}`}>
          <p className="text-2xl font-bold text-purple-600">{ordenesHoy.length}</p>
          <p className="text-xs text-gray-500 font-medium mt-0.5">Órdenes hoy</p>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-5">
        {TABS.map(t => {
          const Icon = t.icon
          return (
            <button
              key={t.id}
              onClick={() => setVista(t.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                vista === t.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          )
        })}
      </div>

      {/* ── AGENDA DEL DÍA ── */}
      {vista === 'agenda' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">
              Citas de hoy ({citasHoy.length})
            </p>
            <Link
              href="/citas"
              className="text-xs text-blue-600 font-medium hover:text-blue-700"
            >
              Ver todas →
            </Link>
          </div>

          {citasHoy.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
              <CalendarDays className="w-8 h-8 text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No hay citas programadas para hoy</p>
              <Link
                href="/citas"
                className="inline-flex items-center gap-1.5 mt-3 text-sm text-blue-600 font-medium hover:text-blue-700"
              >
                <Plus className="w-3.5 h-3.5" /> Agendar cita
              </Link>
            </div>
          ) : (
            citasHoy.map((cita: any) => (
              <div key={cita.id} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-start gap-3">
                  <div className="w-12 text-center flex-shrink-0">
                    <p className="text-sm font-bold text-blue-600">{cita.hora?.slice(0, 5)}</p>
                    <Clock className="w-3.5 h-3.5 text-gray-300 mx-auto mt-0.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900">
                      {cita.clientes?.nombre ?? 'Sin cliente'}
                    </p>
                    {cita.descripcion && (
                      <p className="text-xs text-gray-500 mt-0.5 truncate">{cita.descripcion}</p>
                    )}
                    {(cita.vehiculo_marca || cita.vehiculo_modelo) && (
                      <div className="flex items-center gap-1.5 mt-1">
                        <Car className="w-3 h-3 text-gray-400" />
                        <p className="text-xs text-gray-500">
                          {[cita.vehiculo_marca, cita.vehiculo_modelo].filter(Boolean).join(' ')}
                        </p>
                      </div>
                    )}
                  </div>
                  {cita.clientes?.telefono && (
                    <a
                      href={`https://wa.me/52${cita.clientes.telefono.replace(/\D/g, '').slice(-10)}`}
                      target="_blank"
                      className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center hover:bg-green-200 transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5 text-green-600" />
                    </a>
                  )}
                </div>
              </div>
            ))
          )}

          {/* Acceso rápido nueva orden */}
          <Link
            href="/ordenes/nueva"
            className="flex items-center justify-between bg-blue-600 hover:bg-blue-700 text-white rounded-xl p-4 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Plus className="w-5 h-5" />
              <span className="text-sm font-semibold">Registrar nueva orden</span>
            </div>
            <ChevronRight className="w-4 h-4 opacity-70" />
          </Link>
        </div>
      )}

      {/* ── ÓRDENES LISTAS PARA COBRAR ── */}
      {vista === 'listas' && (
        <div className="space-y-3">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">
            Listas para cobrar ({listasState.length})
          </p>

          {listasState.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
              <CheckCircle2 className="w-8 h-8 text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No hay órdenes pendientes de cobro</p>
            </div>
          ) : (
            listasState.map(orden => (
              <div key={orden.id} className="bg-white rounded-xl border border-green-200 border-l-4 border-l-green-500 p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono font-bold text-gray-400">
                        #{String(orden.numero_orden).padStart(4, '0')}
                      </span>
                      <BadgeEstado estado={orden.estado} />
                    </div>
                    <p className="text-sm font-bold text-gray-900">
                      {orden.clientes?.nombre ?? 'Sin cliente'}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {[orden.vehiculo_marca, orden.vehiculo_modelo].filter(Boolean).join(' ')}
                      {orden.placas && <span className="ml-1 font-mono bg-gray-100 px-1 rounded">{orden.placas}</span>}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-lg font-bold text-gray-900">
                      ${orden.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-gray-400 capitalize">{orden.forma_pago}</p>
                  </div>
                </div>

                {/* Botones de acción */}
                <div className="flex gap-2">
                  <BotonAvisarListo orden={orden} />
                  <BotonCobrar orden={orden} onCobrado={() => handleCobrado(orden.id)} />
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── ÓRDENES DE HOY ── */}
      {vista === 'hoy' && (
        <div className="space-y-3">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">
            Órdenes de hoy ({ordenesHoy.length})
          </p>

          {ordenesHoy.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
              <ClipboardList className="w-8 h-8 text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No se han registrado órdenes hoy</p>
            </div>
          ) : (
            ordenesHoy.map(orden => (
              <Link
                key={orden.id}
                href={`/ordenes/${orden.id}`}
                className="block bg-white rounded-xl border border-gray-200 p-4 hover:border-blue-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono font-bold text-gray-400">
                        #{String(orden.numero_orden).padStart(4, '0')}
                      </span>
                      <BadgeEstado estado={orden.estado} />
                    </div>
                    <p className="text-sm font-bold text-gray-900">
                      {orden.clientes?.nombre ?? 'Sin cliente'}
                    </p>
                    {orden.descripcion_problema && (
                      <p className="text-xs text-gray-500 mt-0.5 truncate">{orden.descripcion_problema}</p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-gray-900">
                      ${orden.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </p>
                    {orden.mecanico_asignado && (
                      <p className="text-xs text-gray-400 mt-0.5">{orden.mecanico_asignado}</p>
                    )}
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  )
}