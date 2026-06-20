import { Wrench, LogOut } from 'lucide-react'
import { cerrarSesionAdmin } from '../login/actions'

export default function AdminLeadsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-950">
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
            <Wrench className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-white font-bold text-sm">TallerOS · CRM interno</span>
        </div>
        <form action={cerrarSesionAdmin}>
          <button
            type="submit"
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Cerrar sesión
          </button>
        </form>
      </header>
      <main className="p-6">{children}</main>
    </div>
  )
}
