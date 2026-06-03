import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ListaCotizaciones from '@/components/cotizaciones/lista-cotizaciones'

export default async function CotizacionesPage() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('taller_id')
    .eq('id', user.id)
    .single()

  const { data: cotizaciones } = await supabase
    .from('cotizaciones')
    .select('*, clientes(nombre)')
    .eq('taller_id', usuario?.taller_id ?? '')
    .order('created_at', { ascending: false })

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <ListaCotizaciones cotizaciones={cotizaciones ?? []} />
    </div>
  )
}
