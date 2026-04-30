import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Orden, Notificacion } from '@/types'
import DetalleOrden from '@/components/ordenes/detalle-orden'

export default async function DetalleOrdenPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = createClient()

  const [{ data: orden }, { data: notificaciones }] = await Promise.all([
    supabase
      .from('ordenes')
      .select('*, clientes(nombre, telefono)')
      .eq('id', params.id)
      .single(),
    supabase
      .from('notificaciones')
      .select('*')
      .eq('orden_id', params.id)
      .order('created_at', { ascending: false }),
  ])

  if (!orden) notFound()

  return (
    <DetalleOrden
      orden={orden as Orden}
      notificaciones={(notificaciones ?? []) as Notificacion[]}
    />
  )
}
