import { createClient } from '@/lib/supabase/server'
import CalendarioCitas from '@/components/citas/calendario-citas'

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

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Citas</h1>
          <p className="text-gray-500 text-sm mt-1">
            Agenda y gestiona las citas de tu taller.
          </p>
        </div>
        {taller && (
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs text-gray-400">Link público de citas</p>
              <p className="text-xs font-mono text-blue-600 truncate max-w-xs">
                {process.env.NEXT_PUBLIC_APP_URL}/citas/{taller.id}
              </p>
            </div>
            <button
              onClick={() => navigator.clipboard.writeText(`${process.env.NEXT_PUBLIC_APP_URL}/citas/${taller.id}`)}
              className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg"
            >
              Copiar link
            </button>
          </div>
        )}
      </div>
      <CalendarioCitas citas={citas ?? []} tallerId={taller?.id ?? ''} />
    </div>
  )
}