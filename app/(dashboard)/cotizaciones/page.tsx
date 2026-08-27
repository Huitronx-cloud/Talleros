export const dynamic = 'force-dynamic'
import { createClient, getAuthUser, getTallerId } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ListaCotizaciones from '@/components/cotizaciones/lista-cotizaciones'

export default async function CotizacionesPage() {
  const supabase = createClient()

  const user = await getAuthUser()
  if (!user) redirect('/login')

  const tallerId = (await getTallerId()) ?? ''

  const { data: cotizaciones } = await supabase
    .from('cotizaciones')
    .select('*, clientes(nombre)')
    .eq('taller_id', tallerId)
    .order('created_at', { ascending: false })

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <ListaCotizaciones cotizaciones={cotizaciones ?? []} />
    </div>
  )
}
