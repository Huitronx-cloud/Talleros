import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// ── RATE LIMITING ─────────────────────────────────────────────────────────────
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

const RATE_LIMITS: Record<string, { max: number; windowMs: number }> = {
  '/api/talleres/registro':  { max: 5,  windowMs: 60 * 60 * 1000 }, // 5 registros/hora por IP
  '/api/stripe/checkout':    { max: 10, windowMs: 60 * 60 * 1000 }, // 10 checkouts/hora por IP
  '/api/invitaciones':       { max: 10, windowMs: 60 * 60 * 1000 }, // 10 invitaciones/hora
  '/api/bienvenida':         { max: 20, windowMs: 60 * 60 * 1000 }, // 20 WhatsApps/hora
}

function checkRateLimit(ip: string, pathname: string): boolean {
  const rule = Object.entries(RATE_LIMITS).find(([path]) => pathname.startsWith(path))
  if (!rule) return true // sin límite para esta ruta

  const [, { max, windowMs }] = rule
  const key = `${ip}:${pathname}`
  const now = Date.now()
  const entry = rateLimitMap.get(key)

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }

  if (entry.count >= max) return false

  entry.count++
  return true
}

// ── CORS ─────────────────────────────────────────────────────────────────────
const ALLOWED_ORIGINS = [
  'https://www.tallerosapp.com',
  'https://tallerosapp.com',
]

// Endpoints que reciben peticiones de terceros (Stripe, Vercel Cron)
const CORS_EXCEPTIONS = [
  '/api/stripe/webhook',
  '/api/cron/',
  '/api/notificar-cita',
  '/api/confirmar-cita',
]

