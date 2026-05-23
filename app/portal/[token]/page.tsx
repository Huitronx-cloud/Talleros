import { createClient as createAnonClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import { Car, Clock, CheckCircle2, Package, Wrench, Phone } from 'lucide-react'

export default async function PortalClientePage({
  params,
}: {
  params: { token: string }
}) {
  const supabase = createAnonClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data: tokenData } = await supabase
    .from('portal_tokens')
    .select('*, ordenes(*, clientes(nombre, telefono), talleres(nombre, telefono, logo_url, horario, instagram, facebook, direccion))')
    .eq('token', params.token)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (!tokenData) notFound()

  const orden   = tokenData.ordenes as any
  const cliente = orden?.clientes ?? {}
  const taller  = orden?.talleres ?? {}

  const { data: todasFotos } = await supabase
    .from('fotos_diagnostico')
    .select('*')
    .eq('orden_id', orden.id)
    .order('created_at', { ascending: true })

  const fotosRecepcion   = todasFotos?.filter((f: any) => f.tipo === 'recepcion') ?? []
  const fotosDiagnostico = todasFotos?.filter((f: any) => f.tipo !== 'recepcion' && f.tipo !== 'firma') ?? []

  const estadoConfig: Record<string, { label: string; descripcion: string; icono: any; color: string; bg: string; paso: number }> = {
    recibido:   { label: 'Recibido',   descripcion: 'Tu vehículo está en el taller.',       icono: Package,      color: 'text-gray-600',   bg: 'bg-gray-100',   paso: 1 },
    en_proceso: { label: 'En proceso', descripcion: 'Estamos trabajando en tu vehículo.',    icono: Wrench,       color: 'text-blue-600',   bg: 'bg-blue-100',   paso: 2 },
    listo:      { label: '¡Listo!',    descripcion: 'Tu vehículo está listo para recoger.',  icono: CheckCircle2, color: 'text-green-600',  bg: 'bg-green-100',  paso: 3 },
    entregado:  { label: 'Entregado',  descripcion: 'Tu vehículo fue entregado. ¡Gracias!',  icono: Car,          color: 'text-purple-600', bg: 'bg-purple-100', paso: 4 },
  }

  const pasos = [
    { label: 'Recibido',   icono: Package      },
    { label: 'En proceso', icono: Wrench       },
    { label: 'Listo',      icono: CheckCircle2 },
    { label: 'Entregado',  icono: Car          },
  ]

  const cfg = estadoConfig[orden.estado] ?? estadoConfig.recibido
  const IconoEstado = cfg.icono

  const diasRestantes = (() => {
    if (!orden.fecha_prometida || orden.estado === 'entregado') return null
    const hoy       = new Date()
    const prometida = new Date(orden.fecha_prometida + 'T12:00:00')
    const diff      = Math.ceil((prometida.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
    return diff
  })()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto px-4 py-8 space-y-4">

        {/* Header del taller */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center">
          {taller.logo_url ? (
            <img src={taller.logo_url} alt={taller.nombre} className="h-12 object-contain mx-auto mb-3" />
          ) : (
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Wrench className="w-6 h-6 text-white" />
            </div>
          )}
          <p className="text-sm font-semibold text-gray-700">{taller.nombre}</p>
          {taller.horario && (
            <div className="flex items-center justify-center gap-1.5 mt-1.5">
              <Clock className="w-3.5 h-3.5 text-gray-400" />
              <p className="text-xs text-gray-400">{taller.horario}</p>
            </div>
          )}
          <h1 className="text-xl font-bold text-gray-900 mt-3">Hola, {cliente.nombre} 👋</h1>
          <p className="text-sm text-gray-500 mt-1">
            Aquí puedes seguir el estado de tu{' '}
            {[orden.vehiculo_marca, orden.vehiculo_modelo].filter(Boolean).join(' ')}
            {orden.placas ? ` (${orden.placas})` : ''}
          </p>
        </div>

        {/* Estado actual */}
        <div className={`rounded-2xl border border-transparent p-6 ${cfg.bg}`}>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center flex-shrink-0 shadow-sm">
              <IconoEstado className={`w-7 h-7 ${cfg.color}`} />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-0.5">Estado actual</p>
              <p className={`text-xl font-bold ${cfg.color}`}>{cfg.label}</p>
              <p className="text-sm text-gray-600 mt-0.5">{cfg.descripcion}</p>
            </div>
          </div>

          {diasRestantes !== null && (
            <div className="mt-4 pt-4 border-t border-white/50 flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-500 flex-shrink-0" />
              {diasRestantes > 0 ? (
                <p className="text-sm text-gray-700">
                  Fecha prometida:{' '}
                  <span className="font-semibold">
                    {new Date(orden.fecha_prometida + 'T12:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'long' })}
                  </span>
                  {' '}({diasRestantes === 1 ? 'mañana' : `en ${diasRestantes} días`})
                </p>
              ) : diasRestantes === 0 ? (
                <p className="text-sm font-semibold text-green-700">¡Hoy es la fecha prometida de entrega!</p>
              ) : (
                <p className="text-sm text-gray-600">
                  Fecha estimada:{' '}
                  {new Date(orden.fecha_prometida + 'T12:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'long' })}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Barra de progreso */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-5">Progreso</h2>
          <div className="flex items-start justify-between">
            {pasos.map((paso, i) => {
              const completado = i + 1 <= cfg.paso
              const Icono = paso.icono
              return (
                <div key={paso.label} className="flex flex-col items-center gap-2 flex-1">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                    completado ? 'bg-blue-600' : 'bg-gray-100'
                  }`}>
                    <Icono className={`w-5 h-5 ${completado ? 'text-white' : 'text-gray-400'}`} />
                  </div>
                  <span className={`text-xs text-center leading-tight ${completado ? 'text-gray-900 font-semibold' : 'text-gray-400'}`}>
                    {paso.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Detalles */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Detalles de tu servicio</h2>
          <div className="space-y-2.5 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Vehículo</span>
              <span className="font-medium text-gray-900">
                {[orden.vehiculo_marca, orden.vehiculo_modelo, orden.vehiculo_año].filter(Boolean).join(' ')}
              </span>
            </div>
            {orden.placas && (
              <div className="flex justify-between">
                <span className="text-gray-400">Placas</span>
                <span className="font-mono font-semibold text-gray-900">{orden.placas}</span>
              </div>
            )}
            <div className="flex justify-between items-start gap-4">
              <span className="text-gray-400 flex-shrink-0">Motivo</span>
              <span className="font-medium text-gray-900 text-right">{orden.descripcion_problema}</span>
            </div>
            {orden.total > 0 && (
              <div className="flex justify-between pt-2 border-t border-gray-100">
                <span className="text-gray-400">Total</span>
                <span className="font-bold text-gray-900 text-base">
                  ${orden.total?.toLocaleString()} {orden.moneda ?? 'MXN'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Fotos de diagnóstico */}
        {fotosDiagnostico.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Fotos del diagnóstico</h2>
            <div className="space-y-3">
              {fotosDiagnostico.map((foto: any) => (
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

        {/* Fotos de recepción */}
        {fotosRecepcion.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-1">Estado del vehículo al ingreso</h2>
            <p className="text-xs text-gray-400 mb-3">Fotos tomadas al recibir tu vehículo en el taller.</p>
            <div className="grid grid-cols-2 gap-2">
              {fotosRecepcion.map((foto: any) => (
                <div key={foto.id}>
                  <img src={foto.url} alt={foto.descripcion} className="w-full h-32 rounded-xl object-cover" />
                  {foto.descripcion && (
                    <p className="text-xs text-gray-500 mt-1">{foto.descripcion}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Contacto */}
        {taller.telefono && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center">
            <p className="text-sm text-gray-500 mb-3">¿Tienes alguna pregunta?</p>
            <a
              href={`https://wa.me/${taller.telefono.replace(/\D/g, '')}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors"
            >
              <Phone className="w-4 h-4" />
              Contactar al taller por WhatsApp
            </a>
          </div>
        )}

        {/* Redes sociales */}
        {(taller.instagram || taller.facebook) && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center">
            <p className="text-sm text-gray-500 mb-3">Síguenos en redes sociales</p>
            <div className="flex justify-center gap-3">
              {taller.instagram && (
                <a
                  href={taller.instagram.startsWith('http') ? taller.instagram : `https://instagram.com/${taller.instagram.replace('@', '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-medium px-4 py-2.5 rounded-xl hover:opacity-90 transition-opacity"
                >
                  Instagram
                </a>
              )}
              {taller.facebook && (
                <a
                  href={taller.facebook.startsWith('http') ? taller.facebook : `https://facebook.com/${taller.facebook}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors"
                >
                  Facebook
                </a>
              )}
            </div>
          </div>
        )}

        {/* Mapa del taller */}
        {taller.direccion && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-4 pt-4 pb-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">📍 Ubicación del taller</p>
              <p className="text-sm text-gray-700 mt-1">{taller.direccion}</p>
            </div>
            <iframe
              title="Ubicación del taller"
              width="100%"
              height="200"
              style={{ border: 0 }}
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
              src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY}&q=${encodeURIComponent(taller.direccion)}&language=es`}
            />
            <div className="px-4 pb-4 pt-2">
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(taller.direccion)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-blue-600 font-semibold hover:underline"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
                Cómo llegar
              </a>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center py-2">
          <p className="text-xs text-gray-300">
            Seguimiento en tiempo real por{' '}
            <span className="font-semibold text-gray-400">TallerOS</span>
          </p>
        </div>

      </div>
    </div>
  )
}