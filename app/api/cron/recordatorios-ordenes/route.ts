import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { createClient } from '@supabase/supabase-js'
import { mensajeRecordatorioMantenimiento } from '@/lib/notificaciones'
import { encolarMensajeWhatsApp } from '@/lib/mensajes-pendientes'

// Recordatorios programados por orden (ordenes.recordatorio_fecha).
// Canal migrado a wa.me: se ENCOLA en mensajes_pendientes y el taller lo
// envía con un tap — este cron ya no manda nada por Twilio.
const LIMITE_POR_EJECUCION = 50

export async function GET(request: Request) {
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  // Service role: el cron corre sin sesión y además inserta en
  // mensajes_pendientes (solo insertable con service role por RLS).
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const hoy = new Date().toISOString().split('T')[0]

  const { data: ordenes, error, count } = await supabase
    .from('ordenes')
    .select('id, taller_id, cliente_id, vehiculo_marca, vehiculo_modelo, clientes(nombre, telefono)', { count: 'exact' })
    .lte('recordatorio_fecha', hoy)
    .eq('recordatorio_enviado', false)
    .eq('estado', 'entregado')
    .not('recordatorio_fecha', 'is', null)
    .order('recordatorio_fecha', { ascending: true })
    .limit(LIMITE_POR_EJECUCION)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const pendientesRestantes = Math.max(0, (count ?? 0) - (ordenes?.length ?? 0))

  const resultados = await Promise.allSettled(
    (ordenes ?? []).map(async (orden) => {
      const { data: taller } = await supabase
        .from('talleres')
        .select('nombre, pais')
        .eq('id', orden.taller_id)
        .single()

      const cliente = (Array.isArray(orden.clientes) ? orden.clientes[0] : orden.clientes) as { nombre: string; telefono: string | null } | null
      if (!cliente?.telefono) {
        // Sin teléfono no hay nada que encolar; se marca para no reintentar cada día
        await supabase.from('ordenes').update({ recordatorio_enviado: true }).eq('id', orden.id)
        return
      }

      const mensaje = mensajeRecordatorioMantenimiento({
        nombre: cliente.nombre,
        marca: orden.vehiculo_marca,
        modelo: orden.vehiculo_modelo,
        tallerNombre: taller?.nombre ?? 'el taller',
      })

      const ok = await encolarMensajeWhatsApp(supabase, {
        tallerId:   orden.taller_id,
        clienteId:  orden.cliente_id,
        tipo:       'recordatorio',
        telefono:   cliente.telefono,
        mensaje,
        paisTaller: taller?.pais ?? null,
      })
      if (!ok) throw new Error('No se pudo encolar')

      await supabase
        .from('ordenes')
        .update({ recordatorio_enviado: true })
        .eq('id', orden.id)
    })
  )

  const encolados = resultados.filter(r => r.status === 'fulfilled').length
  const fallidos  = resultados.filter(r => r.status === 'rejected').length

  console.log(`[cron recordatorios-ordenes] encolados=${encolados} fallidos=${fallidos} pendientes_restantes=${pendientesRestantes}`)
  return NextResponse.json({ encolados, fallidos, total: ordenes?.length ?? 0, pendientes_restantes: pendientesRestantes })
}
