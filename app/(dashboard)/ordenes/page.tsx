import { createClient } from '@/lib/supabase/server'
import { Orden, RolUsuario } from '@/types'
import ListaOrdenes from '@/components/ordenes/lista-ordenes'
import MisOrdenes from '@/components/ordenes/mis-ordenes'
import AgendaRecepcion from '@/components/recepcion/agenda-recepcion'
import { getLimites, puedeCrear } from '@/lib/plan-limits'
import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'

export default async function OrdenesPage({
  searchParams,
}: {
  searchParams: { limite?: string }
}) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('rol, nombre, taller_id')
    .eq('id', user!.id)
    .single()

  const esTecnico   = usuario?.rol === 'tecnico'
  const esRecepcion = usuario?.rol === 'recepcion'
  const tallerId    = usuario?.taller_id ?? ''
  const mesActual   = new Date().toISOString().slice(0, 7)

  // Obtener plan y uso
  const [{ data: suscripcion }, { count: ordenesEsteMes }] = await Promise.all([
    supabase.from('suscripciones').select('plan').eq('taller_id', tallerId).single(),
    supabase.from('ordenes').select('*', { count: 'exact', head: true })
      .eq('taller_id', tallerId)
      .gte('created_at', `${mesActual}-01`)
      .lt('created_at', `${mesActual}-31`),
  ])

  const plan    = suscripcion?.plan ?? 'trial'
  const limites = getLimites(plan)
  const totalOrdenesMes = ordenesEsteMes ?? 0
  const limiteSuperado  = !puedeCrear(totalOrdenesMes, limites.ordenes_mes)
  const mostrarLimite   = searchParams.limite === 'ordenes' || limiteSuperado

  // Banner de límite
  const BannerLimite = mostrarLimite ? (
    <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
      <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
      <div className="flex-1">
        <p className="text-sm font-semibold text-red-800">
          Límite de órdenes alcanzado
        </p>
        <p className="text-sm text-red-600 mt-0.5">
          Has usado <strong>{totalOrdenesMes}</strong> de <strong>{limites.ordenes_mes}</strong> órdenes este mes en tu plan <strong className="capitalize">{plan}</strong>.
          Actualiza tu plan para crear órdenes ilimitadas.
        </p>
      </div>
      <Link
        href="/configuracion/plan"
        className="shrink-0 bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors"
      >
        Ver planes
      </Link>
    </div>
  ) : limites.ordenes_mes !== -1 ? (
    <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700 flex items-center justify-between">
      <span>
        Has creado <strong>{totalOrdenesMes}</strong> de <strong>{limites.ordenes_mes}</strong> órdenes este mes en tu plan <strong className="capitalize">{plan}</strong>.
      </span>
      <Link href="/configuracion/plan" className="underline font-semibold ml-4 shrink-0">
        Actualizar plan
      </Link>
    </div>
  ) : null

  // Recepcionista
  if (esRecepcion) {
    const hoy = new Date().toISOString().split('T')[0]
    const [{ data: citasHoy }, { data: ordenesListas }, { data: ordenesHoy }] = await Promise.all([
      supabase.from('citas').select('*, clientes(nombre, telefono)').eq('fecha', hoy).order('hora', { ascending: true }),
      supabase.from('ordenes').select('*, clientes(nombre, telefono)').eq('estado', 'listo').eq('cobrado', false).order('created_at', { ascending: false }),
      supabase.from('ordenes').select('*, clientes(nombre, telefono)').gte('created_at', hoy + 'T00:00:00').order('created_at', { ascending: false }),
    ])
    return (
      <div>
        {BannerLimite}
        <AgendaRecepcion
          citasHoy={(citasHoy ?? []) as any[]}
          ordenesListas={(ordenesListas ?? []) as Orden[]}
          ordenesHoy={(ordenesHoy ?? []) as Orden[]}
          nombreRecepcionista={usuario?.nombre ?? ''}
        />
      </div>
    )
  }

  // Técnico
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
      <div>
        {BannerLimite}
        <MisOrdenes
          ordenes={(ordenes ?? []) as Orden[]}
          nombreTecnico={usuario?.nombre ?? ''}
        />
      </div>
    )
  }

  return (
    <div>
      {BannerLimite}
      <ListaOrdenes ordenes={(ordenes ?? []) as Orden[]} />
    </div>
  )
}