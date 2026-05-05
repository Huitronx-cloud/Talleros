import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { LayoutDashboard, Users, ClipboardList, FileText, TrendingUp, Download, AlertTriangle, Clock } from 'lucide-react'
import GraficaIngresos from './grafica-ingresos'

export default async function DashboardPage() {
  const supabase = createClient()

  const ahora      = new Date()
  const inicioMes  = new Date(ahora.getFullYear(), ahora.getMonth(), 1).toISOString()
  const inicioGrafica = new Date(ahora.getFullYear(), ahora.getMonth() - 5, 1).toISOString()

  const [
    { count: totalClientes },
    { count: ordenesMes },
    { count: cotizacionesAbiertas },
    { data: ingresosMes },
    { data: ordenesRecientes },
    { data: ordenesRetrasadas },
    { data: ingresosPorMes },
    { data: taller },
    { data: ordenesTiempo },
  ] = await Promise.all([
    supabase.from('clientes').select('*', { count: 'exact', head: true }),
    supabase.from('ordenes').select('*', { count: 'exact', head: true }).gte('created_at', inicioMes),
    supabase.from('cotizaciones').select('*', { count: 'exact', head: true }).eq('estado', 'enviada'),
    supabase.from('ordenes').select('total').gte('created_at', inicioMes).eq('estado', 'entregado'),
    supabase.from('ordenes')
      .select('id, descripcion_problema, estado, created_at, clientes(nombre)')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase.from('ordenes')
      .select('id, numero_orden, fecha_prometida, estado, clientes(nombre)')
      .lt('fecha_prometida', ahora.toISOString().split('T')[0])
      .neq('estado', 'entregado')
      .not('fecha_prometida', 'is', null)
      .order('fecha_prometida', { ascending: true }),
    supabase.from('ordenes')
      .select('total, created_at')
      .gte('created_at', inicioGrafica)
      .eq('estado', 'entregado'),
    supabase.from('talleres').select('nombre').single(),
    // Órdenes con tiempo registrado
    supabase.from('ordenes')
      .select('descripcion_problema, servicios_realizados, tiempo_trabajado_minutos, mecanico_asignado, estado')
      .gt('tiempo_trabajado_minutos', 0)
      .eq('estado', 'entregado')
      .order('created_at', { ascending: false })
      .limit(50),
  ])

  const totalIngresos = ingresosMes?.reduce((acc, o) => acc + (o.total || 0), 0) ?? 0

  // Agrupar ingresos por mes
  const meses = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(ahora.getFullYear(), ahora.getMonth() - 5 + i, 1)
    return {
      key:   `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: d.toLocaleDateString('es-MX', { month: 'short' }),
      total: 0,
    }
  })
  ingresosPorMes?.forEach(o => {
    const key = o.created_at.slice(0, 7)
    const mes = meses.find(m => m.key === key)
    if (mes) mes.total += o.total || 0
  })

  // Calcular promedios de tiempo por tipo de servicio
  const mapaServicios: Record<string, { minutos: number[]; mecanicos: Set<string> }> = {}
  ordenesTiempo?.forEach((o: any) => {
    const min      = o.tiempo_trabajado_minutos ?? 0
    const mecanico = o.mecanico_asignado ?? 'Sin asignar'
    const servicios: { descripcion: string }[] = o.servicios_realizados ?? []

    if (servicios.length === 0) {
      const key = (o.descripcion_problema ?? 'Servicio general').slice(0, 40)
      if (!mapaServicios[key]) mapaServicios[key] = { minutos: [], mecanicos: new Set() }
      mapaServicios[key].minutos.push(min)
      mapaServicios[key].mecanicos.add(mecanico)
    } else {
      servicios.forEach(s => {
        const key = s.descripcion.slice(0, 40)
        if (!mapaServicios[key]) mapaServicios[key] = { minutos: [], mecanicos: new Set() }
        mapaServicios[key].minutos.push(min)
        mapaServicios[key].mecanicos.add(mecanico)
      })
    }
  })

  const promediosServicios = Object.entries(mapaServicios)
    .map(([nombre, { minutos, mecanicos }]) => ({
      nombre,
      promedio: Math.round(minutos.reduce((a, b) => a + b, 0) / minutos.length),
      cantidad: minutos.length,
      mecanicos: Array.from(mecanicos).join(', '),
    }))
    .sort((a, b) => b.cantidad - a.cantidad)
    .slice(0, 6)

  const formatMin = (min: number) => {
    const h = Math.floor(min / 60)
    const m = min % 60
    if (h === 0) return `${m}m`
    return `${h}h ${m}m`
  }

  const tarjetas = [
    { label: 'Clientes activos',      valor: totalClientes ?? 0,                   icono: Users,         color: 'text-blue-600',   bg: 'bg-blue-50',   href: '/clientes'     },
    { label: 'Órdenes este mes',      valor: ordenesMes ?? 0,                      icono: ClipboardList, color: 'text-green-600',  bg: 'bg-green-50',  href: '/ordenes'      },
    { label: 'Cotizaciones abiertas', valor: cotizacionesAbiertas ?? 0,            icono: FileText,      color: 'text-yellow-600', bg: 'bg-yellow-50', href: '/cotizaciones' },
    { label: 'Ingresos del mes',      valor: `$${totalIngresos.toLocaleString()}`, icono: TrendingUp,    color: 'text-purple-600', bg: 'bg-purple-50', href: '/ordenes'      },
  ]

  const estadoColor: Record<string, string> = {
    recibido:   'bg-gray-100 text-gray-600',
    en_proceso: 'bg-blue-100 text-blue-600',
    listo:      'bg-green-100 text-green-600',
    entregado:  'bg-purple-100 text-purple-600',
  }

  const diasRetraso = (fecha: string) => {
    const prometida = new Date(fecha + 'T12:00:00')
    return Math.floor((ahora.getTime() - prometida.getTime()) / (1000 * 60 * 60 * 24))
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">
            {taller?.nombre ?? 'Tu taller'} — resumen general.
          </p>
        </div>
        <Link
          href="/api/exportar"
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
        >
          <Download className="w-4 h-4" />
          Exportar a Excel
        </Link>
      </div>

      {/* Alerta de órdenes retrasadas */}
      {ordenesRetrasadas && ordenesRetrasadas.length > 0 && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <p className="text-sm font-semibold text-red-700">
              {ordenesRetrasadas.length} {ordenesRetrasadas.length === 1 ? 'orden retrasada' : 'órdenes retrasadas'}
            </p>
          </div>
          <div className="space-y-2">
            {ordenesRetrasadas.map((o: any) => (
              <Link
                key={o.id}
                href={`/ordenes/${o.id}`}
                className="flex items-center justify-between bg-white border border-red-100 rounded-lg px-4 py-2.5 hover:border-red-300 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono font-semibold text-gray-500">
                    #{String(o.numero_orden).padStart(4, '0')}
                  </span>
                  <span className="text-sm font-medium text-gray-900">
                    {(o.clientes as any)?.nombre ?? 'Cliente'}
                  </span>
                </div>
                <span className="text-xs font-semibold text-red-600 bg-red-100 px-2.5 py-1 rounded-full">
                  {diasRetraso(o.fecha_prometida)} días de retraso
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Tarjetas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {tarjetas.map(({ label, valor, icono: Icono, color, bg, href }) => (
          <Link key={label} href={href} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md hover:border-gray-300 transition-all">
            <div className="flex items-start justify-between mb-4">
              <p className="text-sm font-medium text-gray-500">{label}</p>
              <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center`}>
                <Icono className={`w-5 h-5 ${color}`} />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{valor}</p>
          </Link>
        ))}
      </div>

      {/* Gráfica + Órdenes recientes */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">
        <div className="lg:col-span-3 bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-6">Ingresos últimos 6 meses</h2>
          <GraficaIngresos datos={meses} />
        </div>

        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900">Órdenes recientes</h2>
          </div>
          {ordenesRecientes && ordenesRecientes.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {ordenesRecientes.map((orden: any) => (
                <Link key={orden.id} href={`/ordenes/${orden.id}`} className="px-5 py-3.5 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {(orden.clientes as any)?.nombre ?? 'Cliente'}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{orden.descripcion_problema}</p>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 ml-2 ${estadoColor[orden.estado] ?? 'bg-gray-100 text-gray-600'}`}>
                    {orden.estado.replace('_', ' ')}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <LayoutDashboard className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">Aún no hay órdenes registradas.</p>
            </div>
          )}
        </div>
      </div>

      {/* Tiempos por servicio */}
      {promediosServicios.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-5">
            <Clock className="w-4 h-4 text-blue-500" />
            <h2 className="text-base font-semibold text-gray-900">Tiempos promedio por servicio</h2>
            <span className="text-xs text-gray-400 ml-auto">Basado en {ordenesTiempo?.length ?? 0} órdenes con tiempo registrado</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {promediosServicios.map(s => {
              const porcentaje = Math.min(100, (s.promedio / 480) * 100) // max 8h
              return (
                <div key={s.nombre} className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="text-sm font-semibold text-gray-900 leading-tight line-clamp-2">{s.nombre}</p>
                    <span className="text-lg font-bold text-blue-600 flex-shrink-0">{formatMin(s.promedio)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mb-2">
                    <div
                      className="bg-blue-500 h-1.5 rounded-full transition-all"
                      style={{ width: `${porcentaje}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>{s.cantidad} {s.cantidad === 1 ? 'orden' : 'órdenes'}</span>
                    <span className="truncate ml-2">{s.mecanicos}</span>
                  </div>
                </div>
              )
            })}
          </div>
          {promediosServicios.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">
              Los promedios aparecerán cuando los técnicos registren tiempo en sus órdenes.
            </p>
          )}
        </div>
      )}
    </div>
  )
}