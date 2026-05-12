import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import {
  LayoutGrid, CalendarDays, Users, ClipboardList, FileText,
  Settings, Package, BookOpen, UserCog, TrendingUp,
  AlertTriangle, Clock, Wrench, Download, MessageCircle, Bell
} from 'lucide-react'
import GraficaIngresos from './grafica-ingresos'
import BannerUpgrade from './banner-upgrade'

const MODULOS = [
  { href: '/kanban',               label: 'Kanban',        icono: LayoutGrid,    color: 'bg-blue-500',    roles: ['propietario','admin','tecnico','recepcion'] },
  { href: '/ordenes',              label: 'Órdenes',       icono: ClipboardList, color: 'bg-indigo-500',  roles: ['propietario','admin','tecnico','recepcion'] },
  { href: '/reportes',             label: 'Reportes',      icono: BarChart2,     color: 'bg-purple-500',  roles: ['propietario','admin'] },  // ← NUEVA LÍNEA
  { href: '/citas',                label: 'Citas',         icono: CalendarDays,  color: 'bg-violet-500',  roles: ['propietario','admin','tecnico','recepcion'] },
  { href: '/clientes',             label: 'Clientes',      icono: Users,         color: 'bg-sky-500',     roles: ['propietario','admin','recepcion'] },
  { href: '/cotizaciones',         label: 'Cotizaciones',  icono: FileText,      color: 'bg-teal-500',    roles: ['propietario','admin','recepcion'] },
  { href: '/inventario',           label: 'Inventario',    icono: Package,       color: 'bg-emerald-500', roles: ['propietario','admin','recepcion'] },
  { href: '/catalogo',             label: 'Catálogo',      icono: BookOpen,      color: 'bg-amber-500',   roles: ['propietario','admin'] },
  { href: '/recordatorios',        label: 'Recordatorios', icono: Bell,          color: 'bg-sky-600',     roles: ['propietario','admin'], upgrade: true },
  { href: '/configuracion/equipo', label: 'Equipo',        icono: UserCog,       color: 'bg-orange-500',  roles: ['propietario','admin'] },
  { href: '/configuracion',        label: 'Configuración', icono: Settings,      color: 'bg-rose-500',    roles: ['propietario','admin'] },
  { href: '/configuracion/plan',   label: 'Subir a Pro',   icono: TrendingUp,    color: 'from-purple-500 to-purple-700', roles: ['propietario'], upgrade: true },
]

