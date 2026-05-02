'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  LayoutGrid,
  CalendarDays,
  Users,
  ClipboardList,
  FileText,
  Settings,
  LogOut,
  Wrench,
} from 'lucide-react'

const NAV_ITEMS = [
  { href: '/dashboard',    label: 'Dashboard',    icono: LayoutDashboard },
  { href: '/kanban',       label: 'Kanban',        icono: LayoutGrid      },
  { href: '/citas',        label: 'Citas',         icono: CalendarDays    },
  { href: '/clientes',     label: 'Clientes',     icono: Users           },
  { href: '/ordenes',      label: 'Órdenes',      icono: ClipboardList   },
  { href: '/cotizaciones', label: 'Cotizaciones', icono: FileText        },
]

const NAV_BOTTOM = [
  { href: '/configuracion', label: 'Configuración', icono: Settings },
]

interface Props {
  nombreTaller: string
}

export default function Sidebar({ nombreTaller }: Props) {
  const pathname = usePathname()
  const router   = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="w-64 h-screen bg-gray-900 flex flex-col fixed left-0 top-0">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <Wrench className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-white font-bold text-base leading-tight">Talleros</p>
            <p className="text-gray-400 text-xs truncate">{nombreTaller}</p>
          </div>
        </div>
      </div>

      {/* Navegación principal */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(({ href, label, icono: Icono }) => {
          const activo = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                activo
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              )}
            >
              <Icono className="w-4 h-4 flex-shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Navegación inferior */}
      <div className="px-3 py-4 border-t border-gray-800 space-y-1">
        {NAV_BOTTOM.map(({ href, label, icono: Icono }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
              pathname.startsWith(href)
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            )}
          >
            <Icono className="w-4 h-4 flex-shrink-0" />
            {label}
          </Link>
        ))}

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}