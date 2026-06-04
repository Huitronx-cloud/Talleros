'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, User, Car, Phone, Mail, FileText, Clock, CheckCircle, Wrench, Plus } from 'lucide-react'
import Link from 'next/link'
import { Cliente, Orden } from '@/types'
import { formatMoney } from '@/lib/utils'

interface Props {
  cliente: Cliente
  ordenes: any[]
  ordenesFinalizadas: any[]
}

const TABS = ['Información', 'Historial del vehículo']

export default function ClienteDetalle({ cliente, ordenes, ordenesFinalizadas }: Props) {
  const router = useRouter()
  const [tab, setTab] = useState(0)

  const totalGastado = ordenesFinalizadas.reduce((sum, o) => sum + (o.total ?? 0), 0)
  const ultimaOrden  = ordenes[0]
  const moneda       = ultimaOrden?.moneda ?? null

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">

      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors text-sm font-medium"
        >
          <ArrowLeft size={18} />
          Clientes
        </button>
        <Link
          href={`/ordenes/nueva?cliente_id=${cliente.id}`}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={15} />
          Nueva orden
        </Link>
      </div>

      {/* Info del cliente */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 md:p-6 mb-6">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-blue-100 flex items-center justify-center shrink-0 overflow-hidden">
            {cliente.foto_vehiculo_url ? (
              <img
                src={cliente.foto_vehiculo_url}
                alt="Vehículo"
                className="w-full h-full object-cover"
              />
            ) : (
              <User size={22} className="text-blue-600" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 truncate">{cliente.nombre}</h1>
            <div className="flex flex-wrap gap-3 mt-1.5">
              {cliente.telefono && (
                <span className="flex items-center gap-1.5 text-xs md:text-sm text-gray-500">
                  <Phone size={13} /> {cliente.telefono}
                </span>
              )}
              {cliente.email && (
                <span className="flex items-center gap-1.5 text-xs md:text-sm text-gray-500 truncate">
                  <Mail size={13} /> {cliente.email}
                </span>
              )}
            </div>
          </div>
        </div>
        {/* Stats — fila separada en móvil */}
        <div className="flex gap-4 mt-4 pt-4 border-t border-gray-100">
          <div className="flex-1 text-center">
            <p className="text-xl font-bold text-gray-900">{ordenes.length}</p>
            <p className="text-xs text-gray-400">órdenes</p>
          </div>
          <div className="w-px bg-gray-100" />
          <div className="flex-1 text-center">
            <p className="text-xl font-bold text-green-600">{formatMoney(totalGastado, moneda)}</p>
            <p className="text-xs text-gray-400">total gastado</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 w-fit">
        {TABS.map((t, i) => {
          if (i === 1 && ordenesFinalizadas.length === 0) return null
          return (
            <button
              key={t}
              onClick={() => setTab(i)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === i
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t}
              {i === 1 && (
                <span className="ml-2 bg-blue-100 text-blue-700 text-xs font-bold px-1.5 py-0.5 rounded-full">
                  {ordenesFinalizadas.length}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Tab: Información */}
      {tab === 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Vehículo */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Car size={18} className="text-blue-500" />
              <h2 className="font-bold text-gray-900">Vehículo</h2>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Marca', val: cliente.vehiculo_marca },
                { label: 'Modelo', val: cliente.vehiculo_modelo },
                { label: 'Año', val: cliente.vehiculo_año?.toString() },
                { label: 'Placas', val: cliente.placas },
                { label: 'VIN', val: cliente.vin },
              ].map(({ label, val }) => val ? (
                <div key={label} className="flex justify-between text-sm">
                  <span className="text-gray-400">{label}</span>
                  <span className="font-medium text-gray-900">{val}</span>
                </div>
              ) : null)}
            </div>
          </div>

          {/* Notas */}
          {cliente.notas && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <FileText size={18} className="text-blue-500" />
                <h2 className="font-bold text-gray-900">Notas</h2>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">{cliente.notas}</p>
            </div>
          )}

          {/* Órdenes recientes */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <Clock size={18} className="text-blue-500" />
              <h2 className="font-bold text-gray-900">Órdenes recientes</h2>
            </div>
            {ordenes.length === 0 ? (
              <p className="text-sm text-gray-400">Sin órdenes aún</p>
            ) : (
              <div className="space-y-3">
                {ordenes.slice(0, 5).map(o => (
                  <div key={o.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Orden #{o.numero_orden}</p>
                      <p className="text-xs text-gray-400">{new Date(o.fecha_entrada).toLocaleDateString('es-MX', { dateStyle: 'medium' })}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                        o.estado === 'entregado' ? 'bg-green-100 text-green-700' :
                        o.estado === 'listo' ? 'bg-blue-100 text-blue-700' :
                        o.estado === 'en_proceso' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {o.estado === 'entregado' ? 'Entregado' :
                         o.estado === 'listo' ? 'Listo' :
                         o.estado === 'en_proceso' ? 'En proceso' : 'Recibido'}
                      </span>
                      <span className="text-sm font-bold text-gray-900">{formatMoney(o.total, moneda)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Historial del vehículo */}
      {tab === 1 && (
        <div className="space-y-4">
          {ordenesFinalizadas.map((o, i) => (
            <div key={o.id} className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <CheckCircle size={16} className="text-green-500" />
                    <span className="font-bold text-gray-900">Orden #{o.numero_orden}</span>
                    {i === 0 && (
                      <span className="text-xs bg-blue-100 text-blue-700 font-semibold px-2 py-0.5 rounded-full">Más reciente</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Entregado: {o.fecha_entrega
                      ? new Date(o.fecha_entrega).toLocaleDateString('es-MX', { dateStyle: 'long' })
                      : new Date(o.fecha_entrada).toLocaleDateString('es-MX', { dateStyle: 'long' })}
                  </p>
                </div>
                <span className="text-lg font-bold text-green-600">{formatMoney(o.total, moneda)}</span>
              </div>

              {/* Vehículo en esa orden */}
              <div className="flex flex-wrap gap-3 mb-4">
                {[o.vehiculo_marca, o.vehiculo_modelo, o.vehiculo_año].filter(Boolean).join(' ') && (
                  <span className="flex items-center gap-1.5 text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-full font-medium">
                    <Car size={12} />
                    {[o.vehiculo_marca, o.vehiculo_modelo, o.vehiculo_año].filter(Boolean).join(' ')}
                  </span>
                )}
                {o.placas && (
                  <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-full font-medium">
                    🔖 {o.placas}
                  </span>
                )}
                {o.kilometraje && (
                  <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-full font-medium">
                    📍 {o.kilometraje.toLocaleString()} km
                  </span>
                )}
              </div>

              {/* Servicios realizados */}
              {o.servicios_realizados?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Servicios realizados</p>
                  <div className="space-y-2">
                    {o.servicios_realizados.map((s: any, j: number) => (
                      <div key={j} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <Wrench size={13} className="text-gray-300 shrink-0" />
                          <span className="text-gray-700">{s.descripcion}</span>
                          {s.cantidad > 1 && <span className="text-xs text-gray-400">x{s.cantidad}</span>}
                        </div>
                        <span className="font-medium text-gray-900 shrink-0">{formatMoney(s.total, moneda)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Diagnóstico */}
              {o.diagnostico && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Diagnóstico</p>
                  <p className="text-sm text-gray-600">{o.diagnostico}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}