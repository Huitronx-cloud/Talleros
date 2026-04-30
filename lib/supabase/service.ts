import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Cliente con service role — bypasa RLS. Solo usar en cron jobs server-side.
export function createServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
