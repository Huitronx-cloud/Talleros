export const dynamic = 'force-dynamic'
import { createClient, getAuthUser, getTallerId } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import ClienteDetalle from './cliente-detalle'
import { Vehiculo } from '@/types'

export default async function ClienteDetallePage({ params }: { params: { id: string } }) {
  const supabase = createClient()

  const user = await getAuthUser()
  if (!user) redirect('/login')

  const tallerId = (await getTallerId()) ?? ''

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

  // Los archivados no se listan: quitar un vehículo lo archiva para no perder
  // el historial de sus órdenes, pero el usuario espera que desaparezca.
  const { data: vehiculos } = await supabase
    .from('vehiculos')
    .select('*')
    .eq('cliente_id', params.id)
    .eq('taller_id', tallerId)
    .eq('archivado', false)
    .order('created_at')

  const ordenesFinalizadas = (ordenes ?? []).filter(o => o.estado === 'entregado')

  return (
    <ClienteDetalle
      cliente={cliente}
      ordenes={ordenes ?? []}
      ordenesFinalizadas={ordenesFinalizadas}
      vehiculos={(vehiculos ?? []) as Vehiculo[]}
    />
  )
}