import { createClient } from '@/lib/supabase/server'
import { Orden, RolUsuario } from '@/types'
import ListaOrdenes from '@/components/ordenes/lista-ordenes'
import MisOrdenes from '@/components/ordenes/mis-ordenes'
import AgendaRecepcion from '@/components/recepcion/agenda-recepcion'

export default async function OrdenesPage() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('rol, nombre')
    .eq('id', user!.id)
    .single()

  const esTecnico    = usuario?.rol === 'tecnico'
  const esRecepcion  = usuario?.rol === 'recepcion'

  // Recepcionista — agenda del día
  if (esRecepcion) {
    const hoy   = new Date().toISOString().split('T')[0]

    const [{ data: citasHoy }, { data: ordenesListas }, { data: ordenesHoy }] = await Promise.all([
      supabase
        .from('citas')
        .select('*, clientes(nombre, telefono)')
        .eq('fecha', hoy)
        .order('hora', { ascending: true }),
      supabase
        .from('ordenes')
        .select('*, clientes(nombre, telefono)')
        .eq('estado', 'listo')
        .eq('cobrado', false)
        .order('created_at', { ascending: false }),
      supabase
        .from('ordenes')
        .select('*, clientes(nombre, telefono)')
        .gte('created_at', hoy + 'T00:00:00')
        .order('created_at', { ascending: false }),
    ])

    return (
      <AgendaRecepcion
        citasHoy={(citasHoy ?? []) as any[]}
        ordenesListas={(ordenesListas ?? []) as Orden[]}
        ordenesHoy={(ordenesHoy ?? []) as Orden[]}
        nombreRecepcionista={usuario?.nombre ?? ''}
      />
    )
  }

  // Técnico — mis órdenes
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