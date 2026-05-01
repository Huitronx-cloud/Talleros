import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { LayoutDashboard, Users, ClipboardList, FileText, TrendingUp, Download, AlertTriangle } from 'lucide-react'
import GraficaIngresos from './grafica-ingresos'

export default async function DashboardPage() {
  const supabase = createClient()

  const ahora = new Date()
  const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1).toISOString()

  // Últimos 6 meses para la gráfica
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
  ] = await Promise.all([
    supabase.from('clientes').select('*', { count: 'exact', head: true }),
    supabase.from('ordenes').select('*', { count: 'exact', head: true }).gte('created_at', inicioMes),
    supabase.from('cotizaciones').select('*', { count: 'exact', head: true }).eq('estado', 'enviada'),
    supabase.from('ordenes').select('total').gte('created_at', inicioMes).eq('estado', 'entregado'),
    supabase.from('ordenes')
      .select('id, descripcion_problema, estado, created_at, clientes(nombre)')
      .order('created_at', { ascending: false })
      .limit(5),
    // Órdenes con fecha prometida vencida y no entregadas
    supabase.from('ordenes')
      .select('id, numero_orden, fecha_prometida, estado, clientes(nombre)')
      .lt('fecha_prometida', ahora.toISOString().split('T')[0])
      .neq('estado', 'entregado')
      .not('fecha_prometida', 'is', null)
      .order('fecha_prometida', { ascending: true }),
    // Ingresos de los últimos 6 meses
    supabase.from('ordenes')
      .select('total, created_at')
      .gte('created_at', inicioGrafica)
      .eq('estado', 'entregado'),
    // Nombre del taller
    supabase.from('talleres').select('nombre').single(),
  ])

  const totalIngresos = ingresosMes?.reduce((acc, o) => acc + (o.total || 0), 0) ?? 0

  // Agrupar ingresos por mes para la gráfica
  const meses = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(ahora.getFullYear(), ahora.getMonth() - 5 + i, 1)
    return {
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: d.toLocaleDateString('es-MX', { month: 'short' }),
      total: 0,
    }
  })

  ingresosPorMes?.forEach(o => {
    const key = o.created_at.slice(0, 7)
    const mes = meses.find(m => m.key === key)
    if (mes) mes.total += o.total || 0
  })

  const tarjetas = [
    { label: 'Clientes activos',     valor: totalClientes ?? 0,              icono: Users,         color: 'text-blue-600',   bg: 'bg-blue-50',   href: '/clientes'     },
    { label: 'Órdenes este mes',     valor: ordenesMes ?? 0,                 icono: ClipboardList, color: 'text-green-600',  bg: 'bg-green-50',  href: '/ordenes'      },
    { label: 'Cotizaciones abiertas',valor: cotizacionesAbiertas ?? 0,       icono: FileText,      color: 'text-yellow-600', bg: 'bg-yellow-50', href: '/cotizaciones' },
    { label: 'Ingresos del mes',     valor: `$${totalIngresos.toLocaleString()}`, icono: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50', href: '/ordenes'  },
  ]

  const estadoColor: Record<string, string> = {
    recibido:   'bg-gray-100 text-gray-600',
    en_proceso: 'bg-blue-100 text-blue-600',
    listo:      'bg-green-100 text-green-600',
    entregado:  'bg-purple-100 text-purple-600',
  }

  const diasRetraso = (fecha: string) => {
    const hoy = new Date()
    const prometida = new Date(fecha + 'T12:00:00')
    return Math.floor((hoy.getTime() - prometida.getTime()) / (1000 * 60 * 60 * 24))
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
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Gráfica de ingresos */}
        <div className="lg:col-span-3 bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-6">Ingresos últimos 6 meses</h2>
          <GraficaIngresos datos={meses} />
        </div>

        {/* Órdenes recientes */}
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
    </div>
  )
}