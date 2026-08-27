import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { cache } from 'react'
import { COOKIE_CONTEXTO, leerContexto } from '@/lib/sesion-cookie'

export function createClient() {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Component — las cookies se gestionan en middleware
          }
        },
      },
    }
  )
}

// Deduplica auth.getUser() dentro del mismo render pass del servidor.
// Layout y pages que la llamen en el mismo request solo hacen 1 roundtrip.
export const getAuthUser = cache(async () => {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
})

/**
 * El `taller_id` del usuario de la sesión, sin ir a la base si se puede evitar.
 *
 * Cada pantalla del panel empezaba con la misma consulta a `usuarios` para
 * sacar este valor. Es un viaje de red completo —la función corre en Virginia,
 * Supabase está en Oregón— y devuelve siempre lo mismo durante toda la sesión.
 * En un teléfono se nota: era uno de los cuatro saltos en serie que había entre
 * tocar "Clientes" y ver el primer cliente.
 *
 * Orden de búsqueda:
 *   1. La cookie que escribe el middleware, que ya resolvió esto para su propia
 *      comprobación de rol. Cero red.
 *   2. La base, como siempre. Pasa en la primera navegación de la sesión, al
 *      expirar la cookie a la hora, y en cualquier ruta por la que el middleware
 *      no haya pasado.
 *
 * `cache()` la envuelve para que, si layout y página la piden en el mismo
 * request, el camino 2 tampoco se pague dos veces.
 *
 * Devuelve null si no hay sesión o si el usuario no tiene taller.
 *
 * Seguridad: esto NO es lo que aísla un taller de otro — de eso se encarga la
 * RLS con `get_my_taller_id()`, que sale de la sesión y no de esta cookie. Ver
 * `lib/sesion-cookie.ts`. Y para decidir permisos por rol, consultar la base:
 * el rol de la cookie puede tener hasta una hora de antigüedad.
 */
export const getTallerId = cache(async (): Promise<string | null> => {
  const user = await getAuthUser()
  if (!user) return null

  const contexto = leerContexto(cookies().get(COOKIE_CONTEXTO)?.value, user.id)
  if (contexto) return contexto.tallerId

  const supabase = createClient()
  const { data, error } = await supabase
    .from('usuarios')
    .select('taller_id')
    .eq('id', user.id)
    .single()

  // El error se distingue del "no hay fila": una consulta caída y un usuario
  // sin taller son cosas distintas, aunque las dos acaben en null. Sin esto,
  // una avería de red se lee como "este usuario no tiene taller".
  if (error) {
    console.error('[getTallerId] no se pudo leer el taller del usuario:', error.message)
    return null
  }

  return data?.taller_id ?? null
})
