import { NextRequest, NextResponse } from 'next/server'
import webpush from 'web-push'
import { createClient } from '@supabase/supabase-js'

webpush.setVapidDetails(
  `mailto:${process.env.VAPID_EMAIL}`,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

export async function POST(req: NextRequest) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    const { usuarioId, titulo, cuerpo, url } = await req.json()

    const { data: suscripciones } = await supabaseAdmin
      .from('push_suscripciones')
      .select('*')
      .eq('usuario_id', usuarioId)

    if (!suscripciones?.length) {
      return NextResponse.json({ ok: false, motivo: 'Sin suscripciones' })
    }

    const payload = JSON.stringify({ title: titulo, body: cuerpo, url })

    const resultados = await Promise.allSettled(
      suscripciones.map(sus =>
        webpush.sendNotification(
          { endpoint: sus.endpoint, keys: { p256dh: sus.p256dh, auth: sus.auth } },
          payload
        )
      )
    )

    // Limpiar suscripciones inválidas
    for (let i = 0; i < resultados.length; i++) {
      const r = resultados[i]
      if (r.status === 'rejected') {
        await supabaseAdmin
          .from('push_suscripciones')
          .delete()
          .eq('endpoint', suscripciones[i].endpoint)
      }
    }

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}