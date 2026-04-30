import { createClient } from '@/lib/supabase/server'
import { LayoutDashboard, Users, ClipboardList, FileText, TrendingUp } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const ahora = new Date()
  const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1).toISOString()

  const [
    { count: totalClientes },
    { count: ordenesMes },
    { count: cotizacionesAbiertas },
    { data: ingresosMes },
    { data: ordenesRecientes },
  ] = await Promise.all([
    supabase.from('clientes').select('*', { count: 'exact', head: true }),
    supabase.from('ordenes').select('*', { count: 'exact', head: true }).gte('created_at', inicioMes),
    supabase.from('cotizaciones').select('*', { count: 'exact', head: true }).eq('estado', 'enviada'),
    supabase.from('ordenes').select('total').gte('created_at', inicioMes).eq('estado', 'entregado'),
    supabase.from('ordenes').select('id, descripcion_problema, estado, created_at, clientes(nombre)').order('created_at', { ascending: false }).limit(5),
  ])

  const totalIngresos = ingresosMes?.reduce((acc, o) => acc + (o.total || 0), 0) ?? 0

  const tarjetas = [
    { label: 'Clientes activos', valor: totalClientes ?? 0, icono: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Órdenes este mes', valor: ordenesMes ?? 0, icono: ClipboardList, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Cotizaciones abiertas', valor: cotizacionesAbiertas ?? 0, icono: FileText, color: 'text-yellow-600', bg: 'bg-yellow-50' },
    { label: 'Ingresos del mes', valor: `$${totalIngresos.toLocaleString()}`, icono: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50' },
  ]

  const estadoColor: Record<string, string> = {
    recibido: 'bg-gray-100 text-gray-600',
    en_proceso: 'bg-blue-100 text-blue-600',
    listo: 'bg-green-100 text-green-600',
    entregado: 'bg-purple-100 text-purple-600',
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">
          Bienvenido, {user?.email} — resumen general de tu taller.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
        {tarjetas.map(({ label, valor, icono: Icono, color, bg }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-start justify-between mb-4">
              <p className="text-sm font-medium text-gray-500">{label}</p>
              <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center`}>
                <Icono className={`w-5 h-5 ${color}`} />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{valor}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Órdenes recientes</h2>
        </div>
        {ordenesRecientes && ordenesRecientes.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {ordenesRecientes.map((orden: any) => (
              <div key={orden.id} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {(orden.clientes as any)?.nombre ?? 'Cliente'}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{orden.descripcion_problema}</p>
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${estadoColor[orden.estado] ?? 'bg-gray-100 text-gray-600'}`}>
                  {orden.estado.replace('_', ' ')}
                </span>
              </div>
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
  )
}