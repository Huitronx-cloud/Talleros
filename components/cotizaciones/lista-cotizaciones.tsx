'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, Search, FileText } from 'lucide-react'
import { Cotizacion, EstadoCotizacion } from '@/types'
import BadgeEstadoCotizacion from './badge-estado-cotizacion'
import { formatMoney } from '@/lib/utils'

const TABS: { label: string; valor: EstadoCotizacion | 'todas' }[] = [
  { label: 'Todas',     valor: 'todas'     },
  { label: 'Borrador',  valor: 'borrador'  },
  { label: 'Enviadas',  valor: 'enviada'   },
  { label: 'Aprobadas', valor: 'aprobada'  },
  { label: 'Rechazadas',valor: 'rechazada' },
]

export default function ListaCotizaciones({ cotizaciones }: { cotizaciones: Cotizacion[] }) {
  const [tab, setTab]           = useState<EstadoCotizacion | 'todas'>('todas')
  const [busqueda, setBusqueda] = useState('')

  const filtradas = cotizaciones.filter(c => {
    const coincideTab      = tab === 'todas' || c.estado === tab
    const coincideBusqueda = !busqueda ||
      (c.clientes?.nombre ?? '').toLowerCase().includes(busqueda.toLowerCase()) ||
      String(c.numero_cotizacion).includes(busqueda)
    return coincideTab && coincideBusqueda
  })

  const conteo = (v: EstadoCotizacion | 'todas') =>
    v === 'todas' ? cotizaciones.length : cotizaciones.filter(c => c.estado === v).length

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cotizaciones</h1>
          <p className="text-gray-500 text-sm mt-1">{cotizaciones.length} cotizaciones en total</p>
        </div>
        <Link
          href="/cotizaciones/nueva"
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nueva cotización
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-4 bg-gray-100 p-1 rounded-lg w-fit">
        {TABS.map(t => (
          <button
            key={t.valor}
            onClick={() => setTab(t.valor)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
              tab === t.valor ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
            <span className={`text-xs rounded-full px-1.5 py-0.5 ${
              tab === t.valor ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-500'
            }`}>{conteo(t.valor)}</span>
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
          placeholder="Buscar por cliente o # cotización..."
          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400"
        />
      </div>

      {/* Lista */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {filtradas.length === 0 ? (
          <div className="p-16 text-center">
            <FileText className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm font-medium">Sin cotizaciones</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider"># Cotización</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Cliente</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Vigencia</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtradas.map(c => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <Link href={`/cotizaciones/${c.id}`} className="font-mono text-sm font-bold text-blue-600 hover:underline">
                      #{String(c.numero_cotizacion).padStart(4, '0')}
                    </Link>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(c.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {c.clientes?.nombre ?? <span className="text-gray-400">Sin cliente</span>}
                  </td>
                  <td className="px-6 py-4">
                    <BadgeEstadoCotizacion estado={c.estado} />
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{c.vigencia_dias} días</td>
                  <td className="px-6 py-4 text-sm font-bold text-gray-900 text-right">
                    {formatMoney(c.total, c.moneda)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  )
}
