import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

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

const RUTAS_PUBLICAS = [
  '/',
  '/privacidad',
  '/terminos',
  '/login',
  '/auth/callback',
  '/unirse',
  '/portal',
  '/citas',
  '/registro',
  '/api/talleres/registro',
  '/recuperar-password',
  '/nueva-password',
  '/api/stripe/webhook',
  '/api/stripe',
  '/api/funnel',
  '/api/whatsapp',
  '/api/google/callback',
  '/api/geo',
  '/api/stats',
  '/guia',
  '/mexico',
  '/colombia',
  '/peru',
  '/sitemap.xml',
  '/robots.txt',
]

const RUTAS_POST_REGISTRO = ['/onboarding'] // ← NUEVO: sesión sí, onboarding no requerido

const RUTAS_POR_ROL: Record<string, string[]> = {
  propietario: ['*'],
  admin:       ['*'],
  tecnico:     ['/ordenes', '/kanban', '/citas'],
  recepcion:   ['/dashboard', '/ordenes', '/clientes', '/cotizaciones', '/kanban', '/citas'],
}

function tieneAcceso(rol: string, pathname: string): boolean {
  const rutas = RUTAS_POR_ROL[rol] ?? []
  if (rutas.includes('*')) return true
  return rutas.some(r => pathname === r || pathname.startsWith(r + '/'))
}

export async function middleware(request: NextRequest) {
  // ── CORS check primero ────────────────────────────────────────────────────
  const corsResponse = handleCORS(request)
  if (corsResponse) return corsResponse

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
  const { pathname } = request.nextUrl

  const esRutaPublica = RUTAS_PUBLICAS.some(r => pathname.startsWith(r))
  const esRutaPostRegistro = RUTAS_POST_REGISTRO.some(r => pathname.startsWith(r))

  // Sin sesión → login
  if (!user && !esRutaPublica && !esRutaPostRegistro) {
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
  if (user && !esRutaPublica && !esRutaPostRegistro) {
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

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|xml|txt|json)$).*)',
  ],
}