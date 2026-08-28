export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getStripe } from '@/lib/stripe'
import { puedeGestionarTaller } from '@/lib/permisos'

export async function POST(req: NextRequest) {
  try {
    const stripe = getStripe()
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { data: usuario } = await supabase
      .from('usuarios')
      .select('taller_id, rol')
      .eq('id', user.id)
      .single()

    if (!usuario) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    // El middleware excluye todo /api/ de su comprobación de rol, así que tener
    // la página en RUTAS_SOLO_ADMIN no protege este endpoint: un técnico podía
    // llamarlo directo. La comprobación va donde se ejecuta la acción. Mismo
    // hueco que tenía /api/promociones.
    // Aquí pesa más que en otros sitios: el portal de Stripe deja cancelar la
    // suscripción, cambiar de plan y ver los datos de la tarjeta.
    if (!puedeGestionarTaller(usuario.rol)) {
      return NextResponse.json(
        { error: 'Solo el propietario y administradores pueden gestionar la facturación' },
        { status: 403 }
      )
    }

    const { data: suscripcion } = await supabase
      .from('suscripciones')
      .select('stripe_customer_id')
      .eq('taller_id', usuario.taller_id)
      .single()

    if (!suscripcion?.stripe_customer_id) {
      return NextResponse.json({ error: 'No tienes una suscripción activa' }, { status: 400 })
    }

    const session = await stripe.billingPortal.sessions.create({
      customer:   suscripcion.stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://tallerosapp.com'}/configuracion/plan`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Portal error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}