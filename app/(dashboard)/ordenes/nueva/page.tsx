import { createClient } from '@/lib/supabase/server'
import { Cliente } from '@/types'
import FormNuevaOrden from '@/components/ordenes/form-nueva-orden'

export default async function NuevaOrdenPage() {
  const supabase = createClient()

  const { data: clientes } = await supabase
    .from('clientes')
    .select('*')
    .order('nombre')

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Nueva orden de trabajo</h1>
        <p className="text-gray-500 text-sm mt-1">Completa los datos en 2 pasos.</p>
      </div>
      <FormNuevaOrden clientes={(clientes ?? []) as Cliente[]} />
    </div>
  )
}
