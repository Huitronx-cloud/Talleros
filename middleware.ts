import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const RUTAS_PUBLICAS = ['/login', '/auth/callback', '/unirse', '/portal', '/citas']

// Rutas permitidas por rol
const RUTAS_POR_ROL: Record<string, string[]> = {
  propietario: ['*'],
  admin:       ['*'],
  tecnico: ['/ordenes', '/kanban', '/citas'],
  recepcion:   ['/dashboard', '/ordenes', '/clientes', '/cotizaciones', '/kanban', '/citas'],
}

function tieneAcceso(rol: string, pathname: string): boolean {
  const rutas = RUTAS_POR_ROL[rol] ?? []
  if (rutas.includes('*')) return true
  return rutas.some(r => pathname === r || pathname.startsWith(r + '/'))
}

export async function middleware(request: NextRequest) {
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

  // Sin sesión → login
  if (!user && !esRutaPublica) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Con sesión en login → dashboard
  if (user && pathname === '/login') {
  const { data: usuario } = await supabase
    .from('usuarios')
    .select('rol')
    .eq('id', user.id)
    .single()
  const destino = usuario?.rol === 'tecnico' ? '/ordenes' : '/dashboard'
  return NextResponse.redirect(new URL(destino, request.url))
}

  // Raíz → dashboard
  if (user && pathname === '/') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Verificar rol si está autenticado y es ruta del dashboard
  if (user && !esRutaPublica) {
    const { data: usuario } = await supabase
      .from('usuarios')
      .select('rol')
      .eq('id', user.id)
      .single()

    const rol = usuario?.rol ?? 'tecnico'

    if (!tieneAcceso(rol, pathname)) {
      return NextResponse.redirect(new URL('/ordenes', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}