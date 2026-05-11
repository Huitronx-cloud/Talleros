import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { data: usuario } = await supabase
      .from('usuarios')
      .select('taller_id')
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

    if (!suscripcion?.stripe_customer_id) {
      return NextResponse.json({ error: 'No tienes una suscripción activa' }, { status: 400 })
    }

    const session = await stripe.billingPortal.sessions.create({
      customer:   suscripcion.stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/configuracion/plan`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Portal error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}