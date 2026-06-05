import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
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

  return NextResponse.json({
    hoy:     hoy_count     ?? 0,
    semana:  semana_count  ?? 0,
    total:   total_count   ?? 0,
    ordenes: ordenes_count ?? 0,
  })
}