import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const supabase = createClient()

  // Fecha de mañana
  const manana = new Date()
  manana.setDate(manana.getDate() + 1)
  const fechaManana = manana.toISOString().split('T')[0]

  const { data: citas, error } = await supabase
    .from('citas')
    .select('*, talleres(nombre, telefono)')
    .eq('fecha', fechaManana)
    .eq('estado', 'confirmada')
    .eq('recordatorio_enviado', false)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const resultados = await Promise.allSettled(
    (citas ?? []).map(async (cita: any) => {
      const taller = cita.talleres
      const mensaje = `Hola ${cita.cliente_nombre} 👋\n\nTe recordamos que mañana tienes una cita en *${taller?.nombre ?? 'el taller'}*.\n\n📅 Fecha: ${new Date(cita.fecha + 'T12:00:00').toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}\n⏰ Hora: ${cita.hora.slice(0, 5)}\n\nSi necesitas cancelar o reagendar, contáctanos por WhatsApp. ¡Te esperamos!`

      // Enviar WhatsApp via Twilio
      const telefono = cita.cliente_telefono.replace(/\D/g, '')
      if (!telefono) return

      const { data: talleres } = await supabase
        .from('talleres')
        .select('id')
        .eq('id', cita.taller_id)
        .single()

      await fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? 'https://tallerosapp.com'}/api/notificaciones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tallerId:  cita.taller_id,
          clienteId: null,
          ordenId:   null,
          telefono:  cita.cliente_telefono,
          tipo:      'recordatorio',
          mensaje,
        }),
      })

      await supabase
        .from('citas')
        .update({ recordatorio_enviado: true })
        .eq('id', cita.id)
    })
  )

  const enviados = resultados.filter(r => r.status === 'fulfilled').length
  const fallidos = resultados.filter(r => r.status === 'rejected').length

  return NextResponse.json({ enviados, fallidos, total: citas?.length ?? 0 })
}