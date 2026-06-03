'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, Search, ClipboardList, Car, User, Calendar } from 'lucide-react'
import { Orden, EstadoOrden } from '@/types'
import BadgeEstado from './badge-estado'
import { formatMoney } from '@/lib/utils'

const TABS = [
  { label: 'Todas',      valor: 'todas'      as const, activo: 'bg-gray-800 text-white',    inactivo: 'text-gray-600 hover:text-gray-800',   punto: 'bg-gray-500'    },
  { label: 'Recibidas',  valor: 'recibido'   as const, activo: 'bg-gray-500 text-white',    inactivo: 'text-gray-500 hover:text-gray-600',   punto: 'bg-gray-400'    },
  { label: 'En proceso', valor: 'en_proceso' as const, activo: 'bg-blue-600 text-white',    inactivo: 'text-blue-600 hover:text-blue-700',   punto: 'bg-blue-500'    },
  { label: 'Listas',     valor: 'listo'      as const, activo: 'bg-green-600 text-white',   inactivo: 'text-green-600 hover:text-green-700', punto: 'bg-green-500'   },
  { label: 'Entregadas', valor: 'entregado'  as const, activo: 'bg-purple-600 text-white',  inactivo: 'text-purple-600 hover:text-purple-700',punto: 'bg-purple-500' },
]

export default function ListaOrdenes({ ordenes }: { ordenes: Orden[] }) {
  const [tab, setTab]           = useState<EstadoOrden | 'todas'>('todas')
  const [busqueda, setBusqueda] = useState('')

  const filtradas = ordenes.filter(o => {
    const coincideTab = tab === 'todas' || o.estado === tab
    const termino = busqueda.toLowerCase()
    const coincideBusqueda = !busqueda ||
      (o.clientes?.nombre ?? '').toLowerCase().includes(termino) ||
      (o.placas ?? '').toUpperCase().includes(busqueda.toUpperCase()) ||
      String(o.numero_orden).includes(termino)
    return coincideTab && coincideBusqueda
  })

  const conteo = (estado: EstadoOrden | 'todas') =>
    estado === 'todas' ? ordenes.length : ordenes.filter(o => o.estado === estado).length

    return (
    <div className="max-w-screen-lg mx-auto">
      {/* Encabezado */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Órdenes de trabajo</h1>
          <p className="text-gray-500 text-sm mt-1">{ordenes.length} órdenes en total</p>
        </div>
        <Link
          href="/ordenes/nueva"
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nueva orden
        </Link>
      </div>

      {/* Tabs con colores */}
      <div className="flex items-center gap-1.5 mb-4 overflow-x-auto pb-1">
        {TABS.map(t => (
          <button
            key={t.valor}
            onClick={() => setTab(t.valor)}
            className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap border-2 ${
              tab === t.valor
                ? `${t.activo} border-transparent shadow-sm`
                : `bg-white ${t.inactivo} border-gray-200 hover:border-gray-300`
            }`}
          >
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
              tab === t.valor ? 'bg-white' : t.punto
            }`} />
            {t.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
              tab === t.valor ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
            }`}>
              {conteo(t.valor)}
            </span>
          </button>
        ))}
      </div>

      {/* Buscador */}
      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          placeholder="Buscar por cliente, placas o # orden..."
          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400"
        />
      </div>

      {/* Lista */}
      <div className="space-y-3">
        {filtradas.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
            <ClipboardList className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm font-medium">
              {busqueda || tab !== 'todas' ? 'Sin resultados' : 'Aún no tienes órdenes'}
            </p>
            {!busqueda && tab === 'todas' && (
              <>
                <p className="text-gray-300 text-xs mt-1 mb-4">Crea tu primera orden de trabajo para empezar a operar.</p>
                <Link
                  href="/ordenes/nueva"
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Crear primera orden
                </Link>
              </>
            )}
          </div>
        ) : (
          filtradas.map(orden => (
            <Link
              key={orden.id}
              href={`/ordenes/${orden.id}`}
              className="block bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-300 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded font-mono">
                      #{String(orden.numero_orden).padStart(4, '0')}
                    </span>
                    <BadgeEstado estado={orden.estado} />
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <User className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {orden.clientes?.nombre ?? 'Cliente no asignado'}
                    </p>
                  </div>
                  {(orden.vehiculo_marca || orden.placas) && (
                    <div className="flex items-center gap-2">
                      <Car className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                      <p className="text-sm text-gray-600 truncate">
                        {[orden.vehiculo_marca, orden.vehiculo_modelo, orden.vehiculo_año]
                          .filter(Boolean).join(' ')}
                        {orden.placas && (
                          <span className="ml-2 font-mono text-xs bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded">
                            {orden.placas}
                          </span>
                        )}
                      </p>
                    </div>
                  )}
                  {orden.descripcion_problema && (
                    <p className="text-sm text-gray-500 mt-2 truncate">
                      {orden.descripcion_problema}
                    </p>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-lg font-bold text-gray-900">
                    {formatMoney(orden.total, orden.moneda)}
                  </p>
                  {orden.fecha_prometida && (
                    <div className="flex items-center gap-1 text-xs text-gray-400 mt-1 justify-end">
                      <Calendar className="w-3 h-3" />
                      {new Date(orden.fecha_prometida + 'T12:00:00').toLocaleDateString('es-MX', {
                        day: 'numeric', month: 'short',
                      })}
                    </div>
                  )}
                  {orden.mecanico_asignado && (
                    <p className="text-xs text-gray-400 mt-0.5">{orden.mecanico_asignado}</p>
                  )}
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}