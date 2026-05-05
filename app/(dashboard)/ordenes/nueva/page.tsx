import { createClient } from '@/lib/supabase/server'
import { Cliente } from '@/types'
import FormNuevaOrden from '@/components/ordenes/form-nueva-orden'
import FormRapidoOrden from '@/components/recepcion/form-rapido-orden'

export default async function NuevaOrdenPage() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('taller_id, rol')
    .eq('id', user!.id)
    .single()

  const tallerId = usuario?.taller_id ?? ''
  const esRecepcion = usuario?.rol === 'recepcion'

  const [{ data: clientes }, { data: taller }] = await Promise.all([
    supabase.from('clientes').select('*').order('nombre'),
    supabase.from('talleres').select('pais, moneda, nombre').eq('id', tallerId).single(),
  ])

  if (esRecepcion) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Nueva orden rápida</h1>
        <FormRapidoOrden
          clientes={(clientes ?? []) as Cliente[]}
          tallerId={tallerId}
          pais={taller?.pais ?? 'México'}
          moneda={taller?.moneda ?? 'MXN'}
        />
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Nueva orden de trabajo</h1>
      <FormNuevaOrden
        clientes={(clientes ?? []) as Cliente[]}
        tallerId={tallerId}
        pais={taller?.pais ?? 'México'}
        moneda={taller?.moneda ?? 'MXN'}
      />
    </div>
  )
}