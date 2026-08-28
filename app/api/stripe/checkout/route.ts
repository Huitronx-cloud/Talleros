export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getStripe } from '@/lib/stripe'

const PLANES_VALIDOS = [
  'price_1TyjpIRFpmo4G9XHLwyeCvth',
  'price_1TyjplRFpmo4G9XHYkBdR8hc',
  'price_1TyjqERFpmo4G9XHEjasGmnq',
  'price_1TyjqfRFpmo4G9XHL9pi6s3y',
]

export async function POST(req: NextRequest) {
  try {
    const stripe = getStripe()
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { precio_id } = await req.json()

    if (!PLANES_VALIDOS.includes(precio_id)) {
      return NextResponse.json({ error: 'Plan inválido' }, { status: 400 })
    }

    const { data: usuario } = await supabase
      .from('usuarios')
      .select('taller_id, rol, talleres(nombre)')
      .eq('id', user.id)
      .single()

    if (!usuario) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    // El middleware excluye todo /api/ de su comprobación de rol, así que tener
    // la página en RUTAS_SOLO_ADMIN no protege este endpoint: un técnico podía
    // llamarlo directo. La comprobación va donde se ejecuta la acción. Mismo
    // hueco que tenía /api/promociones.
    // Contratar un plan es comprometer al taller con un cobro recurrente.
    if (!['propietario', 'admin'].includes(usuario.rol)) {
      return NextResponse.json(
        { error: 'Solo el propietario y administradores pueden contratar un plan' },
        { status: 403 }
      )
    }

    const { data: suscripcion } = await supabase
      .from('suscripciones')
      .select('stripe_customer_id')
      .eq('taller_id', usuario.taller_id)
      .single()

    let customerId = suscripcion?.stripe_customer_id

    if (!customerId) {
      const taller = usuario.talleres as any
      const customer = await stripe.customers.create({
        email: user.email,
        name:  taller?.nombre ?? 'Taller',
        metadata: { taller_id: usuario.taller_id },
      })
      customerId = customer.id

      await supabase
        .from('suscripciones')
        .update({ stripe_customer_id: customerId })
        .eq('taller_id', usuario.taller_id)
    }

    const session = await stripe.checkout.sessions.create({
      customer:             customerId,
      mode:                 'subscription',
      payment_method_types: ['card'],
      // Sin esto Stripe adivina el idioma por el navegador, y de esa
      // adivinanza dependen dos cosas: la página de pago y el correo de
      // recuperación que Stripe manda cuando alguien abandona. Los tres
      // carritos abandonados que tenemos son de talleres mexicanos; no hay
      // motivo para dejar su idioma al azar.
      locale:               'es-419',
      line_items: [{ price: precio_id, quantity: 1 }],
      metadata: { taller_id: usuario.taller_id },
      subscription_data: {
        metadata: { taller_id: usuario.taller_id },
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://tallerosapp.com'}/dashboard?upgrade=success`,
      cancel_url:  `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://tallerosapp.com'}/configuracion/plan?upgrade=cancelled`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    console.error('Stripe checkout error:', error)

    // 'Error interno' dejaba al cliente sin la menor pista: FASTCAR lo intentó
    // 15 veces sin saber nunca por qué fallaba, y desde la pantalla no había
    // forma de distinguirlo de una caída del servidor. Los rechazos de Stripe
    // que son culpa de la configuración de la cuenta se traducen a algo que se
    // pueda leer y accionar.
    if (typeof error?.message === 'string' && error.message.includes('combine currencies')) {
      return NextResponse.json({
        error: 'Tu cuenta ya tiene una suscripción en otra moneda. Escríbenos a hola@tallerosapp.com y lo resolvemos hoy mismo — no pierdes el acceso.',
      }, { status: 409 })
    }

    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}