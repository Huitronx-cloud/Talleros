import { createClient } from '@/lib/supabase/server'
import ListaCotizaciones from '@/components/cotizaciones/lista-cotizaciones'

export default async function CotizacionesPage() {
  const supabase = createClient()

  const { data: cotizaciones } = await supabase
    .from('cotizaciones')
    .select('*, clientes(nombre)')
    .order('created_at', { ascending: false })

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <ListaCotizaciones cotizaciones={cotizaciones ?? []} />
    </div>
  )
}
