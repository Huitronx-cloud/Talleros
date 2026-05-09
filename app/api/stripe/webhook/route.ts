import { NextRequest, NextResponse } from 'next/server'
import { stripe, PRECIOS_A_PLAN } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const body      = await req.text()
  const signature = req.headers.get('stripe-signature')!

  let event: any

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('Webhook signature error:', err)
    return NextResponse.json({ error: 'Firma inválida' }, { status: 400 })
  }

  try {
    switch (event.type) {

      case 'checkout.session.completed': {
        const session        = event.data.object
        const tallerId       = session.metadata?.taller_id
        const subscriptionId = session.subscription

        if (!tallerId || !subscriptionId) break

        const sub      = await stripe.subscriptions.retrieve(subscriptionId) as any
        const precioId = sub.items.data[0].price.id
        const plan     = PRECIOS_A_PLAN[precioId] ?? 'trial'

        await supabaseAdmin
          .from('suscripciones')
          .update({
            plan,
            estado:                 'activa',
            stripe_subscription_id: subscriptionId,
            stripe_customer_id:     session.customer,
            precio_id:              precioId,
            periodo_inicio:         new Date(sub.current_period_start * 1000).toISOString(),
            periodo_fin:            new Date(sub.current_period_end   * 1000).toISOString(),
            trial_fin:              null,
          })
          .eq('taller_id', tallerId)
        break
      }

      case 'customer.subscription.updated': {
        const sub      = event.data.object
        const tallerId = sub.metadata?.taller_id
        if (!tallerId) break

        const precioId = sub.items.data[0].price.id
        const plan     = PRECIOS_A_PLAN[precioId] ?? 'trial'

        await supabaseAdmin
          .from('suscripciones')
          .update({
            plan,
            estado:              sub.status === 'active' ? 'activa' : 'vencida',
            precio_id:           precioId,
            periodo_inicio:      new Date(sub.current_period_start * 1000).toISOString(),
            periodo_fin:         new Date(sub.current_period_end   * 1000).toISOString(),
            cancelar_al_periodo: sub.cancel_at_period_end,
          })
          .eq('taller_id', tallerId)
        break
      }

      case 'customer.subscription.deleted': {
        const sub      = event.data.object
        const tallerId = sub.metadata?.taller_id
        if (!tallerId) break

        await supabaseAdmin
          .from('suscripciones')
          .update({
            plan:                   'trial',
            estado:                 'cancelada',
            stripe_subscription_id: null,
          })
          .eq('taller_id', tallerId)
        break
      }

      case 'invoice.payment_failed': {
        const invoice  = event.data.object
        const customer = invoice.customer

        await supabaseAdmin
          .from('suscripciones')
          .update({ estado: 'vencida' })
          .eq('stripe_customer_id', customer)
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json({ error: 'Error procesando webhook' }, { status: 500 })
  }
}