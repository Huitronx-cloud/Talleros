export const dynamic = 'force-dynamic'
import { createClient, getAuthUser } from '@/lib/supabase/server'
import { Orden, RolUsuario } from '@/types'
import ListaOrdenes from '@/components/ordenes/lista-ordenes'
import MisOrdenes from '@/components/ordenes/mis-ordenes'
import AgendaRecepcion from '@/components/recepcion/agenda-recepcion'
import { getLimites, puedeCrear } from '@/lib/plan-limits'
import { fechaHoyDelTaller, rangoDelMes } from '@/lib/fechas'
import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'

export default async function OrdenesPage({
  searchParams,
}: {
  searchParams: { limite?: string }
}) {
  const supabase = createClient()

  const user = await getAuthUser()

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('rol, nombre, taller_id, talleres(pais)')
    .eq('id', user!.id)
    .single()

  const esTecnico   = usuario?.rol === 'tecnico'
  const esRecepcion = usuario?.rol === 'recepcion'
  const tallerId    = usuario?.taller_id ?? ''
  const paisTaller  = ((Array.isArray(usuario?.talleres) ? usuario?.talleres[0] : usuario?.talleres) as { pais: string | null } | null)?.pais ?? null

  // El mes del TALLER, no el de UTC: en el servidor `new Date()` va en UTC, y
  // el 30 a las 18:30 en México ya sería el mes siguiente. Ver lib/fechas.ts.
  const { inicio: inicioMes, fin: finMes } = rangoDelMes(fechaHoyDelTaller(paisTaller))

  // Obtener plan y uso
  const [{ data: suscripcion }, { count: ordenesEsteMes }] = await Promise.all([
    supabase.from('suscripciones').select('plan, trial_fin').eq('taller_id', tallerId).single(),
    // La orden de muestra se lista, pero no cuenta contra el tope del plan.
    // La cota de arriba era `${mes}-31`, y "2026-09-31" no es una fecha:
    // Postgres rechazaba la consulta entera, el contador caía a 0, y el tope
    // de órdenes del plan no se aplicaba en los meses de 30 días ni en
    // febrero. Ahora es el día 1 del mes siguiente, exclusivo.
    supabase.from('ordenes').select('*', { count: 'exact', head: true })
      .eq('taller_id', tallerId)
      .eq('es_ejemplo', false)
      .gte('created_at', inicioMes)
      .lt('created_at', finMes),
  ])

  const plan    = suscripcion?.plan ?? 'trial'
  const limites = getLimites(plan, suscripcion?.trial_fin)
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
    // El "hoy" del taller. En UTC, a partir de las 18:00 en México la
    // recepcionista veía las citas de MAÑANA y ninguna de las órdenes de hoy.
    const hoy = fechaHoyDelTaller(paisTaller)
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