import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { Cliente } from '@/types'
import FormNuevaOrden from '@/components/ordenes/form-nueva-orden'
import FormRapidoOrden from '@/components/recepcion/form-rapido-orden'
import { getLimites, puedeCrear } from '@/lib/plan-limits'
import { redirect } from 'next/navigation'

export default async function NuevaOrdenPage() {
  const supabase = createClient()
  const admin    = createServiceClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('taller_id, rol')
    .eq('id', user!.id)
    .single()

  const tallerId    = usuario?.taller_id ?? ''
  const esRecepcion = usuario?.rol === 'recepcion'
  console.log('tallerId:', tallerId)

  const mesActual = new Date().toISOString().slice(0, 7)

  const [
    { data: clientes },
    { data: taller },
    { data: suscripcion },
    { data: usoMes },
    { count: ordenesEsteMes },
  ] = await Promise.all([
    supabase.from('clientes').select('*').order('nombre'),
    supabase.from('talleres').select('pais, moneda, nombre').eq('id', tallerId).single(),
    supabase.from('suscripciones').select('plan').eq('taller_id', tallerId).single(),
    supabase.from('uso_mensual').select('ordenes').eq('taller_id', tallerId).eq('mes', mesActual).single(),
    supabase.from('ordenes').select('*', { count: 'exact', head: true })
      .eq('taller_id', tallerId)
      .gte('created_at', `${mesActual}-01`)
      .lt('created_at', `${mesActual}-31`),
  ])

  // Usar service client para bypassar RLS y obtener todos los mecánicos del taller
  const { data: mecanicos } = await admin
    .from('usuarios')
    .select('id, nombre')
    .eq('taller_id', tallerId)
    .eq('rol', 'tecnico')
    .order('nombre')
    console.log('mecanicos:', mecanicos)

  const plan            = suscripcion?.plan ?? 'trial'
  const limites         = getLimites(plan)
  const totalOrdenesMes = ordenesEsteMes ?? 0

  if (!puedeCrear(totalOrdenesMes, limites.ordenes_mes)) {
    redirect('/ordenes?limite=ordenes')
  }

  if (esRecepcion) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Nueva orden rápida</h1>
        {limites.ordenes_mes !== -1 && (
          <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700">
            Has creado <strong>{totalOrdenesMes}</strong> de <strong>{limites.ordenes_mes}</strong> órdenes este mes en tu plan <strong className="capitalize">{plan}</strong>.
          </div>
        )}
        <FormRapidoOrden
          clientes={(clientes ?? []) as Cliente[]}
          tallerId={tallerId}
          pais={taller?.pais ?? 'México'}
          moneda={taller?.moneda ?? 'MXN'}
          mecanicos={mecanicos ?? []}
        />
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Nueva orden de trabajo</h1>
      {limites.ordenes_mes !== -1 && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700">
          Has creado <strong>{totalOrdenesMes}</strong> de <strong>{limites.ordenes_mes}</strong> órdenes este mes en tu plan <strong className="capitalize">{plan}</strong>.{' '}
          <a href="/configuracion/plan" className="underline font-semibold">Actualizar plan</a>
        </div>
      )}
      <FormNuevaOrden
        clientes={(clientes ?? []) as Cliente[]}
        tallerId={tallerId}
        pais={taller?.pais ?? 'México'}
        moneda={taller?.moneda ?? 'MXN'}
        mecanicos={mecanicos ?? []}
      />
    </div>
  )
}