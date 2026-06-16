export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import webpush from 'web-push'

export async function POST(req: NextRequest) {
  webpush.setVapidDetails(
    `mailto:${process.env.VAPID_EMAIL}`,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  )
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    const { tallerId, clienteNombre, fecha, hora } = await req.json()

    // Obtener suscripciones push del taller
    const { data: suscripciones } = await supabaseAdmin
      .from('push_suscripciones')
      .select('endpoint, p256dh, auth')
      .eq('taller_id', tallerId)

    if (!suscripciones || suscripciones.length === 0) {
      return NextResponse.json({ ok: true, enviadas: 0 })
    }

    const fechaFormateada = new Date(fecha + 'T12:00:00').toLocaleDateString('es-MX', {
      weekday: 'short', day: 'numeric', month: 'short',
    })

    const payload = JSON.stringify({
      title: '📅 Nueva cita pendiente',
      body:  `${clienteNombre} — ${fechaFormateada} a las ${hora}`,
      url:   '/citas',
    })

    const resultados = await Promise.allSettled(
      suscripciones.map(({ endpoint, p256dh, auth }) =>
        webpush.sendNotification(
          { endpoint, keys: { p256dh, auth } },
          payload
        )
      )
    )

    const enviadas = resultados.filter(r => r.status === 'fulfilled').length
    return NextResponse.json({ ok: true, enviadas })
  } catch (error) {
    console.error('Error notificando cita:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}