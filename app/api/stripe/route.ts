import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-04-22.dahlia',
})

export async function POST(req: NextRequest) {
  try {
    const { tallerId, plan, moneda } = await req.json()

    const prices = {
      basico: {
        MXN: 29900,
        COP: 4500000,
      },
      pro: {
        MXN: 59900,
        COP: 9000000,
      },
      multi: {
        MXN: 99900,
        COP: 15000000,
      },
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      currency: moneda.toLowerCase(),
      line_items: [
        {
          price_data: {
            currency: moneda.toLowerCase(),
            product_data: {
              name: `TallerOS Plan ${plan}`,
            },
            unit_amount: prices[plan as keyof typeof prices][moneda as 'MXN' | 'COP'],
            recurring: {
              interval: 'month',
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        tallerId,
        plan,
      },
      success_url: `${process.env.NEXT_PUBLIC_URL}/dashboard?pago=exitoso`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL}/precios`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Error Stripe:', error)
    return NextResponse.json(
      { error: 'Error procesando pago' },
      { status: 500 }
    )
  }
}