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
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
} from 'lucide-react'
import { useState, useEffect } from 'react'

const NAV_ITEMS = [
  { href: '/dashboard',    label: 'Dashboard',    icono: LayoutDashboard },
  { href: '/kanban',       label: 'Kanban',        icono: LayoutGrid      },
  { href: '/citas',        label: 'Citas',         icono: CalendarDays    },
  { href: '/clientes',     label: 'Clientes',      icono: Users           },
  { href: '/ordenes',      label: 'Órdenes',       icono: ClipboardList   },
  { href: '/cotizaciones', label: 'Cotizaciones',  icono: FileText        },
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
  const [colapsado, setColapsado] = useState(false)
  const [menuMovil, setMenuMovil] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setColapsado(true), 7000)
    return () => clearTimeout(timer)
  }, [])
  useEffect(() => {
    const main = document.getElementById('main-content')
    if (!main) return
    main.style.marginLeft = colapsado ? '4rem' : '16rem'
  }, [colapsado])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const NavLink = ({ href, label, icono: Icono }: { href: string; label: string; icono: any }) => {
    const activo = pathname === href || pathname.startsWith(href + '/')
    return (
      <Link
        href={href}
        onClick={() => setMenuMovil(false)}
        title={colapsado ? label : undefined}
        className={cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
          colapsado ? 'justify-center' : '',
          activo
            ? 'bg-blue-600 text-white'
            : 'text-gray-400 hover:text-white hover:bg-gray-800'
        )}
      >
        <Icono className="w-4 h-4 flex-shrink-0" />
        {!colapsado && <span>{label}</span>}
      </Link>
    )
  }

  return (
    <>
      {/* ── BARRA MÓVIL (visible solo en móvil) ── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
            <Wrench className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-white font-bold text-sm">TallerOS</span>
        </div>
        <button
          onClick={() => setMenuMovil(!menuMovil)}
          className="text-gray-400 hover:text-white p-1"
        >
          {menuMovil ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* ── MENÚ MÓVIL DESPLEGABLE ── */}
      {menuMovil && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/60" onClick={() => setMenuMovil(false)}>
          <div className="absolute top-14 left-0 right-0 bg-gray-900 border-b border-gray-800 py-3 px-3 space-y-1" onClick={e => e.stopPropagation()}>
            {NAV_ITEMS.map(item => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuMovil(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors',
                  pathname === item.href || pathname.startsWith(item.href + '/')
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                )}
              >
                <item.icono className="w-4 h-4 flex-shrink-0" />
                {item.label}
              </Link>
            ))}
            <div className="border-t border-gray-800 pt-2 mt-2 space-y-1">
              {NAV_BOTTOM.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuMovil(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors',
                    pathname.startsWith(item.href)
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  )}
                >
                  <item.icono className="w-4 h-4 flex-shrink-0" />
                  {item.label}
                </Link>
              ))}
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
              >
                <LogOut className="w-4 h-4 flex-shrink-0" />
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── SIDEBAR DESKTOP ── */}
      <aside className={cn(
        'hidden md:flex h-screen bg-gray-900 flex-col fixed left-0 top-0 transition-all duration-300 z-30',
        colapsado ? 'w-16' : 'w-64'
      )}>
        {/* Logo */}
        <div className={cn('px-3 py-5 border-b border-gray-800 flex items-center', colapsado ? 'justify-center' : 'gap-3 px-6')}>
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <Wrench className="w-4 h-4 text-white" />
          </div>
          {!colapsado && (
            <div className="min-w-0">
              <p className="text-white font-bold text-base leading-tight">TallerOS</p>
              <p className="text-gray-400 text-xs truncate">{nombreTaller}</p>
            </div>
          )}
        </div>

        {/* Nav principal */}
        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(item => (
            <NavLink key={item.href} {...item} />
          ))}
        </nav>

        {/* Nav inferior */}
        <div className="px-2 py-4 border-t border-gray-800 space-y-1">
          {NAV_BOTTOM.map(item => (
            <NavLink key={item.href} {...item} />
          ))}
          <button
            onClick={handleLogout}
            title={colapsado ? 'Cerrar sesión' : undefined}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800 transition-colors',
              colapsado ? 'justify-center' : ''
            )}
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {!colapsado && <span>Cerrar sesión</span>}
          </button>

          {/* Botón colapsar */}
          <button
            onClick={() => setColapsado(!colapsado)}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium text-gray-600 hover:text-gray-400 hover:bg-gray-800 transition-colors',
              colapsado ? 'justify-center' : ''
            )}
          >
            {colapsado
              ? <ChevronRight className="w-4 h-4 flex-shrink-0" />
              : <><ChevronLeft className="w-4 h-4 flex-shrink-0" /><span>Colapsar</span></>
            }
          </button>
        </div>
      </aside>
    </>
  )
}