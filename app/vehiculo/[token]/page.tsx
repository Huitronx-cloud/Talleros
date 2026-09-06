import { createClient as createAnonClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import { Car, Wrench, Phone, MapPin } from 'lucide-react'

// Un enlace que no caduca y que el dueño puede pasarle al que le compre el
// coche no tiene ningún motivo para estar en Google.
export const metadata = {
  robots: { index: false, follow: false },
}

// Como el portal: sin esto Next.js cachea la primera visita a cada token y el
// coche se queda congelado con las visitas que tenía ese día. En una libreta
// de servicio eso es justo lo contrario de lo que sirve.
export const dynamic = 'force-dynamic'
export const revalidate = 0

/** El coche como se le nombra: "2020 Toyota Corolla". */
function titulo(v: any): string {
  const partes = [v?.anio, v?.marca, v?.modelo]
    .map((p: any) => String(p ?? '').trim())
    .filter((p: string) => p !== '' && p !== '0')
  return partes.length > 0 ? partes.join(' ') : 'Vehículo'
}

/**
 * La libreta de servicio del coche.
 *
 * El portal del cliente apunta a UNA orden y dura 7 días. Esto apunta al COCHE
 * y no caduca: es lo que el dueño guarda y enseña cuando lo vende.
 *
 * Por eso lleva MENOS cosas que el portal, no más. No sale el nombre del dueño
 * —si el coche cambia de manos, el comprador no se lleva de regalo quién era
 * el anterior— ni el VIN, que es el documento de identidad del coche. Eso se
 * decide en la función `get_historial_vehiculo`, que sencillamente no los
 * devuelve: aquí no hay nada que filtrar porque nunca llegan.
 */
export default async function HistorialVehiculoPage({
  params,
}: {
  params: { token: string }
}) {
  const supabase = createAnonClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data, error } = await supabase
    .rpc('get_historial_vehiculo', { p_token: params.token })

  // Se mira el error además de los datos. Al portal le costó semanas de 404 en
  // todos los enlaces que nadie lo hiciera: un fallo de la consulta y un token
  // inventado acababan igual, y desde fuera parecía que los enlaces estaban
  // mal cuando lo que estaba mal era la base.
  if (error) {
    console.error('[vehiculo] get_historial_vehiculo falló:', error.message, '· token:', params.token)
    notFound()
  }

  if (!data) notFound()

  const vehiculo = (data as any).vehiculo ?? {}
  const taller   = (data as any).taller   ?? {}
  const visitas  = ((data as any).visitas ?? []) as any[]

  const kmMasAlto = visitas.reduce(
    (max: number, v: any) => Math.max(max, Number(v.kilometraje) || 0),
    0,
  )

  // "Desde 2024" y no "hace 2 años": una fecha se comprueba de un vistazo, un
  // cálculo hay que creérselo.
  const primeraVisita = visitas.length > 0 ? visitas[visitas.length - 1].fecha : null

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto px-4 py-8 space-y-4">

        {/* El coche, que es de quien va esta página */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-3">
            <Car className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">{titulo(vehiculo)}</h1>
          {vehiculo.placas && (
            <p className="text-sm text-gray-500 mt-1">{vehiculo.placas}</p>
          )}
          <p className="text-xs text-gray-400 mt-3 leading-relaxed">
            Historial de mantenimiento registrado por el taller.
          </p>
        </div>

        {/* Resumen */}
        {visitas.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-xl font-bold text-gray-900">{visitas.length}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {visitas.length === 1 ? 'visita' : 'visitas'}
                </p>
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">
                  {kmMasAlto > 0 ? kmMasAlto.toLocaleString() : '—'}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">km registrados</p>
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">
                  {primeraVisita ? new Date(primeraVisita + 'T12:00:00').getFullYear() : '—'}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">desde</p>
              </div>
            </div>
          </div>
        )}

        {/* Las visitas */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-1">
            Todo lo que se le ha hecho a este vehículo
          </h2>
          <p className="text-xs text-gray-400 mb-4">
            En {taller.nombre ?? 'el taller'}
          </p>

          {visitas.length === 0 ? (
            <p className="text-sm text-gray-400 leading-relaxed">
              Todavía no hay visitas terminadas que mostrar. En cuanto el taller
              entregue el vehículo, el trabajo aparecerá aquí.
            </p>
          ) : (
            <div className="space-y-3">
              {visitas.map((v: any) => {
                const servicios = Array.isArray(v.servicios)
                  ? v.servicios.map((s: any) => s?.descripcion).filter(Boolean)
                  : []
                return (
                  <div key={v.id} className="border border-gray-100 rounded-xl p-3">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-sm font-semibold text-gray-900">
                        {v.fecha
                          ? new Date(v.fecha + 'T12:00:00').toLocaleDateString('es-MX', {
                              day: 'numeric', month: 'long', year: 'numeric',
                            })
                          : 'Sin fecha'}
                      </span>
                      {v.total > 0 && (
                        <span className="text-sm font-bold text-gray-900 shrink-0">
                          ${Number(v.total).toLocaleString()}
                        </span>
                      )}
                    </div>
                    {v.kilometraje > 0 && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        {Number(v.kilometraje).toLocaleString()} km
                      </p>
                    )}
                    {servicios.length > 0 && (
                      <p className="text-sm text-gray-600 mt-1.5 leading-relaxed">
                        {servicios.join(' · ')}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* El taller */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center">
          {taller.logo_url ? (
            <img src={taller.logo_url} alt={taller.nombre} className="h-10 object-contain mx-auto mb-3" />
          ) : (
            <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Wrench className="w-5 h-5 text-gray-500" />
            </div>
          )}
          <p className="text-sm font-semibold text-gray-700">{taller.nombre}</p>
          {taller.direccion && (
            <p className="text-xs text-gray-400 mt-1 flex items-center justify-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              {taller.direccion}
            </p>
          )}
          {taller.telefono && (
            <a
              href={`https://wa.me/${taller.telefono.replace(/\D/g, '')}`}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors"
            >
              <Phone className="w-4 h-4" />
              Escribir al taller
            </a>
          )}
        </div>

        {/* Footer */}
        <div className="text-center py-2">
          <p className="text-xs text-gray-300">
            Historial de servicio por{' '}
            <span className="font-semibold text-gray-400">TallerOS</span>
          </p>
        </div>

      </div>
    </div>
  )
}
