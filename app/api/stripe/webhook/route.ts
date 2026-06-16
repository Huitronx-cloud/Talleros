export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getStripe, PRECIOS_A_PLAN } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

export async function POST(req: NextRequest) {
  const stripe = getStripe()
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const resend = new Resend(process.env.RESEND_API_KEY!)
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
        const precioId = sub.items?.data?.[0]?.price?.id
        const plan     = PRECIOS_A_PLAN[precioId] ?? 'trial'

        const periodoInicio = sub.current_period_start
          ? new Date(sub.current_period_start * 1000).toISOString()
          : null
        const periodoFin = sub.current_period_end
          ? new Date(sub.current_period_end * 1000).toISOString()
          : null

        await supabaseAdmin
          .from('suscripciones')
          .update({
            plan,
            estado:                 'activa',
            stripe_subscription_id: subscriptionId,
            stripe_customer_id:     session.customer,
            precio_id:              precioId,
            periodo_inicio:         periodoInicio,
            periodo_fin:            periodoFin,
            trial_fin:              null,
          })
          .eq('taller_id', tallerId)

        // Obtener datos del taller para el email y Meta CAPI
        try {
          const { data: usuario } = await supabaseAdmin
            .from('usuarios')
            .select('nombre, talleres(nombre)')
            .eq('taller_id', tallerId)
            .eq('rol', 'propietario')
            .single()

          const email         = session.customer_details?.email
          const nombreUsuario = (usuario?.nombre ?? 'Propietario').split(' ')[0]
          const nombreTaller  = (usuario?.talleres as any)?.nombre ?? 'Tu taller'

          if (email) {
            await resend.emails.send({
              from:    'TallerOS <hola@tallerosapp.com>',
              to:      email,
              subject: plan === 'pro'
                ? `¡Bienvenido a TallerOS Pro, ${nombreUsuario}! 🚀`
                : `¡Bienvenido a TallerOS Esencial, ${nombreUsuario}! 🎉`,
              html: buildEmailBienvenidaPlan({ nombreUsuario, nombreTaller, plan }),
            })
          }

          // ── Meta Conversions API — Purchase event ─────────────────────────
          await trackMetaPurchase({
            email:    email ?? null,
            valor:    (session.amount_total ?? 0) / 100,
            moneda:   (session.currency ?? 'usd').toUpperCase(),
            plan,
            tallerId,
          })
        } catch (emailErr) {
          console.error('Email/Meta error (no crítico):', emailErr)
        }

        break
      }

      case 'customer.subscription.updated': {
        const sub      = event.data.object
        const tallerId = sub.metadata?.taller_id
        if (!tallerId) break

        const precioId = sub.items?.data?.[0]?.price?.id
        const plan     = PRECIOS_A_PLAN[precioId] ?? 'trial'

        const periodoInicio = sub.current_period_start
          ? new Date(sub.current_period_start * 1000).toISOString()
          : null
        const periodoFin = sub.current_period_end
          ? new Date(sub.current_period_end * 1000).toISOString()
          : null

        await supabaseAdmin
          .from('suscripciones')
          .update({
            plan,
            estado:              sub.status === 'active' ? 'activa' : 'vencida',
            precio_id:           precioId,
            periodo_inicio:      periodoInicio,
            periodo_fin:         periodoFin,
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

async function trackMetaPurchase({
  email, valor, moneda, plan, tallerId,
}: {
  email: string | null; valor: number; moneda: string; plan: string; tallerId: string
}) {
  const pixelId     = process.env.META_PIXEL_ID
  const accessToken = process.env.META_ACCESS_TOKEN
  if (!pixelId || !accessToken) return

  const { createHash } = await import('crypto')
  const hash = (s: string) => createHash('sha256').update(s.toLowerCase().trim()).digest('hex')

  const userData: Record<string, string> = {}
  if (email) userData.em = hash(email)

  const payload = {
    data: [{
      event_name:  'Purchase',
      event_time:  Math.floor(Date.now() / 1000),
      action_source: 'website',
      user_data:   userData,
      custom_data: {
        currency: moneda,
        value:    valor,
        content_name: `TallerOS ${plan}`,
        content_ids: [tallerId],
        content_type: 'product',
      },
    }],
  }

  try {
    const res = await fetch(
      `https://graph.facebook.com/v19.0/${pixelId}/events?access_token=${accessToken}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }
    )
    if (!res.ok) {
      const text = await res.text()
      console.error('Meta CAPI error:', text)
    }
  } catch (e) {
    console.error('Meta CAPI fetch error:', e)
  }
}

function buildEmailBienvenidaPlan({
  nombreUsuario,
  nombreTaller,
  plan,
}: {
  nombreUsuario: string
  nombreTaller:  string
  plan:          string
}) {
  const esPro = plan === 'pro'

  const color        = esPro ? '#7c3aed' : '#1d4ed8'
  const colorClaro   = esPro ? '#ede9fe' : '#eff6ff'
  const colorTexto   = esPro ? '#5b21b6' : '#1e40af'
  const emoji        = esPro ? '🚀' : '🎉'
  const nombrePlan   = esPro ? 'Pro' : 'Esencial'

  const features = esPro
    ? [
        ['🔧', 'Órdenes de trabajo ilimitadas'],
        ['📱', 'Aprobaciones y fotos de diagnóstico por WhatsApp'],
        ['🔔', 'Recordatorios automáticos de mantenimiento'],
        ['⭐', 'Solicitud automática de reseñas en Google'],
        ['📊', 'Reportes y métricas avanzadas'],
        ['👥', 'Usuarios ilimitados en tu equipo'],
        ['🎯', 'Soporte prioritario'],
      ]
    : [
        ['🔧', 'Órdenes de trabajo ilimitadas'],
        ['📱', 'Notificaciones básicas por WhatsApp'],
        ['👤', 'Gestión de clientes y vehículos'],
        ['🌐', 'Portal del cliente en tiempo real'],
        ['👥', 'Hasta 5 usuarios en tu equipo'],
        ['📧', 'Soporte por email'],
      ]

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,${color} 0%,${colorTexto} 100%);padding:40px;text-align:center;">
            <div style="font-size:32px;font-weight:800;color:#fff;letter-spacing:-1px;">
              Taller<span style="opacity:0.7;">OS</span>
            </div>
            <div style="display:inline-block;background:rgba(255,255,255,0.2);color:#fff;font-size:13px;font-weight:700;padding:4px 16px;border-radius:999px;margin-top:10px;">
              Plan ${nombrePlan} ${emoji}
            </div>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:40px;">
            <p style="font-size:24px;font-weight:700;color:#111827;margin:0 0 12px;">
              ¡Tomaste la mejor decisión, ${nombreUsuario}!
            </p>
            <p style="color:#6b7280;font-size:15px;line-height:1.7;margin:0 0 24px;">
              <strong style="color:#111827;">${nombreTaller}</strong> ahora opera con el plan 
              <strong style="color:${color};">TallerOS ${nombrePlan}</strong>. 
              ${esPro
                ? 'Tienes acceso a todas las herramientas para hacer crecer tu taller automáticamente y recuperar clientes sin esfuerzo.'
                : 'Tienes todo lo que necesitas para digitalizar tu taller y brindar una experiencia profesional a tus clientes.'}
            </p>

            <!-- Features -->
            <div style="background:${colorClaro};border-radius:10px;padding:24px;margin-bottom:32px;">
              <p style="font-size:14px;font-weight:700;color:${colorTexto};margin:0 0 16px;">
                Lo que tienes disponible desde hoy:
              </p>
              <table width="100%" cellpadding="0" cellspacing="0">
                ${features.map(([emoji, texto]) => `
                <tr>
                  <td style="padding:5px 0;vertical-align:top;width:28px;">
                    <span style="font-size:16px;">${emoji}</span>
                  </td>
                  <td style="padding:5px 0;color:#374151;font-size:14px;line-height:1.5;">
                    ${texto}
                  </td>
                </tr>`).join('')}
              </table>
            </div>

            <!-- CTA -->
            <table cellpadding="0" cellspacing="0" style="margin:0 auto 32px;">
              <tr>
                <td style="background:${color};border-radius:10px;box-shadow:0 4px 14px rgba(0,0,0,0.2);">
                  <a href="https://www.tallerosapp.com/dashboard"
                     style="display:inline-block;padding:16px 40px;color:#fff;font-size:16px;font-weight:700;text-decoration:none;">
                    Ir a mi taller →
                  </a>
                </td>
              </tr>
            </table>

            <p style="color:#6b7280;font-size:14px;line-height:1.7;margin:0;text-align:center;">
              Gracias por confiar en TallerOS. Estamos aquí para ayudarte a crecer. 💪
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f9fafb;padding:20px 40px;text-align:center;border-top:1px solid #f3f4f6;">
            <p style="color:#9ca3af;font-size:11px;margin:0 0 4px;">
              ¿Tienes dudas? Escríbenos a <a href="mailto:hola@tallerosapp.com" style="color:${color};">hola@tallerosapp.com</a>
            </p>
            <p style="color:#9ca3af;font-size:11px;margin:0;">
              TallerOS — Gestión inteligente para talleres mecánicos
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}