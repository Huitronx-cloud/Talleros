import { createClient as createAnonClient } from '@supabase/supabase-js'
import FormCitaPublica from '@/components/citas/form-cita-publica'
import { notFound } from 'next/navigation'

export default async function CitaPublicaPage({
  params,
}: {
  params: { tallerId: string }
}) {
  const supabase = createAnonClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data: taller } = await supabase
    .from('talleres')
    .select('id, nombre, logo_url, direccion, telefono')
    .eq('id', params.tallerId)
    .single()

  if (!taller) notFound()

  // Citas de los próximos 30 días para mostrar disponibilidad
  const hoy     = new Date().toISOString().split('T')[0]
  const en30dias = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const [
    { data: citasOcupadas },
    { data: citasConfig },
  ] = await Promise.all([
    supabase.from('citas').select('fecha, hora')
      .eq('taller_id', params.tallerId)
      .gte('fecha', hoy)
      .lte('fecha', en30dias)
      .neq('estado', 'cancelada'),
    supabase.from('citas_config').select('*')
      .eq('taller_id', params.tallerId)
      .single(),
  ])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">

      {/* Header del taller */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-5 flex items-center gap-4">
          {taller.logo_url ? (
            <img
              src={taller.logo_url}
              alt={taller.nombre}
              className="w-12 h-12 rounded-xl object-contain border border-gray-200"
            />
          ) : (
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xl font-bold">
                {taller.nombre.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div>
            <h1 className="text-lg font-bold text-gray-900">{taller.nombre}</h1>
            <p className="text-sm text-gray-500">Agenda tu cita en línea</p>
          </div>
        </div>
      </div>

      {/* Formulario */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        <FormCitaPublica
          tallerId={taller.id}
          tallerNombre={taller.nombre}
          citasOcupadas={(citasOcupadas ?? []) as { fecha: string; hora: string }[]}
          citasConfig={citasConfig ?? null}
        />
      </div>

      {/* Footer */}
      <div className="text-center pb-8">
        <p className="text-xs text-gray-400">Powered by <span className="font-semibold">TallerOS</span></p>
      </div>
    </div>
  )
}