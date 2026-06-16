export const dynamic = 'force-dynamic'
import { createClient } from '@/lib/supabase/server'
import InventarioClient from './inventario-client'

export default async function InventarioPage() {
  const supabase = createClient()

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('taller_id')
    .single()

  const { data: productos } = await supabase
    .from('inventario')
    .select('*')
    .eq('taller_id', usuario?.taller_id ?? '')
    .order('nombre')

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Inventario</h1>
      <p className="text-gray-500 text-sm mb-6">Gestiona tus refacciones y productos.</p>
      <InventarioClient
        productosIniciales={productos ?? []}
        tallerId={usuario?.taller_id ?? ''}
      />
    </div>
  )
}