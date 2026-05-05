import { createClient } from '@/lib/supabase/server'
import { Orden, RolUsuario } from '@/types'
import ListaOrdenes from '@/components/ordenes/lista-ordenes'
import MisOrdenes from '@/components/ordenes/mis-ordenes'

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
    .order('fecha_prometida', { ascending: true })

  if (esTecnico && usuario?.nombre) {
    query.eq('mecanico_asignado', usuario.nombre)
    query.neq('estado', 'entregado')
  } else {
    query.order('created_at', { ascending: false })
  }

  const { data: ordenes } = await query

  if (esTecnico) {
    return (
      <MisOrdenes
        ordenes={(ordenes ?? []) as Orden[]}
        nombreTecnico={usuario?.nombre ?? ''}
      />
    )
  }

  return <ListaOrdenes ordenes={(ordenes ?? []) as Orden[]} />
}