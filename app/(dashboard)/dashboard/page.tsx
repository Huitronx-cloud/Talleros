import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-gray-900">¡Bienvenido a TallerOS!</h1>
        <p className="text-gray-500 mt-2">Dashboard cargando correctamente.</p>
        <p className="text-xs text-gray-400 mt-4">User: {user.email}</p>
      </div>
    )
  } catch (e: any) {
    return (
      <div className="p-8">
        <h1 className="text-red-600 font-bold">Error:</h1>
        <pre className="text-xs mt-2">{e?.message}</pre>
      </div>
    )
  }
}
