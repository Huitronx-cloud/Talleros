import { createClient } from '@/lib/supabase/server'
import { Cliente } from '@/types'
import TablaClientes from '@/components/clientes/tabla-clientes'
import { getLimites, puedeCrear } from '@/lib/plan-limits'
import Link from 'next/link'
import { Users } from 'lucide-react'

export default async function ClientesPage() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('taller_id')
    .eq('id', user!.id)
    .single()

  const tallerId = usuario?.taller_id ?? ''

  const [
    { data: clientes },
    { data: ordenesStats },
    { data: suscripcion },
  ] = await Promise.all([
    supabase.from('clientes').select('*').order('created_at', { ascending: false }),
    supabase.from('ordenes').select('cliente_id, total, estado, created_at').not('cliente_id', 'is', null),
    supabase.from('suscripciones').select('plan').eq('taller_id', tallerId).single(),
  ])

  const plan          = suscripcion?.plan ?? 'trial'
  const limites       = getLimites(plan)
  const totalClientes = clientes?.length ?? 0
  const puedeAgregar  = puedeCrear(totalClientes, limites.clientes)
  const cercaLimite   = limites.clientes !== -1 && totalClientes >= limites.clientes * 0.8

  // Calcular valor de vida por cliente
  const statsMap: Record<string, { totalGastado: number; visitas: number; ultimaVisita: string | null }> = {}
  ordenesStats?.forEach(o => {
    if (!o.cliente_id) return
    if (!statsMap[o.cliente_id]) statsMap[o.cliente_id] = { totalGastado: 0, visitas: 0, ultimaVisita: null }
    statsMap[o.cliente_id].visitas += 1
    if (o.estado === 'entregado') statsMap[o.cliente_id].totalGastado += o.total || 0
    if (!statsMap[o.cliente_id].ultimaVisita || o.created_at > statsMap[o.cliente_id].ultimaVisita!) {
      statsMap[o.cliente_id].ultimaVisita = o.created_at
    }
  })

  return (
    <div>
      {/* Banner límite de clientes */}
      {limites.clientes !== -1 && (!puedeAgregar || cercaLimite) && (
        <div className={`mb-6 rounded-xl p-4 flex items-center justify-between gap-4 flex-wrap ${
          !puedeAgregar
            ? 'bg-red-50 border border-red-200'
            : 'bg-amber-50 border border-amber-200'
        }`}>
          <div className="flex items-center gap-3">
            <Users className={`w-5 h-5 shrink-0 ${!puedeAgregar ? 'text-red-500' : 'text-amber-500'}`} />
            <div>
              <p className={`text-sm font-semibold ${!puedeAgregar ? 'text-red-800' : 'text-amber-800'}`}>
                {!puedeAgregar
                  ? 'Límite de clientes alcanzado'
                  : `${totalClientes} de ${limites.clientes} clientes en tu plan ${plan}`}
              </p>
              <p className={`text-xs mt-0.5 ${!puedeAgregar ? 'text-red-600' : 'text-amber-600'}`}>
                {!puedeAgregar
                  ? 'Actualiza tu plan para agregar clientes ilimitados.'
                  : 'Te estás acercando al límite de tu plan.'}
              </p>
            </div>
          </div>
          <Link
            href="/configuracion/plan"
            className={`shrink-0 text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors ${
              !puedeAgregar ? 'bg-red-600 hover:bg-red-700' : 'bg-amber-500 hover:bg-amber-600'
            }`}
          >
            Ver planes
          </Link>
        </div>
      )}

      <TablaClientes
        clientes={(clientes ?? []) as Cliente[]}
        statsMap={statsMap}
        puedeAgregar={puedeAgregar}
        limiteClientes={limites.clientes}
      />
    </div>
  )
}