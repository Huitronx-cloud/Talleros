import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import EquipoClient from './equipo-client'

export default async function EquipoPage() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('taller_id, rol')
    .eq('id', user.id)
    .single()

  if (!usuario || !['propietario', 'admin'].includes(usuario.rol)) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-5 text-center">
          <p className="text-sm font-semibold text-red-700">Sin acceso</p>
          <p className="text-xs text-red-500 mt-1">Solo el propietario y administradores pueden gestionar el equipo.</p>
        </div>
      </div>
    )
  }

  const { data: miembros } = await supabase
    .from('usuarios')
    .select('*')
    .eq('taller_id', usuario.taller_id)
    .order('created_at')

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Equipo</h1>
        <p className="text-gray-500 text-sm mt-1">Invita y gestiona a los miembros de tu taller.</p>
      </div>
      <EquipoClient
        miembros={miembros ?? []}
        rolActual={usuario.rol}
        tallerId={usuario.taller_id}
      />
    </div>
  )
}