import { createClient } from '@/lib/supabase/server'
import { getLimites } from '@/lib/plan-limits'
import { redirect } from 'next/navigation'
import ReportesClient from './reportes-client'
import { Lock } from 'lucide-react'
import Link from 'next/link'

export default async function ReportesPage() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('taller_id, rol')
    .eq('id', user.id)
    .single()

  const tallerId = usuario?.taller_id ?? ''

  const { data: suscripcion } = await supabase
    .from('suscripciones')
    .select('plan')
    .eq('taller_id', tallerId)
    .single()

  const { data: taller } = await supabase
    .from('talleres')
    .select('moneda')
    .eq('id', tallerId)
    .single()

  const plan    = suscripcion?.plan ?? 'trial'
  const limites = getLimites(plan)

  if (!limites.reportes) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="bg-white rounded-2xl border border-gray-200 p-12">
          <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Lock className="w-8 h-8 text-purple-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Reportes avanzados</h1>
          <p className="text-gray-500 mb-2">
            Los reportes y métricas avanzadas están disponibles en el plan <strong>Pro</strong>.
          </p>
          <p className="text-gray-400 text-sm mb-8">
            Analiza ingresos, rendimiento de mecánicos, retención de clientes y más.
          </p>
          <div className="grid grid-cols-2 gap-3 mb-8 text-left">
            {[
              'Ingresos por mes y mecánico',
              'Tasa de retención de clientes',
              'Ticket promedio por servicio',
              'Rendimiento del equipo',
              'Clientes nuevos vs recurrentes',
              'Tiempo promedio de entrega',
            ].map(f => (
              <div key={f} className="flex items-center gap-2 text-sm text-gray-600">
                <div className="w-4 h-4 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-600" />
                </div>
                {f}
              </div>
            ))}
          </div>
          <Link
            href="/configuracion/plan"
            className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-bold px-6 py-3 rounded-xl transition-colors"
          >
            Actualizar a Pro →
          </Link>
        </div>
      </div>
    )
  }

  const hace6Meses = new Date()
  hace6Meses.setMonth(hace6Meses.getMonth() - 6)
  const desde = hace6Meses.toISOString()

  const [
    { data: ordenes },
    { data: clientes },
    { data: cotizaciones },
  ] = await Promise.all([
    supabase
      .from('ordenes')
      .select('id, total, estado, created_at, mecanico_asignado, cliente_id, servicios_realizados, tiempo_trabajado_minutos')
      .eq('taller_id', tallerId)
      .gte('created_at', desde)
      .order('created_at', { ascending: true }),
    supabase
      .from('clientes')
      .select('id, created_at')
      .eq('taller_id', tallerId)
      .gte('created_at', desde),
    supabase
      .from('cotizaciones')
      .select('id, estado, created_at')
      .eq('taller_id', tallerId)
      .gte('created_at', desde),
  ])

  return (
    <ReportesClient
      ordenes={ordenes ?? []}
      clientes={clientes ?? []}
      cotizaciones={cotizaciones ?? []}
      taller={taller}
    />
  )
}