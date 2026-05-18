import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'

export async function GET(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const { data: usuario } = await supabase
      .from('usuarios')
      .select('taller_id')
      .eq('id', user.id)
      .single()

    if (!usuario) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })

    const { data: suscripcion } = await supabase
      .from('suscripciones')
      .select('stripe_customer_id, stripe_subscription_id')
      .eq('taller_id', usuario.taller_id)
      .single()

    if (!suscripcion?.stripe_customer_id) {
      return NextResponse.json({ tarjeta: null })
    }

    // Obtener método de pago del cliente
    const paymentMethods = await stripe.paymentMethods.list({
      customer: suscripcion.stripe_customer_id,
      type:     'card',
    })

    const pm = paymentMethods.data[0]
    if (!pm?.card) return NextResponse.json({ tarjeta: null })

    const { brand, last4, exp_month, exp_year } = pm.card

    // Calcular si está por vencer (menos de 60 días)
    const hoy        = new Date()
    const vencimiento = new Date(exp_year, exp_month - 1, 1)
    const diasRestantes = Math.floor((vencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
    const porVencer  = diasRestantes <= 60 && diasRestantes >= 0
    const vencida    = diasRestantes < 0

    return NextResponse.json({
      tarjeta: {
        brand,
        last4,
        exp_month: String(exp_month).padStart(2, '0'),
        exp_year:  String(exp_year).slice(-2),
        porVencer,
        vencida,
        diasRestantes,
      }
    })
  } catch (error) {
    console.error('Tarjeta error:', error)
    return NextResponse.json({ tarjeta: null })
  }
}