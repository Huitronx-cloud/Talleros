'use client'

import { useState, useMemo } from 'react'
import {
  TrendingUp, Users, Clock, Wrench, DollarSign,
  BarChart2, RefreshCw, Award, Target
} from 'lucide-react'

type Periodo = '1m' | '3m' | '6m'

interface Props {
  ordenes:      any[]
  clientes:     any[]
  cotizaciones: any[]
}

export default function ReportesClient({ ordenes, clientes, cotizaciones }: Props) {
  const [periodo, setPeriodo] = useState<Periodo>('3m')

  const desde = useMemo(() => {
    const d = new Date()
    if (periodo === '1m') d.setMonth(d.getMonth() - 1)
    if (periodo === '3m') d.setMonth(d.getMonth() - 3)
    if (periodo === '6m') d.setMonth(d.getMonth() - 6)
    return d
  }, [periodo])

  // Filtrar por período
  const ordenesFiltradas    = ordenes.filter(o => new Date(o.created_at) >= desde)
  const clientesFiltrados   = clientes.filter(c => new Date(c.created_at) >= desde)
  const cotizacionesFiltradas = cotizaciones.filter(c => new Date(c.created_at) >= desde)

  const ordenesEntregadas = ordenesFiltradas.filter(o => o.estado === 'entregado')

  // KPIs principales
  const ingresosTotales   = ordenesEntregadas.reduce((acc, o) => acc + (o.total || 0), 0)
  const ticketPromedio    = ordenesEntregadas.length > 0 ? ingresosTotales / ordenesEntregadas.length : 0
  const tasaConversion    = cotizacionesFiltradas.length > 0
    ? Math.round((ordenesFiltradas.length / cotizacionesFiltradas.length) * 100)
    : 0
  const clientesNuevos    = clientesFiltrados.length

  // Ingresos por mes
  const ingresosPorMes = useMemo(() => {
    const mapa: Record<string, number> = {}
    const meses = periodo === '1m' ? 1 : periodo === '3m' ? 3 : 6
    for (let i = meses - 1; i >= 0; i--) {
      const d = new Date()
      d.setMonth(d.getMonth() - i)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      mapa[key] = 0
    }
    ordenesEntregadas.forEach(o => {
      const key = o.created_at.slice(0, 7)
      if (key in mapa) mapa[key] += o.total || 0
    })
    return Object.entries(mapa).map(([mes, total]) => ({
      mes: new Date(mes + '-01').toLocaleDateString('es-MX', { month: 'short', year: '2-digit' }),
      total,
    }))
  }, [ordenesFiltradas, periodo])

  // Por mecánico
  const porMecanico = useMemo(() => {
    const mapa: Record<string, { ordenes: number; ingresos: number }> = {}
    ordenesEntregadas.forEach(o => {
      const m = o.mecanico_asignado || 'Sin asignar'
      if (!mapa[m]) mapa[m] = { ordenes: 0, ingresos: 0 }
      mapa[m].ordenes++
      mapa[m].ingresos += o.total || 0
    })
    return Object.entries(mapa)
      .map(([nombre, data]) => ({ nombre, ...data }))
      .sort((a, b) => b.ingresos - a.ingresos)
      .slice(0, 5)
  }, [ordenesFiltradas])

  // Clientes recurrentes
  const clientesRecurrentes = useMemo(() => {
    const conteo: Record<string, number> = {}
    ordenesFiltradas.forEach(o => {
      if (o.cliente_id) conteo[o.cliente_id] = (conteo[o.cliente_id] || 0) + 1
    })
    const recurrentes = Object.values(conteo).filter(v => v > 1).length
    const nuevos      = Object.values(conteo).filter(v => v === 1).length
    return { recurrentes, nuevos }
  }, [ordenesFiltradas])

  const maxIngreso = Math.max(...ingresosPorMes.map(m => m.total), 1)
  const maxMecanico = Math.max(...porMecanico.map(m => m.ingresos), 1)

  const fmt = (n: number) => `$${n.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">

      {/* Header */}
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reportes avanzados</h1>
          <p className="text-gray-500 text-sm mt-1">Análisis detallado de tu taller</p>
        </div>
        <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
          {([['1m', 'Último mes'], ['3m', '3 meses'], ['6m', '6 meses']] as [Periodo, string][]).map(([val, label]) => (
            <button
              key={val}
              onClick={() => setPeriodo(val)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                periodo === val ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Ingresos totales',    valor: fmt(ingresosTotales),          icono: DollarSign, color: 'text-green-600',  bg: 'bg-green-100' },
          { label: 'Ticket promedio',     valor: fmt(ticketPromedio),            icono: TrendingUp, color: 'text-blue-600',   bg: 'bg-blue-100' },
          { label: 'Clientes nuevos',     valor: clientesNuevos.toString(),      icono: Users,      color: 'text-purple-600', bg: 'bg-purple-100' },
          { label: 'Tasa de conversión',  valor: `${tasaConversion}%`,           icono: Target,     color: 'text-amber-600',  bg: 'bg-amber-100' },
        ].map(({ label, valor, icono: Icono, color, bg }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mb-3`}>
              <Icono className={`w-5 h-5 ${color}`} />
            </div>
            <p className="text-xs text-gray-500 mb-1">{label}</p>
            <p className="text-2xl font-bold text-gray-900">{valor}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

        {/* Ingresos por mes */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-6">
            <BarChart2 className="w-4 h-4 text-blue-500" />
            <h2 className="text-sm font-semibold text-gray-900">Ingresos por mes</h2>
          </div>
          {ingresosPorMes.every(m => m.total === 0) ? (
            <div className="flex items-center justify-center h-40 text-gray-300 text-sm">
              Sin datos en este período
            </div>
          ) : (
            <div className="flex items-end gap-3 h-48">
              {ingresosPorMes.map(({ mes, total }) => (
                <div key={mes} className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-xs font-semibold text-gray-700">
                    {total > 0 ? fmt(total) : ''}
                  </span>
                  <div className="w-full flex items-end" style={{ height: 140 }}>
                    <div
                      className="w-full bg-blue-500 rounded-t-lg transition-all hover:bg-blue-600"
                      style={{ height: `${Math.max(4, (total / maxIngreso) * 100)}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-400">{mes}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Clientes nuevos vs recurrentes */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-6">
            <RefreshCw className="w-4 h-4 text-purple-500" />
            <h2 className="text-sm font-semibold text-gray-900">Clientes nuevos vs recurrentes</h2>
          </div>
          <div className="space-y-4">
            {[
              { label: 'Clientes nuevos',      valor: clientesRecurrentes.nuevos,      color: '#3b82f6', bg: '#eff6ff' },
              { label: 'Clientes recurrentes', valor: clientesRecurrentes.recurrentes, color: '#8b5cf6', bg: '#f5f3ff' },
            ].map(({ label, valor, color, bg }) => {
              const total = clientesRecurrentes.nuevos + clientesRecurrentes.recurrentes
              const pct   = total > 0 ? Math.round((valor / total) * 100) : 0
              return (
                <div key={label}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="font-medium text-gray-700">{label}</span>
                    <span className="font-bold" style={{ color }}>{valor} ({pct}%)</span>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, background: color }}
                    />
                  </div>
                </div>
              )
            })}

            <div className="mt-6 pt-4 border-t border-gray-100">
              <div className="grid grid-cols-3 gap-3 text-center">
                {[
                  { label: 'Total órdenes',    valor: ordenesFiltradas.length },
                  { label: 'Entregadas',        valor: ordenesEntregadas.length },
                  { label: 'En proceso',        valor: ordenesFiltradas.filter(o => o.estado === 'en_proceso').length },
                ].map(({ label, valor }) => (
                  <div key={label} className="bg-gray-50 rounded-xl p-3">
                    <p className="text-lg font-bold text-gray-900">{valor}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Rendimiento por mecánico */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
        <div className="flex items-center gap-2 mb-6">
          <Award className="w-4 h-4 text-amber-500" />
          <h2 className="text-sm font-semibold text-gray-900">Rendimiento por mecánico</h2>
        </div>
        {porMecanico.length === 0 ? (
          <div className="flex items-center justify-center h-24 text-gray-300 text-sm">
            Sin datos en este período
          </div>
        ) : (
          <div className="space-y-4">
            {porMecanico.map(({ nombre, ordenes, ingresos }, i) => (
              <div key={nombre} className="flex items-center gap-4">
                <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center text-xs font-bold text-amber-700 shrink-0">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-800 truncate">{nombre}</span>
                    <span className="font-bold text-gray-900 ml-2">{fmt(ingresos)}</span>
                  </div>
                  <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-amber-400 transition-all"
                      style={{ width: `${(ingresos / maxMecanico) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{ordenes} {ordenes === 1 ? 'orden' : 'órdenes'} entregadas</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Resumen de conversión */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-6">
          <Target className="w-4 h-4 text-green-500" />
          <h2 className="text-sm font-semibold text-gray-900">Embudo de conversión</h2>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {[
            { label: 'Cotizaciones',  valor: cotizacionesFiltradas.length,  color: '#f59e0b', w: 100 },
            { label: 'Órdenes',       valor: ordenesFiltradas.length,        color: '#3b82f6', w: cotizacionesFiltradas.length > 0 ? (ordenesFiltradas.length / cotizacionesFiltradas.length) * 100 : 0 },
            { label: 'Entregadas',    valor: ordenesEntregadas.length,       color: '#22c55e', w: ordenesFiltradas.length > 0 ? (ordenesEntregadas.length / ordenesFiltradas.length) * 100 : 0 },
          ].map(({ label, valor, color, w }, i) => (
            <div key={label} className="flex-1 min-w-[120px]">
              <div className="h-12 rounded-xl flex items-center justify-center font-bold text-white text-lg"
                   style={{ background: color, opacity: 0.9 - i * 0.1 }}>
                {valor}
              </div>
              <p className="text-xs text-gray-500 text-center mt-2">{label}</p>
              <p className="text-xs font-semibold text-center" style={{ color }}>
                {i > 0 ? `${Math.round(w)}%` : '100%'}
              </p>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}