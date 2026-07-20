import { createClient } from '@supabase/supabase-js'

// Cliente de solo-lectura para las páginas y APIs públicas (blog).
//
// Fuerza `cache: 'no-store'` en CADA request a Supabase. Sin esto, Next.js
// guarda el resultado del fetch en su Data Cache — que vive en la
// infraestructura de Vercel y SOBREVIVE a los redeploys — y el blog se queda
// congelado mostrando artículos viejos aunque la base ya tenga nuevos (pasó:
// quedó pegado en el 09/07 pese a que la base tenía artículos hasta el 15/07,
// y ni redeployar limpio lo movía). `force-dynamic` por sí solo no bastó.
export function createPublicReadClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { persistSession: false },
      global: {
        fetch: (input: RequestInfo | URL, init?: RequestInit) =>
          fetch(input, { ...init, cache: 'no-store' }),
      },
    }
  )
}
