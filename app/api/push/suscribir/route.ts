export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const { data: usuario } = await supabase
      .from('usuarios')
      .select('taller_id')
      .eq('id', user.id)
      .single()

    if (!usuario) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })

    const { endpoint, keys } = await req.json()

    // El error se mira. Antes esto era un `await` suelto seguido de un
    // `{ ok: true }` incondicional: si el guardado fallaba, la pantalla decía
    // que las notificaciones quedaban activadas y no llegaba ninguna. El
    // usuario no tiene forma de distinguirlo de "es que no hay avisos todavía".
    const { error } = await supabase
      .from('push_suscripciones')
      .upsert({
        usuario_id: user.id,
        taller_id:  usuario.taller_id,
        endpoint,
        p256dh:     keys.p256dh,
        auth:       keys.auth,
      }, { onConflict: 'usuario_id, endpoint' })

    if (error) {
      console.error('[push] no se pudo guardar la suscripción:', error.message)
      return NextResponse.json(
        { error: 'No se pudieron activar las notificaciones. Intenta de nuevo.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}