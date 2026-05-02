import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import FormCitaPublica from '@/components/citas/form-cita-publica'

export default async function CitaPublicaPage({ params }: { params: { tallerId: string } }) {
  const supabase = createClient()

  const { data: taller } = await supabase
    .from('talleres')
    .select('id, nombre, logo_url, ciudad, pais')
    .eq('id', params.tallerId)
    .single()

  if (!taller) notFound()

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          {taller.logo_url ? (
            <img src={taller.logo_url} alt={taller.nombre} className="h-12 object-contain mx-auto mb-3" />
          ) : (
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-3">
              <span className="text-white font-bold text-lg">{taller.nombre.charAt(0)}</span>
            </div>
          )}
          <h1 className="text-2xl font-bold text-gray-900">{taller.nombre}</h1>
          <p className="text-gray-500 text-sm mt-1">Agenda tu cita en línea</p>
        </div>
        <FormCitaPublica tallerId={taller.id} tallerNombre={taller.nombre} />
      </div>
    </div>
  )
}