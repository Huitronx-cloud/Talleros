import { createClient } from '@/lib/supabase/server'
import FormConfiguracion from '@/components/configuracion/form-configuracion'
import { Taller } from '@/types'

export default async function ConfiguracionPage() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="p-6">
        <p className="text-red-600 text-sm">No hay sesión activa.</p>
      </div>
    )
  }

  const { data: usuario, error: errorUsuario } = await supabase
    .from('usuarios')
    .select('taller_id')
    .eq('id', user.id)
    .single()

  if (errorUsuario || !usuario?.taller_id) {
    return (
      <div className="p-6">
        <p className="text-red-600 text-sm">Error: {errorUsuario?.message ?? 'No se encontró taller_id'}</p>
      </div>
    )
  }

  const { data: taller, error: errorTaller } = await supabase
    .from('talleres')
    .select('*')
    .eq('id', usuario.taller_id)
    .single()

  if (errorTaller || !taller) {
    return (
      <div className="p-6">
        <p className="text-red-600 text-sm">Error: {errorTaller?.message ?? 'No se encontró el taller'}</p>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
        <p className="text-gray-500 text-sm mt-1">Administra los datos de tu taller y las preferencias de cotización.</p>
      </div>
      <FormConfiguracion taller={taller as Taller} />
    </div>
  )
}