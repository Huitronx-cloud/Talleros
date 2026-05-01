import { createClient } from '@/lib/supabase/server'
import { Cliente } from '@/types'
import TablaClientes from '@/components/clientes/tabla-clientes'

export default async function ClientesPage() {
  const supabase = createClient()

  const { data: clientes } = await supabase
    .from('clientes')
    .select('*')
    .order('created_at', { ascending: false })

  // Obtener stats de órdenes por cliente
  const { data: ordenesStats } = await supabase
    .from('ordenes')
    .select('cliente_id, total, estado, created_at')
    .not('cliente_id', 'is', null)

  // Calcular valor de vida por cliente
  const statsMap: Record<string, { totalGastado: number; visitas: number; ultimaVisita: string | null }> = {}

  ordenesStats?.forEach(o => {
    if (!o.cliente_id) return
    if (!statsMap[o.cliente_id]) {
      statsMap[o.cliente_id] = { totalGastado: 0, visitas: 0, ultimaVisita: null }
    }
    statsMap[o.cliente_id].visitas += 1
    if (o.estado === 'entregado') {
      statsMap[o.cliente_id].totalGastado += o.total || 0
    }
    if (!statsMap[o.cliente_id].ultimaVisita || o.created_at > statsMap[o.cliente_id].ultimaVisita!) {
      statsMap[o.cliente_id].ultimaVisita = o.created_at
    }
  })

  return (
    <TablaClientes
      clientes={(clientes ?? []) as Cliente[]}
      statsMap={statsMap}
    />
  )
}