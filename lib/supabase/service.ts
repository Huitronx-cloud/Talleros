import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Cliente con service role — bypasa RLS. Solo usar en cron jobs server-side.
//
// cache: 'no-store' en cada request: Next cachea los fetch de supabase-js en su
// Data Cache, que sobrevive a los redeploys. Sin esto, un cron que lee "qué
// falta enviar" se queda con una foto vieja y reenvía lo mismo todos los días
// (es lo que pasó con los scripts por email y con el blog congelado).
export function createServiceClient() {
  return createSupabaseClient(
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
