export const dynamic = 'force-dynamic'
import { createClient, getAuthUser } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Car, Calendar, DollarSign, Wrench, Clock } from 'lucide-react'
import BadgeEstado from '@/components/ordenes/badge-estado'

export default async function HistorialVehiculoPage({
  params,
}: {
  params: { vin: string }
}) {
  const supabase = createClient()

  const user = await getAuthUser()
  if (!user) redirect('/login')

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('taller_id')
    .eq('id', user.id)
    .single()

  const vin = decodeURIComponent(params.vin).toUpperCase()

  // Buscar por VIN o placas dentro del taller del usuario
  const { data: ordenes } = await supabase
    .from('ordenes')
    .select('*, clientes(nombre, telefono)')
    .eq('taller_id', usuario?.taller_id ?? '')
    .or(`vin.eq.${vin},placas.eq.${vin}`)
    .order('created_at', { ascending: false })

  if (!ordenes || ordenes.length === 0) notFound()

  const primera   = ordenes[ordenes.length - 1]
  const vehiculo  = [primera.vehiculo_marca, primera.vehiculo_modelo, primera.vehiculo_año].filter(Boolean).join(' ')
  const totalGastado = ordenes.filter(o => o.estado === 'entregado').reduce((a, o) => a + (o.total ?? 0), 0)
  const totalVisitas = ordenes.length
  const tiempoTotal  = ordenes.reduce((a, o) => a + ((o as any).tiempo_trabajado_minutos ?? 0), 0)

  const formatMin = (m: number) => {
    const h = Math.floor(m / 60)
    const min = m % 60
    if (h === 0) return `${min}m`
    return `${h}h ${min}m`
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link href="/ordenes" className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 mb-3">
          <ArrowLeft className="w-4 h-4" /> Volver
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
            <Car className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{vehiculo || 'Vehículo'}</h1>
            <p className="text-sm text-gray-400 font-mono">{vin}</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{totalVisitas}</p>
          <p className="text-xs text-gray-500 mt-0.5">Visitas al taller</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-2xl font-bold text-green-600">
            ${totalGastado.toLocaleString('es-MX', { maximumFractionDigits: 0 })}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">Total invertido</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-2xl font-bold text-purple-600">{tiempoTotal > 0 ? formatMin(tiempoTotal) : '—'}</p>
          <p className="text-xs text-gray-500 mt-0.5">Tiempo en taller</p>
        </div>
      </div>

      {/* Timeline de órdenes */}
      <div className="space-y-3">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Historial de servicios</p>
        {ordenes.map((orden, i) => (
          <Link
            key={orden.id}
            href={`/ordenes/${orden.id}`}
            className="block bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-300 hover:shadow-sm transition-all"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-mono font-bold text-gray-400">
                    #{String(orden.numero_orden).padStart(4, '0')}
                  </span>
                  <BadgeEstado estado={orden.estado} />
                  {i === 0 && (
                    <span className="text-xs bg-blue-100 text-blue-700 font-semibold px-2 py-0.5 rounded-full">
                      Más reciente
                    </span>
                  )}
                </div>
                {orden.descripcion_problema && (
                  <p className="text-sm text-gray-700 font-medium mb-1">{orden.descripcion_problema}</p>
                )}
                {orden.diagnostico && (
                  <p className="text-xs text-gray-500 truncate">{orden.diagnostico}</p>
                )}
                {/* Servicios realizados */}
                {orden.servicios_realizados?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {orden.servicios_realizados.slice(0, 3).map((s: any, j: number) => (
                      <span key={j} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                        {s.descripcion}
                      </span>
                    ))}
                    {orden.servicios_realizados.length > 3 && (
                      <span className="text-xs text-gray-400">+{orden.servicios_realizados.length - 3} más</span>
                    )}
                  </div>
                )}
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-base font-bold text-gray-900">
                  ${(orden.total ?? 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </p>
                <div className="flex items-center gap-1 text-xs text-gray-400 mt-1 justify-end">
                  <Calendar className="w-3 h-3" />
                  {new Date(orden.created_at).toLocaleDateString('es-MX', {
                    day: 'numeric', month: 'short', year: 'numeric',
                  })}
                </div>
                {orden.kilometraje && (
                  <p className="text-xs text-gray-400 mt-0.5">{orden.kilometraje.toLocaleString()} km</p>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}