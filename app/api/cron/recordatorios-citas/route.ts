import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
export const revalidate = 0
import { createPublicReadClient } from '@/lib/supabase-public'
import { encolarMensajeWhatsApp } from '@/lib/mensajes-pendientes'

// Recordatorio de citas confirmadas para mañana.
// Canal migrado a wa.me: se ENCOLA en mensajes_pendientes en vez de enviar
// por Twilio (antes hacía POST a /api/notificaciones).
const LIMITE_POR_EJECUCION = 50

export async function GET(request: Request) {
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  // Service role: el cron corre sin sesión y además inserta en
  // mensajes_pendientes (solo insertable con service role por RLS).
  const supabase = createPublicReadClient()

  // Fecha de mañana
  const manana = new Date()
  manana.setDate(manana.getDate() + 1)
  const fechaManana = manana.toISOString().split('T')[0]

  const { data: citas, error, count } = await supabase
    .from('citas')
    .select('*, talleres(nombre, pais)', { count: 'exact' })
    .eq('fecha', fechaManana)
    .eq('estado', 'confirmada')
    .eq('recordatorio_enviado', false)
    .limit(LIMITE_POR_EJECUCION)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const pendientesRestantes = Math.max(0, (count ?? 0) - (citas?.length ?? 0))

  const resultados = await Promise.allSettled(
    (citas ?? []).map(async (cita: any) => {
      const taller = cita.talleres
      const mensaje = `Hola ${cita.cliente_nombre} 👋\n\nTe recordamos que mañana tienes una cita en *${taller?.nombre ?? 'el taller'}*.\n\n📅 Fecha: ${new Date(cita.fecha + 'T12:00:00').toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}\n⏰ Hora: ${cita.hora.slice(0, 5)}\n\nSi necesitas cancelar o reagendar, contáctanos por WhatsApp. ¡Te esperamos!`

      const telefono = (cita.cliente_telefono ?? '').replace(/\D/g, '')
      if (!telefono) {
        // Sin teléfono no hay nada que encolar; se marca para no reintentar
        await supabase.from('citas').update({ recordatorio_enviado: true }).eq('id', cita.id)
        return
      }

      const ok = await encolarMensajeWhatsApp(supabase, {
        tallerId:   cita.taller_id,
        clienteId:  null,
        tipo:       'cita',
        telefono:   cita.cliente_telefono,
        mensaje,
        paisTaller: taller?.pais ?? null,
      })
      if (!ok) throw new Error('No se pudo encolar')

      await supabase
        .from('citas')
        .update({ recordatorio_enviado: true })
        .eq('id', cita.id)
    })
  )

  const encolados = resultados.filter(r => r.status === 'fulfilled').length
  const fallidos  = resultados.filter(r => r.status === 'rejected').length

  console.log(`[cron recordatorios-citas] encolados=${encolados} fallidos=${fallidos} pendientes_restantes=${pendientesRestantes}`)
  return NextResponse.json({ encolados, fallidos, total: citas?.length ?? 0, pendientes_restantes: pendientesRestantes })
}
