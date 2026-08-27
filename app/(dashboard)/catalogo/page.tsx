export const dynamic = 'force-dynamic'
import { createClient, getTallerId } from '@/lib/supabase/server'
import CatalogoClient from './catalogo-client'

export default async function CatalogoPage() {
  const supabase = createClient()

  const tallerId = (await getTallerId()) ?? ''

  const { data: servicios } = await supabase
    .from('catalogo_servicios')
    .select('*')
    .eq('taller_id', tallerId)
    .order('categoria')
    .order('nombre')

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Catálogo de servicios</h1>
      <p className="text-gray-500 text-sm mb-6">
        Define tus servicios estándar con precios para agilizar la creación de órdenes.
      </p>
      <CatalogoClient
        serviciosIniciales={servicios ?? []}
        tallerId={tallerId}
      />
    </div>
  )
}