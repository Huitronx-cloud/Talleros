export const dynamic = 'force-dynamic'
import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import ClienteDetalle from './cliente-detalle'

export default async function ClienteDetallePage({ params }: { params: { id: string } }) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('taller_id')
    .eq('id', user.id)
    .single()

  const tallerId = usuario?.taller_id ?? ''

  const { data: cliente } = await supabase
    .from('clientes')
    .select('*')
    .eq('id', params.id)
    .eq('taller_id', tallerId)
    .single()

  if (!cliente) notFound()

  const { data: ordenes } = await supabase
    .from('ordenes')
    .select('id, numero_orden, estado, fecha_entrada, fecha_entrega, total, servicios_realizados, mecanico_asignado, vehiculo_marca, vehiculo_modelo, placas, kilometraje, descripcion_problema, diagnostico')
    .eq('cliente_id', params.id)
    .eq('taller_id', tallerId)
    .order('created_at', { ascending: false })

  const ordenesFinalizadas = (ordenes ?? []).filter(o => o.estado === 'entregado')

  return (
    <ClienteDetalle
      cliente={cliente}
      ordenes={ordenes ?? []}
      ordenesFinalizadas={ordenesFinalizadas}
    />
  )
}