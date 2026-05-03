import { createClient } from '@/lib/supabase/server'
import CalendarioCitas from '@/components/citas/calendario-citas'
import CopiarlinkCitas from '@/components/citas/copiar-link-citas'

export default async function CitasPage() {
  const supabase = createClient()

  const { data: taller } = await supabase
    .from('talleres')
    .select('id, nombre')
    .single()

  const { data: citas } = await supabase
    .from('citas')
    .select('*')
    .order('fecha', { ascending: true })
    .order('hora', { ascending: true })

  const linkPublico = `${process.env.NEXT_PUBLIC_APP_URL}/citas/${taller?.id}`

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Citas</h1>
          <p className="text-gray-500 text-sm mt-1">
            Agenda y gestiona las citas de tu taller.
          </p>
        </div>
        {taller && <CopiarlinkCitas link={linkPublico} />}
      </div>
      <CalendarioCitas citas={citas ?? []} tallerId={taller?.id ?? ''} />
    </div>
  )
}