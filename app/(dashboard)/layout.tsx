import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/sidebar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: taller } = await supabase
    .from('talleres')
    .select('nombre')
    .single()

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar nombreTaller={taller?.nombre ?? 'Mi taller'} />
      {/* Móvil: padding top por la barra fija. Desktop: margin left por el sidebar */}
      <main className="flex-1 md:ml-16 pt-14 md:pt-0 overflow-y-auto w-full transition-all duration-300" id="main-content">
        <div className="p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}