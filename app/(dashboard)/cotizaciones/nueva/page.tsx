import { createClient } from '@/lib/supabase/server'
import FormCotizacion from '@/components/cotizaciones/form-cotizacion'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export default async function NuevaCotizacionPage({
  searchParams,
}: {
  searchParams: { orden_id?: string }
}) {
  const supabase = createClient()

  const [{ data: clientes }, { data: ordenes }, { data: taller }] = await Promise.all([
    supabase.from('clientes').select('*').order('nombre'),
    supabase.from('ordenes').select('id, numero_orden, cliente_id, descripcion_problema, servicios_realizados').order('created_at', { ascending: false }),
    supabase.from('talleres').select('moneda, vigencia_dias').single(),
  ])

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <Link href="/cotizaciones" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4">
          <ChevronLeft className="w-4 h-4" />
          Volver a cotizaciones
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Nueva cotización</h1>
      </div>

      <FormCotizacion
        clientes={clientes ?? []}
        ordenes={ordenes ?? []}
        monedaDefault={(taller?.moneda as 'MXN' | 'COP') ?? 'MXN'}
        vigenciaDiasDefault={taller?.vigencia_dias ?? 15}
        ordenPreseleccionada={searchParams.orden_id}
      />
    </div>
  )
}