function handleCORS(request: NextRequest): NextResponse | null {
  const { pathname } = request.nextUrl
  const isApiRoute = pathname.startsWith('/api/')
  if (!isApiRoute) return null

  // Excepciones — estos endpoints no validamos origen
  const isException = CORS_EXCEPTIONS.some(e => pathname.startsWith(e))
  if (isException) return null

  const origin = request.headers.get('origin') ?? ''

  // Preflight OPTIONS — responder directamente
  if (request.method === 'OPTIONS') {
    const res = new NextResponse(null, { status: 204 })
    if (ALLOWED_ORIGINS.includes(origin)) {
      res.headers.set('Access-Control-Allow-Origin', origin)
    }
    res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    res.headers.set('Access-Control-Max-Age', '86400')
    return res
  }

  // En producción, bloquear si el origen no es tallerosapp.com
  // En desarrollo (sin origin o localhost) dejamos pasar
  if (
    origin &&
    !ALLOWED_ORIGINS.includes(origin) &&
    !origin.includes('localhost') &&
    !origin.includes('127.0.0.1') &&
    !origin.includes('vercel.app') // preview deploys de Vercel
  ) {
    return new NextResponse(
      JSON.stringify({ error: 'Origin not allowed' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    )
  }

  return null
}

// Coincidencia por ruta exacta o subruta. Importante: se compara con `r + '/'`,
// no con startsWith(r) a secas — con '/' en la lista, un startsWith simple daba
// true para CUALQUIER ruta y dejaba sin efecto tanto el guard de sesión como la
// verificación de rol de más abajo.
function coincideRuta(rutas: string[], pathname: string): boolean {
  return rutas.some(r => pathname === r || pathname.startsWith(r + '/'))
}

const RUTAS_PUBLICAS = [
  '/',
  '/abriendo', // página puente de arranque de la PWA — debe cachearse sin sesión
  '/offline',
  '/privacidad',
  '/terminos',
  '/login',
  '/auth/callback',
  '/unirse',
  '/portal',   // /portal/[token] — portal del cliente
  '/registro',
  '/recuperar-password',
  '/nueva-password',
  // Marketing / contenido indexable: sin estas, el blog y la landing por país
  // redirigirían a /login y se perdería la indexación en Google.
  '/blog',
  '/demo',
  '/guia',
  '/mexico',
  '/colombia',
  '/peru',
  '/sitemap.xml',
  '/robots.txt',
]

// La página pública de reservas es /citas/[tallerId]; /citas a secas es el
// calendario del taller y sí requiere sesión.
const RUTAS_PUBLICAS_SOLO_SUBRUTA = ['/citas']

const RUTAS_POST_REGISTRO = ['/onboarding'] // sesión sí, onboarding no requerido

// Rutas administrativas: solo propietario y admin. El resto de la app queda
// disponible para cualquier usuario del taller (la RLS ya aísla por taller_id),
// para no romper la operación diaria de técnicos y recepción.
const RUTAS_SOLO_ADMIN = [
  '/configuracion', // datos del taller, equipo, plan y facturación
  '/reportes',
  '/inventario',
  '/promociones',
  '/recordatorios',
  '/resenas',
]

function tieneAcceso(rol: string, pathname: string): boolean {
  if (rol === 'propietario' || rol === 'admin') return true
  return !coincideRuta(RUTAS_SOLO_ADMIN, pathname)
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // ── CORS check primero ────────────────────────────────────────────────────
  const corsResponse = handleCORS(request)
  if (corsResponse) return corsResponse

  // ── RATE LIMITING ─────────────────────────────────────────────────────────
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim()
    ?? request.headers.get('x-real-ip')
    ?? 'unknown'

  if (!checkRateLimit(ip, pathname)) {
    return new NextResponse(
      JSON.stringify({ error: 'Demasiadas solicitudes. Intenta de nuevo en unos minutos.' }),
      { status: 429, headers: { 'Content-Type': 'application/json', 'Retry-After': '3600' } }
    )
  }

  // ── ADMIN INTERNO ──────────────────────────────────────────────────────────
  // CRM de prospección del equipo TallerOS. Totalmente separado del sistema
  // multi-tenant (usuarios/taller_id/rol) — gateado por secreto compartido,
  // no usa sesión de Supabase.
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    if (pathname === '/admin/login' || pathname === '/api/admin/login') {
      return NextResponse.next()
    }
    const sesionAdmin = request.cookies.get('admin_session')?.value
    if (!process.env.ADMIN_SECRET || sesionAdmin !== process.env.ADMIN_SECRET) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
      }
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
    return NextResponse.next()
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Las rutas /api/ no pasan por el guard de sesión: cada handler valida lo
  // suyo (Bearer CRON_SECRET en los crons, firma en los webhooks, RLS con la
  // sesión del usuario en el resto). Redirigirlas a /login rompería los crons
  // de Vercel y las llamadas server-to-server, que no llevan cookie, y además
  // una API debe responder 401, no un HTML de login.
  const esApi = pathname.startsWith('/api/')
  const esRutaPublica =
    coincideRuta(RUTAS_PUBLICAS, pathname) ||
    RUTAS_PUBLICAS_SOLO_SUBRUTA.some(r => pathname.startsWith(r + '/'))
  const esRutaPostRegistro = coincideRuta(RUTAS_POST_REGISTRO, pathname)

  // Sin sesión → login
  if (!user && !esApi && !esRutaPublica && !esRutaPostRegistro) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Con sesión en /login → redirigir según rol
  if (user && pathname === '/login') {
    const { data: usuario } = await supabase
      .from('usuarios')
      .select('rol')
      .eq('id', user.id)
      .single()
    const destino = usuario?.rol === 'tecnico' ? '/ordenes' : '/dashboard'
    return NextResponse.redirect(new URL(destino, request.url))
  }

  // Con sesión en /registro → ya tiene cuenta, ir al dashboard
  if (user && pathname.startsWith('/registro')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Raíz → dashboard solo si el usuario está autenticado
  if (user && pathname === '/') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Verificar acceso por rol en rutas protegidas
  // El rol se cachea en cookie para evitar un query DB en cada navegación
  if (user && !esApi && !esRutaPublica && !esRutaPostRegistro) {
    let rol: string
    const rolCookie = request.cookies.get('_u_rol')?.value
    const [cachedUserId, cachedRol] = rolCookie?.split('|') ?? []

    if (cachedUserId === user.id && cachedRol) {
      rol = cachedRol
    } else {
      const { data: usuario } = await supabase
        .from('usuarios')
        .select('rol')
        .eq('id', user.id)
        .single()
      rol = usuario?.rol ?? 'tecnico'
      supabaseResponse.cookies.set('_u_rol', `${user.id}|${rol}`, {
        maxAge: 3600,
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
      })
    }

    if (!tieneAcceso(rol, pathname)) {
      return NextResponse.redirect(new URL('/ordenes', request.url))
    }
  }

  return supabaseResponse
}

// `js` se añadió a la lista de extensiones excluidas por un motivo medible:
// /sw.js era la ruta MÁS frecuente del middleware —11 de 46 peticiones en 24h,
// casi una cuarta parte— y cada una disparaba un `auth.getUser()` contra
// Supabase para acabar sirviendo un archivo estático del service worker. Los
// bundles de la app ya estaban cubiertos por `_next/static`; el único .js
// suelto en /public es sw.js.
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|xml|txt|json|js)$).*)',
  ],
}