export default async function DashboardPage() {
  const supabase = createClient()

  const ahora         = new Date()
  const inicioMes     = new Date(ahora.getFullYear(), ahora.getMonth(), 1).toISOString()
  const inicioGrafica = new Date(ahora.getFullYear(), ahora.getMonth() - 5, 1).toISOString()

  const hora = ahora.getHours()
  const saludo = hora < 12 ? 'Buenos días' : hora < 18 ? 'Buenas tardes' : 'Buenas noches'

  const [
    { count: totalClientes },
    { count: ordenesMes },
    { count: cotizacionesAbiertas },
    { data: ingresosMes },
    { data: ordenesRecientes },
    { data: ordenesRetrasadas },
    { data: ingresosPorMes },
    { data: usuarioData },
    { data: ordenesTiempo },
    { data: inventarioItems },
  ] = await Promise.all([
    supabase.from('clientes').select('*', { count: 'exact', head: true }),
    supabase.from('ordenes').select('*', { count: 'exact', head: true }).gte('created_at', inicioMes),
    supabase.from('cotizaciones').select('*', { count: 'exact', head: true }).eq('estado', 'enviada'),
    supabase.from('ordenes').select('total').gte('created_at', inicioMes).eq('estado', 'entregado'),
    supabase.from('ordenes')
      .select('id, descripcion_problema, estado, created_at, clientes(nombre)')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase.from('ordenes')
      .select('id, numero_orden, fecha_prometida, estado, clientes(nombre)')
      .lt('fecha_prometida', ahora.toISOString().split('T')[0])
      .neq('estado', 'entregado')
      .not('fecha_prometida', 'is', null)
      .order('fecha_prometida', { ascending: true }),
    supabase.from('ordenes')
      .select('total, created_at')
      .gte('created_at', inicioGrafica)
      .eq('estado', 'entregado'),
    supabase.from('usuarios')
      .select('nombre, rol, taller_id, talleres(nombre, logo_url)')
      .single(),
    supabase.from('ordenes')
      .select('descripcion_problema, servicios_realizados, tiempo_trabajado_minutos, mecanico_asignado, estado')
      .gt('tiempo_trabajado_minutos', 0)
      .eq('estado', 'entregado')
      .order('created_at', { ascending: false })
      .limit(50),
    supabase.from('inventario').select('id, nombre, stock_actual, stock_minimo, unidad').order('stock_actual'),
  ])
// Obtener plan de suscripción
  const { data: suscripcionData } = await supabase
    .from('suscripciones')
    .select('plan')
    .eq('taller_id', usuarioData?.taller_id ?? '')
    .single()

  const planActual = suscripcionData?.plan ?? 'trial'
  const tallerRaw = usuarioData?.talleres
const taller = (Array.isArray(tallerRaw) ? tallerRaw[0] : tallerRaw) as { nombre: string; logo_url: string | null } | null
  const nombreUser = usuarioData?.nombre?.split(' ')[0] ?? 'equipo'
  const rol        = (usuarioData?.rol ?? 'recepcion') as string

  const stockBajo      = (inventarioItems ?? []).filter((i: any) => i.stock_actual <= i.stock_minimo)
  const totalIngresos  = ingresosMes?.reduce((acc, o) => acc + (o.total || 0), 0) ?? 0

  const meses = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(ahora.getFullYear(), ahora.getMonth() - 5 + i, 1)
    return {
      key:   `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: d.toLocaleDateString('es-MX', { month: 'short' }),
      total: 0,
    }
  })
  ingresosPorMes?.forEach(o => {
    const key = o.created_at.slice(0, 7)
    const mes = meses.find(m => m.key === key)
    if (mes) mes.total += o.total || 0
  })

  const mapaServicios: Record<string, { minutos: number[]; mecanicos: Set<string> }> = {}
  ordenesTiempo?.forEach((o: any) => {
    const min      = o.tiempo_trabajado_minutos ?? 0
    const mecanico = o.mecanico_asignado ?? 'Sin asignar'
    const servicios: { descripcion: string }[] = o.servicios_realizados ?? []
    if (servicios.length === 0) {
      const key = (o.descripcion_problema ?? 'Servicio general').slice(0, 40)
      if (!mapaServicios[key]) mapaServicios[key] = { minutos: [], mecanicos: new Set() }
      mapaServicios[key].minutos.push(min)
      mapaServicios[key].mecanicos.add(mecanico)
    } else {
      servicios.forEach(s => {
        const key = s.descripcion.slice(0, 40)
        if (!mapaServicios[key]) mapaServicios[key] = { minutos: [], mecanicos: new Set() }
        mapaServicios[key].minutos.push(min)
        mapaServicios[key].mecanicos.add(mecanico)
      })
    }
  })

  const promediosServicios = Object.entries(mapaServicios)
    .map(([nombre, { minutos, mecanicos }]) => ({
      nombre,
      promedio: Math.round(minutos.reduce((a, b) => a + b, 0) / minutos.length),
      cantidad: minutos.length,
      mecanicos: Array.from(mecanicos).join(', '),
    }))
    .sort((a, b) => b.cantidad - a.cantidad)
    .slice(0, 6)

  const formatMin = (min: number) => {
    const h = Math.floor(min / 60)
    const m = min % 60
    if (h === 0) return `${m}m`
    return `${h}h ${m}m`
  }

  const diasRetraso = (fecha: string) => {
    const prometida = new Date(fecha + 'T12:00:00')
    return Math.floor((ahora.getTime() - prometida.getTime()) / (1000 * 60 * 60 * 24))
  }

  const estadoColor: Record<string, string> = {
    recibido:   'bg-gray-100 text-gray-600',
    en_proceso: 'bg-blue-100 text-blue-600',
    listo:      'bg-green-100 text-green-600',
    entregado:  'bg-purple-100 text-purple-600',
  }

  const WHATSAPP_SOPORTE = 'https://wa.me/1234567890?text=Hola%2C%20necesito%20soporte%20con%20TallerOS'

  const modulosVisibles = MODULOS.filter(m => {
    if (!m.roles.includes(rol)) return false
    return true
  }).map((m: any) => {
    if (m.href === '/configuracion/plan') {
      if (planActual === 'pro') {
        return {
          ...m,
          href:    WHATSAPP_SOPORTE,
          label:   'Soporte',
          icono:   MessageCircle,
          color:   'from-green-500 to-green-700',
          upgrade: false,
          externo: true,
        }
      }
    }
    return m
  })

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── HERO HEADER ── */}
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-blue-900 px-6 pt-8 pb-10 relative overflow-hidden">

        {/* Fondo decorativo */}
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'radial-gradient(circle at 20% 50%, #3b82f6 0%, transparent 50%), radial-gradient(circle at 80% 20%, #6366f1 0%, transparent 40%)',
          }}
        />

        <div className="relative max-w-5xl mx-auto">
          {/* Logo + nombre taller */}
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gray-700 flex items-center justify-center flex-shrink-0 border border-white/10">
              {taller?.logo_url ? (
                <img src={taller.logo_url} alt={taller.nombre} className="w-full h-full object-contain" />
              ) : (
                <Wrench className="w-7 h-7 text-blue-400" />
              )}
            </div>
            <div>
              <p className="text-blue-300 text-sm font-medium">{saludo}, {nombreUser}</p>
              <h1 className="text-white text-2xl font-bold leading-tight">{taller?.nombre ?? 'Tu taller'}</h1>
            </div>
            <Link
              href="/api/exportar"
              className="ml-auto flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors border border-white/10"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Exportar</span>
            </Link>
          </div>

          {/* Métricas rápidas */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Clientes',          valor: totalClientes ?? 0,                   href: '/clientes',     color: 'text-sky-300' },
              { label: 'Órdenes este mes',  valor: ordenesMes ?? 0,                      href: '/ordenes',      color: 'text-green-300' },
              { label: 'Cotiz. abiertas',   valor: cotizacionesAbiertas ?? 0,            href: '/cotizaciones', color: 'text-yellow-300' },
              { label: 'Ingresos del mes',  valor: `$${totalIngresos.toLocaleString()}`, href: '/ordenes',      color: 'text-purple-300' },
            ].map(({ label, valor, href, color }) => (
              <Link key={label} href={href}
                className="bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl px-4 py-3 transition-colors"
              >
                <p className="text-gray-400 text-xs mb-1">{label}</p>
                <p className={`text-xl font-bold ${color}`}>{valor}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">

        {/* ── BANNER UPGRADE ── */}
        <BannerUpgrade tallerId={usuarioData?.taller_id} />

        {/* ── ALERTAS ── */}
        {(ordenesRetrasadas && ordenesRetrasadas.length > 0) || stockBajo.length > 0 ? (
          <div className="space-y-3">
            {ordenesRetrasadas && ordenesRetrasadas.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  <p className="text-sm font-semibold text-red-700">
                    {ordenesRetrasadas.length} {ordenesRetrasadas.length === 1 ? 'orden retrasada' : 'órdenes retrasadas'}
                  </p>
                </div>
                <div className="space-y-2">
                  {ordenesRetrasadas.map((o: any) => (
                    <Link key={o.id} href={`/ordenes/${o.id}`}
                      className="flex items-center justify-between bg-white border border-red-100 rounded-lg px-4 py-2.5 hover:border-red-300 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono font-semibold text-gray-500">
                          #{String(o.numero_orden).padStart(4, '0')}
                        </span>
                        <span className="text-sm font-medium text-gray-900">
                          {(o.clientes as any)?.nombre ?? 'Cliente'}
                        </span>
                      </div>
                      <span className="text-xs font-semibold text-red-600 bg-red-100 px-2.5 py-1 rounded-full">
                        {diasRetraso(o.fecha_prometida)} días de retraso
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {stockBajo.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                  <p className="text-sm font-semibold text-amber-700">
                    {stockBajo.length} {stockBajo.length === 1 ? 'producto con' : 'productos con'} stock bajo
                  </p>
                  <Link href="/inventario" className="ml-auto text-xs text-amber-600 font-medium hover:text-amber-700">
                    Ver inventario →
                  </Link>
                </div>
                <div className="space-y-1.5">
                  {stockBajo.slice(0, 3).map((p: any) => (
                    <div key={p.id} className="flex items-center justify-between bg-white border border-amber-100 rounded-lg px-3 py-2">
                      <p className="text-sm text-gray-900 font-medium">{p.nombre}</p>
                      <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                        {p.stock_actual} / {p.stock_minimo} {p.unidad}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}

        {/* ── LAUNCHPAD ── */}
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Módulos</h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3">
            {modulosVisibles.map((m: any) => {
              const { href, label, icono: Icono, color, upgrade, externo } = m
              return (
              <Link key={href} href={href} target={(m as any).externo ? '_blank' : undefined} rel={(m as any).externo ? 'noopener noreferrer' : undefined}
                className={`group flex flex-col items-center gap-2 rounded-2xl overflow-hidden transition-all hover:shadow-md ${
                  upgrade
                    ? 'border-2 border-purple-400 hover:border-purple-500'
                    : 'bg-white border border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className={`w-full bg-gradient-to-br ${
                  upgrade ? 'from-purple-500 to-purple-700' : color
                } flex items-center justify-center py-5 group-hover:brightness-110 transition-all relative`}>
                  <Icono className="w-10 h-10 text-white" />
                  {upgrade && (
                    <span className="absolute top-1.5 right-1.5 bg-yellow-400 text-yellow-900 text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                      PRO
                    </span>
                  )}
                </div>
                <span className={`text-xs font-medium text-center leading-tight pb-3 px-2 ${
                  upgrade ? 'text-purple-700 font-semibold' : 'text-gray-700'
                }`}>
                  {label}
                </span>
              </Link>
            )})}
          </div>
        </div>

        {/* ── GRÁFICA + ÓRDENES RECIENTES ── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-6">Ingresos últimos 6 meses</h2>
            <GraficaIngresos datos={meses} />
          </div>

          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900">Órdenes recientes</h2>
            </div>
            {ordenesRecientes && ordenesRecientes.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {ordenesRecientes.map((orden: any) => (
                  <Link key={orden.id} href={`/ordenes/${orden.id}`}
                    className="px-5 py-3.5 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {(orden.clientes as any)?.nombre ?? 'Cliente'}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{orden.descripcion_problema}</p>
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 ml-2 ${estadoColor[orden.estado] ?? 'bg-gray-100 text-gray-600'}`}>
                      {orden.estado.replace('_', ' ')}
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center">
                <ClipboardList className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">Aún no hay órdenes registradas.</p>
              </div>
            )}
          </div>
        </div>

        {/* ── TIEMPOS POR SERVICIO ── */}
        {promediosServicios.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-5">
              <Clock className="w-4 h-4 text-blue-500" />
              <h2 className="text-base font-semibold text-gray-900">Tiempos promedio por servicio</h2>
              <span className="text-xs text-gray-400 ml-auto">
                Basado en {ordenesTiempo?.length ?? 0} órdenes con tiempo registrado
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {promediosServicios.map(s => {
                const porcentaje = Math.min(100, (s.promedio / 480) * 100)
                return (
                  <div key={s.nombre} className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <p className="text-sm font-semibold text-gray-900 leading-tight line-clamp-2">{s.nombre}</p>
                      <span className="text-lg font-bold text-blue-600 flex-shrink-0">{formatMin(s.promedio)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 mb-2">
                      <div className="bg-blue-500 h-1.5 rounded-full transition-all" style={{ width: `${porcentaje}%` }} />
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span>{s.cantidad} {s.cantidad === 1 ? 'orden' : 'órdenes'}</span>
                      <span className="truncate ml-2">{s.mecanicos}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}