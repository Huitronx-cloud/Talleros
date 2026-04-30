import { createClient } from '@/lib/supabase/server'
import { Cliente } from '@/types'
import TablaClientes from '@/components/clientes/tabla-clientes'

export default async function ClientesPage() {
  const supabase = createClient()

  // El RLS filtra automáticamente por taller_id — no hace falta filtrarlo aquí
  const { data: clientes } = await supabase
    .from('clientes')
    .select('*')
    .order('created_at', { ascending: false })

  return <TablaClientes clientes={(clientes ?? []) as Cliente[]} />
}
