export const dynamic = 'force-dynamic'
import { createClient, getAuthUser } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Orden } from '@/types'
import TableroKanban from '@/components/kanban/tablero-kanban'

export default async function KanbanPage() {
  const supabase = createClient()

  const user = await getAuthUser()
  if (!user) redirect('/login')

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('taller_id')
    .eq('id', user.id)
    .single()

  const { data: ordenes } = await supabase
    .from('ordenes')
    .select('*, clientes(nombre, telefono, foto_vehiculo_url)')
    .eq('taller_id', usuario?.taller_id ?? '')
    .neq('estado', 'entregado')
    .order('created_at', { ascending: true })

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tablero de trabajo</h1>
          <p className="text-gray-500 text-sm mt-1">
            Ve en tiempo real el estado de todos los vehículos en el taller.
          </p>
        </div>
      </div>
      <TableroKanban ordenes={(ordenes ?? []) as Orden[]} />
    </div>
  )
}