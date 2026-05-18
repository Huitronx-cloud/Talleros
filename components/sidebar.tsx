'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, LayoutGrid, CalendarDays, Users, ClipboardList,
  FileText, Settings, LogOut, Wrench, ChevronLeft, ChevronRight, Menu, X, UserCog, Package, BookOpen, BarChart2, Bell, Star,
  Smartphone,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { RolUsuario } from '@/types'
import PlanBadge from '@/components/plan-badge'
import LogoFullscreen from '@/components/logo-fullscreen'
import PushToggle from './push-toggle'


const TODOS_NAV_ITEMS = [
{ href: '/dashboard', label: 'Dashboard', icono: LayoutDashboard, roles: ['propietario', 'admin', 'recepcion', 'tecnico'] },
  { href: '/reportes',       label: 'Reportes',       icono: BarChart2,       roles: ['propietario', 'admin'] },
  { href: '/recordatorios',  label: 'Recordatorios',  icono: Bell,            roles: ['propietario', 'admin'] },  // ← NUEVA LÍNEA
  { href: '/resenas', label: 'Reseñas Google', icono: Star, roles: ['propietario', 'admin'] },
  { href: '/kanban',         label: 'Kanban',         icono: LayoutGrid,      roles: ['propietario', 'admin', 'tecnico', 'recepcion'] },
  { href: '/citas',          label: 'Citas',          icono: CalendarDays,    roles: ['propietario', 'admin', 'tecnico', 'recepcion'] },
  { href: '/clientes',       label: 'Clientes',       icono: Users,           roles: ['propietario', 'admin', 'recepcion'] },
  { href: '/ordenes',        label: 'Órdenes',        icono: ClipboardList,   roles: ['propietario', 'admin', 'tecnico', 'recepcion'] },
  { href: '/cotizaciones',   label: 'Cotizaciones',   icono: FileText,        roles: ['propietario', 'admin', 'recepcion'] },
  { href: '/inventario',     label: 'Inventario',     icono: Package,         roles: ['propietario', 'admin', 'recepcion'] },
]

const TODOS_NAV_BOTTOM = [
  { href: '/configuracion/equipo', label: 'Equipo',        icono: UserCog,    roles: ['propietario', 'admin'] },
  { href: '/configuracion',        label: 'Configuración', icono: Settings,   roles: ['propietario', 'admin'] },
  { href: '/catalogo',             label: 'Catálogo',      icono: BookOpen,   roles: ['propietario', 'admin'] },
  { href: '/ayuda/instalar',       label: 'Instalar app',  icono: Smartphone, roles: ['propietario', 'admin', 'tecnico', 'recepcion'] },
]

interface Props {
  nombreTaller: string
  logoUrl: string | null
  rol: RolUsuario
}

