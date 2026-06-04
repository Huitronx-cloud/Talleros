import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { cache } from 'react'

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
