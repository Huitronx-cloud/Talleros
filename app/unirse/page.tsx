import { createServiceClient } from '@/lib/supabase/service'
import { redirect } from 'next/navigation'
import FormUnirse from './form-unirse'

export const metadata = {
  robots: { index: false, follow: false },
}

export default async function UnirsePage({
  searchParams,
}: {
  searchParams: { token?: string }
}) {
  const token = searchParams.token

  if (!token) redirect('/login')

  const admin = createServiceClient()

  const { data: invitacion } = await admin
    .from('invitaciones')
    .select('*, talleres(nombre)')
    .eq('token', token)
    .eq('usado', false)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (!invitacion) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-xl border border-gray-200 p-8 max-w-md w-full text-center">
          <p className="text-2xl mb-2">❌</p>
          <h1 className="text-lg font-bold text-gray-900 mb-2">Invitación inválida</h1>
          <p className="text-sm text-gray-500">Este link ya fue usado o expiró. Pide una nueva invitación al dueño del taller.</p>
        </div>
      </div>
    )
  }

  const taller = invitacion.talleres as { nombre: string } | null

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-xl border border-gray-200 p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <p className="text-3xl mb-3">🔧</p>
          <h1 className="text-xl font-bold text-gray-900">Únete a {taller?.nombre}</h1>
          <p className="text-sm text-gray-500 mt-1">
            Has sido invitado como <span className="font-semibold capitalize">{invitacion.rol}</span>
          </p>
        </div>
        <FormUnirse
          token={token}
          email={invitacion.email}
          rol={invitacion.rol}
          tallerNombre={taller?.nombre ?? ''}
          tallerId={invitacion.taller_id}
        />
      </div>
    </div>
  )
}