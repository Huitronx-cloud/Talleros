export const dynamic = 'force-dynamic'
import { createClient } from '@/lib/supabase/server'
import CatalogoClient from './catalogo-client'

export default async function CatalogoPage() {
  const supabase = createClient()

  const { data: usuario } = await supabase
    .from('usuarios').select('taller_id').single()

  const { data: servicios } = await supabase
    .from('catalogo_servicios')
    .select('*')
    .eq('taller_id', usuario?.taller_id ?? '')
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
        tallerId={usuario?.taller_id ?? ''}
      />
    </div>
  )
}