export default function Sidebar({ nombreTaller, logoUrl, rol }: Props) {
  const pathname = usePathname()
  const router   = useRouter()
  const supabase = createClient()
  const [colapsado, setColapsado]       = useState(false)
  const [menuMovil, setMenuMovil]       = useState(false)
  const [citasPendientes, setCitasPendientes] = useState(0)

  useEffect(() => {
    if (!['propietario', 'admin', 'recepcion'].includes(rol)) return

    async function cargarCitas() {
      const { data: usuario } = await supabase.from('usuarios').select('taller_id').eq('id', (await supabase.auth.getUser()).data.user?.id ?? '').single()
      if (!usuario) return
      const { count } = await supabase.from('citas').select('*', { count: 'exact', head: true }).eq('taller_id', usuario.taller_id).eq('estado', 'pendiente')
      setCitasPendientes(count ?? 0)

      // Realtime
      supabase.channel('citas-badge')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'citas', filter: `taller_id=eq.${usuario.taller_id}` }, async () => {
          const { count: c } = await supabase.from('citas').select('*', { count: 'exact', head: true }).eq('taller_id', usuario.taller_id).eq('estado', 'pendiente')
          setCitasPendientes(c ?? 0)
        })
        .subscribe()
    }
    cargarCitas()
  }, [rol])

  const NAV_ITEMS    = TODOS_NAV_ITEMS.filter(i => i.roles.includes(rol))
  const NAV_BOTTOM   = TODOS_NAV_BOTTOM.filter(i => i.roles.includes(rol))

  useEffect(() => {
    const timer = setTimeout(() => setColapsado(true), 7000)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    const main = document.getElementById('main-content')
    if (!main) return
    const esMobil = window.innerWidth < 768
    if (esMobil) { main.style.marginLeft = '0'; return }
    main.style.marginLeft = colapsado ? '4rem' : '16rem'
  }, [colapsado])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const NavLink = ({ href, label, icono: Icono }: { href: string; label: string; icono: any }) => {
    const activo    = pathname === href || pathname.startsWith(href + '/')
    const esCitas   = href === '/citas'
    const showBadge = esCitas && citasPendientes > 0
    return (
      <Link
        href={href}
        onClick={() => setMenuMovil(false)}
        title={colapsado ? label : undefined}
        className={cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors relative',
          colapsado ? 'justify-center' : '',
          activo
            ? 'bg-blue-600 text-white'
            : 'text-gray-400 hover:text-white hover:bg-gray-800'
        )}
      >
        <div className="relative flex-shrink-0">
          <Icono className="w-4 h-4" />
          {showBadge && (
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
              {citasPendientes > 9 ? '9+' : citasPendientes}
            </span>
          )}
        </div>
        {!colapsado && (
          <span className="flex items-center gap-2 flex-1">
            {label}
            {showBadge && !colapsado && (
              <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                {citasPendientes > 9 ? '9+' : citasPendientes}
              </span>
            )}
          </span>
        )}
      </Link>
    )
  }

  return (
    <>
      {/* ── BARRA MÓVIL ── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
          <div className="w-7 h-7 rounded-lg overflow-hidden flex-shrink-0 bg-gray-800 flex items-center justify-center">
            {logoUrl ? (
              <img src={logoUrl} alt={nombreTaller} className="w-full h-full object-contain" />
            ) : (
              <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
                <Wrench className="w-3.5 h-3.5 text-white" />
              </div>
            )}
          </div>
          <span className="text-white font-bold text-sm truncate max-w-[160px]">{nombreTaller}</span>
        </Link>
        <button onClick={() => setMenuMovil(!menuMovil)} className="text-gray-400 hover:text-white p-1 relative">
          {menuMovil ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          {citasPendientes > 0 && !menuMovil && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
              {citasPendientes > 9 ? '9+' : citasPendientes}
            </span>
          )}
        </button>
      </div>

      {/* ── MENÚ MÓVIL ── */}
      {menuMovil && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/60" onClick={() => setMenuMovil(false)}>
          <div className="absolute top-14 left-0 right-0 bg-gray-900 border-b border-gray-800 py-3 px-3 space-y-1" onClick={e => e.stopPropagation()}>
            {NAV_ITEMS.map(item => {
              const esCitas   = item.href === '/citas'
              const showBadge = esCitas && citasPendientes > 0
              return (
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
                  <span className="flex-1">{item.label}</span>
                  {showBadge && (
                    <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                      {citasPendientes > 9 ? '9+' : citasPendientes}
                    </span>
                  )}
                </Link>
              )
            })}
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
              <div className="px-3 py-2">
                <PushToggle dark={true} />
              </div>
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
        <div className={cn('px-3 py-5 border-b border-gray-800 flex items-center', colapsado ? 'justify-center' : 'gap-3 px-4')}>
          <Link href="/dashboard">
            <LogoFullscreen logoUrl={logoUrl} nombreTaller={nombreTaller} />
          </Link>
          {!colapsado && (
            <Link href="/dashboard" className="min-w-0 hover:opacity-80 transition-opacity">
              <p className="text-white font-bold text-sm leading-tight truncate">{nombreTaller}</p>
              <p className="text-gray-500 text-xs mt-0.5 capitalize">{rol}</p>
            </Link>
          )}
        </div>
        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(item => (
            <NavLink key={item.href} {...item} />
          ))}
        </nav>

        <div className="px-2 py-4 border-t border-gray-800 space-y-1">
          {NAV_BOTTOM.map(item => (
            <NavLink key={item.href} {...item} />
          ))}

          {/* Badge de plan — solo propietario y admin, sidebar expandido */}
          {!colapsado && ['propietario', 'admin'].includes(rol) && (
            <div className="px-1 py-2">
              <PlanBadge />
            </div>
          )}

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