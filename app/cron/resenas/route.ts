import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { createClient } from '@supabase/supabase-js'
import { enviarResenaOrden } from '@/lib/resenas'

// ── Red de seguridad: reintenta el envío de reseñas para órdenes entregadas
// en los últimos 3 días que aún no tengan un registro en resenas_enviadas
// (por ejemplo si el envío inmediato al marcar "entregado" falló) ────────────
export async function GET(request: Request) {
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const hace3Dias = new Date()
  hace3Dias.setDate(hace3Dias.getDate() - 3)
  const fecha3Dias = hace3Dias.toISOString().split('T')[0]
  const hoy = new Date().toISOString().split('T')[0]

  const { data: ordenes, error } = await supabaseAdmin
    .from('ordenes')
    .select('id, taller_id')
    .eq('estado', 'entregado')
    .gte('fecha_entrega', fecha3Dias)
    .lte('fecha_entrega', hoy)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  let enviados = 0
  let fallidos = 0

  for (const orden of ordenes ?? []) {
    const { data: yaEnviado } = await supabaseAdmin
      .from('resenas_enviadas')
      .select('id')
      .eq('orden_id', orden.id)
      .limit(1)

    if (yaEnviado?.length) continue

    try {
      const resultado = await enviarResenaOrden(orden.id, orden.taller_id)
      if (resultado.ok) enviados++
    } catch {
      fallidos++
    }
  }

  return NextResponse.json({ enviados, fallidos, total: ordenes?.length ?? 0 })
}
