export const dynamic = 'force-dynamic'
import { createClient, getTallerId } from '@/lib/supabase/server'
import CalendarioCitas from '@/components/citas/calendario-citas'
import CopiarlinkCitas from '@/components/citas/copiar-link-citas'
import ConfigCitas from '@/components/citas/ConfigCitas'
import ModalNuevaCita from '@/components/citas/modal-nueva-cita'
import { Cliente } from '@/types'

export default async function CitasPage() {
  const supabase = createClient()

  const tallerId = (await getTallerId()) ?? ''

  const [
    { data: taller },
    { data: citas },
    { data: citasConfig },
    { data: clientes },
  ] = await Promise.all([
    supabase.from('talleres').select('id, nombre, pais').eq('id', tallerId).maybeSingle(),
    supabase.from('citas').select('*').eq('taller_id', tallerId).order('fecha', { ascending: true }).order('hora', { ascending: true }),
    supabase.from('citas_config').select('*').eq('taller_id', tallerId).maybeSingle(),
    // Para poder agendar a alguien que ya está en la libreta sin volver a
    // teclear su teléfono y su coche.
    supabase.from('clientes').select('*').order('nombre'),
  ])

  const linkPublico = `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://tallerosapp.com'}/citas/${taller?.id}`

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Citas</h1>
          <p className="text-gray-500 text-sm mt-1">
            Agenda y gestiona las citas de tu taller.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {taller && <CopiarlinkCitas link={linkPublico} />}
          {taller && (
            <ModalNuevaCita
              tallerId={taller.id}
              clientes={(clientes ?? []) as Cliente[]}
              pais={(taller as { pais?: string | null }).pais ?? null}
            />
          )}
        </div>
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