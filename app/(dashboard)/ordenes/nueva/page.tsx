import { createClient } from '@/lib/supabase/server'
import { Cliente } from '@/types'
import FormNuevaOrden from '@/components/ordenes/form-nueva-orden'

export default async function NuevaOrdenPage() {
  const supabase = createClient()

  const [{ data: clientes }, { data: usuario }] = await Promise.all([
    supabase.from('clientes').select('*').order('nombre'),
    supabase.from('usuarios').select('taller_id').single(),
  ])

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Nueva orden de trabajo</h1>
      <FormNuevaOrden
        clientes={(clientes ?? []) as Cliente[]}
        tallerId={usuario?.taller_id ?? ''}
      />
    </div>
  )
}
