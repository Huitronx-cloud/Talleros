import { createClient } from '@/lib/supabase/server'
import CalendarioCitas from '@/components/citas/calendario-citas'
import CopiarlinkCitas from '@/components/citas/copiar-link-citas'
import ConfigCitas from '@/components/citas/ConfigCitas'

export default async function CitasPage() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: usuario } = await supabase
    .from('usuarios')
    .select('taller_id')
    .eq('id', user?.id ?? '')
    .maybeSingle()

  const tallerId = usuario?.taller_id ?? ''

  const [
    { data: taller },
    { data: citas },
    { data: citasConfig },
  ] = await Promise.all([
    supabase.from('talleres').select('id, nombre').eq('id', tallerId).maybeSingle(),
    supabase.from('citas').select('*').eq('taller_id', tallerId).order('fecha', { ascending: true }).order('hora', { ascending: true }),
    supabase.from('citas_config').select('*').eq('taller_id', tallerId).maybeSingle(),
  ])

  const linkPublico = `${process.env.NEXT_PUBLIC_APP_URL}/citas/${taller?.id}`

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Citas</h1>
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