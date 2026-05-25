import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/sidebar'
import { RolUsuario } from '@/types'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('taller_id, rol')
    .eq('id', user.id)
    .single()

  const { data: taller } = await supabase
    .from('talleres')
    .select('nombre, logo_url')
    .eq('id', usuario?.taller_id ?? '')
    .single()

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar
        nombreTaller={taller?.nombre ?? 'Mi taller'}
        logoUrl={taller?.logo_url ?? null}
        rol={(usuario?.rol ?? 'tecnico') as RolUsuario}
      />
      <main
        className="flex-1 pt-14 md:pt-0 md:ml-16 overflow-y-auto w-full transition-all duration-300"
        id="main-content"
      >
        <div className="p-4 md:p-6 lg:p-8 max-w-screen-xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}