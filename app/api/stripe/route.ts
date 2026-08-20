export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getStripe, PLANES } from '@/lib/stripe'

export async function POST(req: NextRequest) {
  try {
    const stripe = getStripe()
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { precio_id } = await req.json()

    if (!Object.values(PLANES).includes(precio_id)) {
      return NextResponse.json({ error: 'Plan inválido' }, { status: 400 })
    }

    // Obtener datos del taller y suscripción
    const { data: usuario } = await supabase
      .from('usuarios')
      .select('taller_id, talleres(nombre, email)')
      .eq('id', user.id)
      .single()

    if (!usuario) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    const { data: suscripcion } = await supabase
      .from('suscripciones')
      .select('stripe_customer_id')
      .eq('taller_id', usuario.taller_id)
      .single()

    // Crear o reutilizar customer en Stripe
    let customerId = suscripcion?.stripe_customer_id

    if (!customerId) {
      const taller = usuario.talleres as any
      const customer = await stripe.customers.create({
        email: taller?.email ?? user.email,
        name:  taller?.nombre ?? 'Taller',
        metadata: { taller_id: usuario.taller_id },
      })
      customerId = customer.id

      await supabase
        .from('suscripciones')
        .update({ stripe_customer_id: customerId })
        .eq('taller_id', usuario.taller_id)
    }

    // Crear sesión de Stripe Checkout
    const session = await stripe.checkout.sessions.create({
      customer:             customerId,
      mode:                 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: precio_id, quantity: 1 }],
      // El metadata de la sesión no es opcional: el webhook lee
      // `session.metadata.taller_id` en checkout.session.completed y si no está
      // corta sin escribir nada. Sin esta línea, quien pagaba desde /precios
      // pagaba de verdad en Stripe y seguía en el plan gratis dentro de la app.
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
    if (typeof error?.message === 'string' && error.message.includes('combine currencies')) {
      return NextResponse.json({
        error: 'Tu cuenta ya tiene una suscripción en otra moneda. Escríbenos a hola@tallerosapp.com y lo resolvemos hoy mismo — no pierdes el acceso.',
      }, { status: 409 })
    }
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}