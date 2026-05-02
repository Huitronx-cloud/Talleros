import { createClient } from '@/lib/supabase/server'
import { Orden } from '@/types'
import TableroKanban from '@/components/kanban/tablero-kanban'

export default async function KanbanPage() {
  const supabase = createClient()

  const { data: ordenes } = await supabase
    .from('ordenes')
    .select('*, clientes(nombre, telefono)')
    .neq('estado', 'entregado')
    .order('created_at', { ascending: true })

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tablero Kanban</h1>
          <p className="text-gray-500 text-sm mt-1">
            Vista en tiempo real de todos los vehículos en el taller.
          </p>
        </div>
      </div>
      <TableroKanban ordenes={(ordenes ?? []) as Orden[]} />
    </div>
  )
}