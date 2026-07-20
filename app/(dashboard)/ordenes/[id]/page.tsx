export const dynamic = 'force-dynamic'
import { createClient, getAuthUser } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Orden, Notificacion, RolUsuario } from '@/types'
import DetalleOrden from '@/components/ordenes/detalle-orden'
import FlujoTecnico from '@/components/ordenes/flujo-tecnico'

export default async function DetalleOrdenPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = createClient()

  const user = await getAuthUser()

  const [{ data: orden }, { data: notificaciones }, { data: usuario }] = await Promise.all([
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
    supabase
      .from('usuarios')
      .select('rol, nombre')
      .eq('id', user!.id)
      .single(),
  ])

  if (!orden) notFound()

  const esTecnico = usuario?.rol === 'tecnico'

  if (esTecnico) {
    return (
      <FlujoTecnico
        orden={orden as Orden}
        nombreTecnico={usuario?.nombre ?? ''}
      />
    )
  }

  return (
    <DetalleOrden
      orden={orden as Orden}
      notificaciones={(notificaciones ?? []) as Notificacion[]}
      rol={usuario?.rol as RolUsuario | undefined}
    />
  )
}