export const dynamic = 'force-dynamic'
import { createClient, getAuthUser } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { redirect } from 'next/navigation'
import EquipoClient from './equipo-client'
import { getLimites, puedeCrear } from '@/lib/plan-limits'
import Link from 'next/link'
import { Users } from 'lucide-react'

export default async function EquipoPage() {
  const supabase = createClient()
  const admin    = createServiceClient()

  const user = await getAuthUser()
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

  // Usar service client para ver todos los miembros del taller (bypasa RLS)
  const [{ data: miembros }, { data: suscripcion }] = await Promise.all([
    admin.from('usuarios').select('*').eq('taller_id', usuario.taller_id).order('created_at'),
    supabase.from('suscripciones').select('plan').eq('taller_id', usuario.taller_id).single(),
  ])

  const plan          = suscripcion?.plan ?? 'trial'
  const limites       = getLimites(plan)
  const totalUsuarios = miembros?.length ?? 0
  const puedeInvitar  = puedeCrear(totalUsuarios, limites.usuarios)

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Equipo</h1>
        <p className="text-gray-500 text-sm mt-1">Invita y gestiona a los miembros de tu taller.</p>
      </div>

      {limites.usuarios !== -1 && (
        <div className={`mb-6 rounded-xl p-4 flex items-center justify-between gap-4 flex-wrap ${
          !puedeInvitar
            ? 'bg-red-50 border border-red-200'
            : totalUsuarios >= limites.usuarios * 0.8
            ? 'bg-amber-50 border border-amber-200'
            : 'bg-blue-50 border border-blue-200'
        }`}>
          <div className="flex items-center gap-3">
            <Users className={`w-5 h-5 shrink-0 ${!puedeInvitar ? 'text-red-500' : 'text-amber-500'}`} />
            <div>
              <p className={`text-sm font-semibold ${!puedeInvitar ? 'text-red-800' : 'text-amber-800'}`}>
                {!puedeInvitar
                  ? 'Límite de usuarios alcanzado'
                  : `${totalUsuarios} de ${limites.usuarios} usuarios en tu plan ${plan}`}
              </p>
              {!puedeInvitar && (
                <p className="text-xs text-red-600 mt-0.5">
                  Actualiza tu plan para agregar más miembros al equipo.
                </p>
              )}
            </div>
          </div>
          {!puedeInvitar && (
            <Link
              href="/configuracion/plan"
              className="shrink-0 bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors"
            >
              Ver planes
            </Link>
          )}
        </div>
      )}

      <EquipoClient
        miembros={miembros ?? []}
        rolActual={usuario.rol}
        tallerId={usuario.taller_id}
        puedeInvitar={puedeInvitar}
        limitePlan={limites.usuarios}
      />
    </div>
  )
}