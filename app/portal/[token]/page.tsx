import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'

export default async function PortalClientePage({
  params,
}: {
  params: { token: string }
}) {
  const supabase = createClient()

  const { data: tokenData } = await supabase
    .from('portal_tokens')
    .select('*, ordenes(*, clientes(nombre, telefono), talleres(nombre, telefono))')
    .eq('token', params.token)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (!tokenData) notFound()

  const orden = tokenData.ordenes as any
  const cliente = orden.clientes
  const taller = orden.talleres

  const { data: fotos } = await supabase
    .from('fotos_diagnostico')
    .select('*')
    .eq('orden_id', orden.id)
    .order('created_at', { ascending: true })

  const estadoConfig: Record<string, { label: string; color: string; paso: number }> = {
    recibido:   { label: 'Recibido',   color: 'bg-gray-400',   paso: 1 },
    en_proceso: { label: 'En proceso', color: 'bg-blue-500',   paso: 2 },
    listo:      { label: 'Listo',      color: 'bg-green-500',  paso: 3 },
    entregado:  { label: 'Entregado',  color: 'bg-purple-500', paso: 4 },
  }

  const estadoActual = estadoConfig[orden.estado] ?? estadoConfig.recibido
  const pasos = ['Recibido', 'En proceso', 'Listo', 'Entregado']

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto px-4 py-8">

        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-4 text-center">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{taller.nombre}</p>
          <h1 className="text-xl font-bold text-gray-900">Hola, {cliente.nombre}</h1>
          <p className="text-sm text-gray-500 mt-1">
            Aquí puedes ver el estado de tu {orden.vehiculo_marca} {orden.vehiculo_modelo}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-4">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Estado de tu vehículo</h2>
          <div className="flex items-center justify-between mb-4">
            {pasos.map((paso, i) => (
              <div key={paso} className="flex flex-col items-center gap-1 flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${i + 1 <= estadoActual.paso ? estadoActual.color : 'bg-gray-200'}`}>
                  {i + 1}
                </div>
                <span className="text-xs text-gray-500 text-center">{paso}</span>
              </div>
            ))}
          </div>
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-white text-sm font-medium ${estadoActual.color}`}>
            {estadoActual.label}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-4">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Detalles</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Vehículo</span>
              <span className="font-medium text-gray-900">{orden.vehiculo_marca} {orden.vehiculo_modelo} {orden.vehiculo_año}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Placas</span>
              <span className="font-mono font-medium text-gray-900">{orden.placas ?? '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Problema</span>
              <span className="font-medium text-gray-900 text-right max-w-[60%]">{orden.descripcion_problema}</span>
            </div>
            {orden.fecha_prometida && (
              <div className="flex justify-between">
                <span className="text-gray-400">Fecha prometida</span>
                <span className="font-medium text-gray-900">
                  {new Date(orden.fecha_prometida + 'T12:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'long' })}
                </span>
              </div>
            )}
            {orden.total > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-400">Total</span>
                <span className="font-bold text-gray-900">${orden.total?.toLocaleString()} {orden.moneda ?? 'MXN'}</span>
              </div>
            )}
          </div>
        </div>

        {fotos && fotos.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-4">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Fotos del diagnóstico</h2>
            <div className="space-y-3">
              {fotos.map((foto: any) => (
                <div key={foto.id}>
                  <img src={foto.url} alt={foto.descripcion} className="w-full rounded-xl object-cover max-h-64" />
                  {foto.descripcion && (
                    <p className="text-xs text-gray-500 mt-1.5">{foto.descripcion}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center">
          <p className="text-sm text-gray-500 mb-3">¿Tienes alguna pregunta?</p>
          
            <a href={'https://wa.me/' + taller.telefono}
            className="inline-flex items-center gap-2 bg-green-500 text-white text-sm font-medium px-5 py-2.5 rounded-xl"
            target="_blank"
            rel="noreferrer"
          >
            {'Contactar al taller por WhatsApp'}
          </a>
        </div>

        <p className="text-center text-xs text-gray-300 mt-6">Powered by TallerOS</p>
      </div>
    </div>
  )
}