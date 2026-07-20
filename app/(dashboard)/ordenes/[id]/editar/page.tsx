export const dynamic = 'force-dynamic'
import { createClient, getAuthUser } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { notFound, redirect } from 'next/navigation'
import { Orden } from '@/types'
import FormEditarOrden from '@/components/ordenes/form-editar-orden'

export default async function EditarOrdenPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const admin    = createServiceClient()
  const user     = await getAuthUser()

  const [{ data: orden }, { data: usuario }] = await Promise.all([
    supabase.from('ordenes').select('*').eq('id', params.id).single(),
    supabase.from('usuarios').select('taller_id, rol').eq('id', user!.id).single(),
  ])

  if (!orden) notFound()

  // Editar precios/órdenes es una acción sensible: solo propietario y admin.
  if (usuario?.rol !== 'propietario' && usuario?.rol !== 'admin') {
    redirect(`/ordenes/${params.id}`)
  }

  const tallerId = usuario?.taller_id ?? ''

  const [{ data: taller }, { data: mecanicos }] = await Promise.all([
    supabase.from('talleres').select('pais, moneda').eq('id', tallerId).single(),
    admin.from('usuarios').select('id, nombre').eq('taller_id', tallerId).eq('rol', 'tecnico').order('nombre'),
  ])

  return (
    <FormEditarOrden
      orden={orden as Orden}
      pais={taller?.pais ?? 'México'}
      moneda={taller?.moneda ?? 'MXN'}
      mecanicos={mecanicos ?? []}
    />
  )
}
