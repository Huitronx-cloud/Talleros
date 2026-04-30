import { createClient } from '@/lib/supabase/server'
import { Orden } from '@/types'
import ListaOrdenes from '@/components/ordenes/lista-ordenes'

export default async function OrdenesPage() {
  const supabase = createClient()

  const { data: ordenes } = await supabase
    .from('ordenes')
    .select('*, clientes(nombre, telefono)')
    .order('created_at', { ascending: false })

  return <ListaOrdenes ordenes={(ordenes ?? []) as Orden[]} />
}
