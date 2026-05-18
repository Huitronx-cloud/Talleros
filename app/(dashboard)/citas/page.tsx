import { createClient } from '@/lib/supabase/server'
import CalendarioCitas from '@/components/citas/calendario-citas'
import CopiarlinkCitas from '@/components/citas/copiar-link-citas'
import ConfigCitas from '@/components/citas/ConfigCitas'

export default async function CitasPage() {
  const supabase = createClient()

  const [
    { data: taller },
    { data: citas },
    { data: citasConfig },
  ] = await Promise.all([
    supabase.from('talleres').select('id, nombre').single(),
    supabase.from('citas').select('*').order('fecha', { ascending: true }).order('hora', { ascending: true }),
    supabase.from('citas_config').select('*').single(),
  ])

  const linkPublico = `${process.env.NEXT_PUBLIC_APP_URL}/citas/${taller?.id}`

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Citas</h1>
          <p className="text-gray-500 text-sm mt-1">
            Agenda y gestiona las citas de tu taller.
          </p>
        </div>
        {taller && <CopiarlinkCitas link={linkPublico} />}
      </div>

      <CalendarioCitas citas={citas ?? []} tallerId={taller?.id ?? ''} />

      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-4">Configuración de citas</h2>
        <ConfigCitas
          tallerId={taller?.id ?? ''}
          configInicial={citasConfig ?? null}
        />
      </div>
    </div>
  )
}