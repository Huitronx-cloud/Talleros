import { createClient, getAuthUser } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import Sidebar from '@/components/sidebar'
import { RolUsuario } from '@/types'
import NotificacionesRealtime from '@/components/recepcion/notificaciones-realtime'
import UpgradeSuccessModal from '@/components/upgrade-success-modal'
import SoporteWidget from '@/components/soporte-widget'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()
  const user = await getAuthUser()

  if (!user) redirect('/login')

  // JOIN en una sola query en vez de dos seguidas
  const { data: usuario } = await supabase
    .from('usuarios')
    .select('taller_id, rol, talleres(nombre, logo_url)')
    .eq('id', user.id)
    .maybeSingle()

  const taller = (usuario?.talleres as { nombre: string; logo_url: string | null } | null) ?? null
  const esRecepcion = usuario?.rol === 'recepcion'

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Suspense fallback={null}>
        <Sidebar
          nombreTaller={taller?.nombre ?? 'Mi taller'}
          logoUrl={taller?.logo_url ?? null}
          rol={(usuario?.rol ?? 'tecnico') as RolUsuario}
        />
      </Suspense>
      <main
        className="flex-1 pt-14 md:pt-0 md:ml-16 overflow-y-auto w-full transition-all duration-300"
        id="main-content"
      >
        <div className="p-4 md:p-6 lg:p-8 max-w-screen-xl mx-auto">
          {children}
        </div>
      </main>
      {esRecepcion && usuario?.taller_id && (
        <NotificacionesRealtime tallerId={usuario.taller_id} />
      )}
      <Suspense fallback={null}>
        <UpgradeSuccessModal />
      </Suspense>
      <SoporteWidget />
    </div>
  )
}