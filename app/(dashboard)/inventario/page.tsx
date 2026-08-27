export const dynamic = 'force-dynamic'
import Link from 'next/link'
import { Lock, ChevronRight, Package } from 'lucide-react'
import { createClient, getTallerId } from '@/lib/supabase/server'
import { getLimites } from '@/lib/plan-limits'
import InventarioClient from './inventario-client'

export default async function InventarioPage() {
  const supabase = createClient()

  const tallerId = (await getTallerId()) ?? ''

  const { data: suscripcion } = await supabase
    .from('suscripciones')
    .select('plan, trial_fin')
    .eq('taller_id', tallerId)
    .maybeSingle()

  const limites = getLimites(suscripcion?.plan ?? 'trial', suscripcion?.trial_fin)

  if (!limites.inventario) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="bg-white rounded-2xl border border-gray-200 p-12">
          <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Lock className="w-8 h-8 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Control de inventario</h1>
          <p className="text-gray-500 mb-2">
            El inventario de refacciones está disponible desde el plan <strong>Esencial</strong>.
          </p>
          <p className="text-gray-400 text-sm mb-8">
            Lleva el stock de tus refacciones y entérate cuando algo está por agotarse.
          </p>
          <div className="grid grid-cols-2 gap-3 mb-8 text-left">
            {[
              'Stock de refacciones y productos',
              'Aviso de stock bajo en el tablero',
              'Costos y precios de venta',
              'Todo tu catálogo en un solo lugar',
            ].map(item => (
              <div key={item} className="flex items-start gap-2 text-sm text-gray-600">
                <Package className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                {item}
              </div>
            ))}
          </div>
          <Link
            href="/configuracion/plan"
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            Ver planes y precios <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    )
  }

  const { data: productos } = await supabase
    .from('inventario')
    .select('*')
    .eq('taller_id', tallerId)
    .order('nombre')

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Inventario</h1>
      <p className="text-gray-500 text-sm mb-6">Gestiona tus refacciones y productos.</p>
      <InventarioClient
        productosIniciales={productos ?? []}
        tallerId={tallerId}
      />
    </div>
  )
}
