import { createClient } from '@/lib/supabase/server'
import { Orden } from '@/types'
import ListaOrdenes from '@/components/ordenes/lista-ordenes'

export default async function OrdenesPage() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('rol, nombre')
    .eq('id', user!.id)
    .single()

  const esTecnico = usuario?.rol === 'tecnico'

  const query = supabase
    .from('ordenes')
    .select('*, clientes(nombre, telefono)')
    .order('created_at', { ascending: false })

  // Mecánico solo ve órdenes asignadas a su nombre
  if (esTecnico && usuario?.nombre) {
    query.eq('mecanico_asignado', usuario.nombre)
  }

  const { data: ordenes } = await query

  return <ListaOrdenes ordenes={(ordenes ?? []) as Orden[]} />
}