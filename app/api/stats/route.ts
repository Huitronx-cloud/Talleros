export const dynamic = 'force-dynamic'
export const revalidate = 0
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Conteos que la landing muestra como prueba social.
//
// Antes este endpoint exigía Bearer CRON_SECRET, pero quien lo llama es el
// navegador del visitante y nunca manda ese header: respondía 401 siempre, así
// que el contador del hero no se pintaba nunca y el bloque de prueba social
// caía a un número fijo escrito en el código.
//
// Ahora los conteos de talleres son públicos (es justo lo que la web presume)
// y el total de órdenes se queda detrás del secreto: revela volumen de
// operación y la landing no lo necesita.
export async function GET(req: import('next/server').NextRequest) {
  const esInterno = req.headers.get('authorization') === `Bearer ${process.env.CRON_SECRET}`

  const supabaseAdmin = createClient(
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

  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)

  const semana = new Date()
  semana.setDate(semana.getDate() - 7)

  const [
    { count: hoy_count },
    { count: semana_count },
    { count: total_count },
    { count: ordenes_count },
  ] = await Promise.all([
    supabaseAdmin.from('talleres').select('*', { count: 'exact', head: true }).gte('created_at', hoy.toISOString()),
    supabaseAdmin.from('talleres').select('*', { count: 'exact', head: true }).gte('created_at', semana.toISOString()),
    supabaseAdmin.from('talleres').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('ordenes').select('*', { count: 'exact', head: true }),
  ])

  const publico = {
    total:  total_count  ?? 0,
    hoy:    hoy_count    ?? 0,
    semana: semana_count ?? 0,
  }

  return NextResponse.json(
    esInterno ? { ...publico, ordenes: ordenes_count ?? 0 } : publico,
    { headers: { 'Cache-Control': 'no-store' } }
  )
}
