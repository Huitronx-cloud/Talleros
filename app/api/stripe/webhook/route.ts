export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getStripe, PRECIOS_A_PLAN } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

/**
 * Fechas del periodo de facturación.
 *
 * Desde la versión 2025-03-31 de la API de Stripe `current_period_start/end`
 * ya no viven en la suscripción sino en cada ítem, y esta app corre sobre
 * 2026-04-22. Leerlas de `sub` devolvía `undefined` siempre, así que todas las
 * filas de `suscripciones` quedaron con `periodo_inicio` y `periodo_fin` en
 * null y nadie sabía cuándo renovaba un cliente. Se lee del ítem y se deja el
 * campo viejo como respaldo por si alguna suscripción antigua todavía lo trae.
 */
function periodo(sub: any): { inicio: string | null; fin: string | null } {
  const item = sub?.items?.data?.[0]
  const aIso = (seg: unknown) =>
    typeof seg === 'number' ? new Date(seg * 1000).toISOString() : null
  return {
    inicio: aIso(item?.current_period_start ?? sub?.current_period_start),
    fin:    aIso(item?.current_period_end   ?? sub?.current_period_end),
  }
}

/** Aviso a hola@ cuando llega un precio que el código no sabe traducir. */
async function avisarPrecioDesconocido(precioId: string, tallerId: string, decision: string) {
  console.error(`[stripe] precio desconocido ${precioId} (taller ${tallerId}) — ${decision}`)
  if (!process.env.BREVO_API_KEY) return
  try {
    await fetch('https://api.brevo.com/v3/smtp/email', {
      method:  'POST',
      headers: { 'api-key': process.env.BREVO_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sender:  { name: 'TallerOS Stripe', email: 'hola@tallerosapp.com' },
        to:      [{ email: 'hola@tallerosapp.com', name: 'Ivan' }],
        subject: `[Stripe] Precio desconocido: ${precioId}`,
        htmlContent: `<p>Stripe mandó el precio <strong>${precioId}</strong> para el taller <strong>${tallerId}</strong> y no está en <code>PRECIOS_A_PLAN</code>.</p>
          <p>Qué se hizo mientras tanto: <strong>${decision}</strong></p>
          <p>Agrega el precio a <code>lib/stripe.ts</code> y revisa la fila en <code>suscripciones</code>.</p>`,
      }),
    })
  } catch (e) {
    console.error('[stripe] no se pudo avisar del precio desconocido:', e)
  }
}

/**
 * Aplica una escritura del webhook y REVIENTA si falla.
 *
 * Las tres escrituras a `suscripciones` se hacían con un `await` suelto, sin
 * mirar el error. supabase-js no lanza: devuelve `{ error }`. Así que si el
 * update fallaba —red caída, RLS, una restricción— el webhook seguía hasta el
 * final y le respondía 200 a Stripe. Para Stripe, 200 significa "recibido y
 * procesado": no reintenta nunca más. El taller pagaba, Stripe cobraba, y la
 * fila de `suscripciones` se quedaba como estaba, para siempre y en silencio.
 * Es la misma forma de fallar que degradó a FASTCAR en julio, por otra puerta.
 *
 * Lanzando, el error cae en el `catch` que ya existe abajo y el webhook
 * responde 500 — que es lo que hace que Stripe lo vuelva a intentar.
 */
async function aplicar(
  descripcion: string,
  operacion: PromiseLike<{ error: { message: string } | null }>,
) {
  const { error } = await operacion
  if (error) {
    throw new Error(`[webhook] ${descripcion}: ${error.message}`)
  }
}

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

        // Quien llega aquí acabó de pagar. Si el precio no está en el mapa, el
        // peor default posible es 'trial': lo dejaría con los topes del plan
        // gratis después de haber pagado. Se asume 'esencial' —el plan de pago
        // más barato, nunca da de más— y se avisa para corregir el mapa.
        let plan = PRECIOS_A_PLAN[precioId]
        if (!plan) {
          plan = 'esencial'
          await avisarPrecioDesconocido(precioId, tallerId, 'se asumió el plan esencial')
        }

        const { inicio: periodoInicio, fin: periodoFin } = periodo(sub)

        await aplicar(
          `no se pudo activar el plan ${plan} del taller ${tallerId}`,
          supabaseAdmin
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
        )

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

        // Aquí es donde se rompió lo de FASTCAR: al retirar un precio del mapa,
        // el primer `updated` que llegaba —una renovación cobrada sin problema—
        // lo traducía a 'trial' y degradaba a un cliente al corriente. Un precio
        // que no se reconoce no es información para bajar a nadie de plan: se
        // conserva el plan que ya tenía y se avisa.
        let plan = PRECIOS_A_PLAN[precioId]
        if (!plan) {
          const { data: actual } = await supabaseAdmin
            .from('suscripciones')
            .select('plan')
            .eq('taller_id', tallerId)
            .single()
          plan = actual?.plan ?? 'esencial'
          await avisarPrecioDesconocido(precioId, tallerId, `se conservó el plan ${plan}`)
        }

        const { inicio: periodoInicio, fin: periodoFin } = periodo(sub)

        await aplicar(
          `no se pudo actualizar la suscripción del taller ${tallerId}`,
          supabaseAdmin
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
        )
        break
      }

      case 'customer.subscription.deleted': {
        const sub      = event.data.object
        const tallerId = sub.metadata?.taller_id
        if (!tallerId) break

        await aplicar(
          `no se pudo registrar la cancelación del taller ${tallerId}`,
          supabaseAdmin
            .from('suscripciones')
            .update({
              plan:                   'trial',
              estado:                 'cancelada',
              stripe_subscription_id: null,
            })
            .eq('taller_id', tallerId)
        )
        break
      }

      case 'invoice.payment_failed': {
        const invoice  = event.data.object
        const customer = invoice.customer

        const { data: suscripcion } = await supabaseAdmin
          .from('suscripciones')
          .update({ estado: 'vencida' })
          .eq('stripe_customer_id', customer)
          .select('taller_id')
          .single()

        // Hasta ahora esto solo marcaba la fila y se acababa: el taller se
        // enteraba únicamente si entraba a la app y veía el banner. Un dueño
        // que no entra en tres días con la tarjeta rebotando es exactamente el
        // que se pierde, así que aquí se le avisa.
        //
        // Stripe reintenta el cobro varias veces y manda un evento por intento.
        // Solo se escribe en el primero y en el último, para no convertir un
        // problema de tarjeta en cuatro correos iguales.
        const intento       = Number(invoice.attempt_count ?? 1)
        const ultimoIntento = !invoice.next_payment_attempt
        if (!suscripcion?.taller_id || (intento > 1 && !ultimoIntento)) break

        try {
          const { data: usuario } = await supabaseAdmin
            .from('usuarios')
            .select('nombre, email, talleres(nombre)')
            .eq('taller_id', suscripcion.taller_id)
            .eq('rol', 'propietario')
            .single()

          if (usuario?.email) {
            const nombreUsuario = (usuario.nombre ?? 'Hola').split(' ')[0]
            const nombreTaller  = (usuario.talleres as any)?.nombre ?? 'tu taller'
            const monto = new Intl.NumberFormat('es-MX', {
              style: 'currency',
              currency: (invoice.currency ?? 'usd').toUpperCase(),
              maximumFractionDigits: 0,
            }).format((invoice.amount_due ?? 0) / 100)

            await resend.emails.send({
              from:    'TallerOS <hola@tallerosapp.com>',
              to:      usuario.email,
              subject: ultimoIntento
                ? `${nombreUsuario}, no pudimos cobrar tu mensualidad de TallerOS`
                : `${nombreUsuario}, tu pago de TallerOS no pasó`,
              html: buildEmailPagoFallido({ nombreUsuario, nombreTaller, monto, ultimoIntento }),
            })
          }
        } catch (emailErr) {
          console.error('[stripe] no se pudo avisar del pago fallido:', emailErr)
        }
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

/**
 * Aviso de cobro rechazado.
 *
 * La idea que lo gobierna: un cobro fallido casi nunca es alguien que se quiere
 * ir — es una tarjeta vencida, un límite o un cambio de banco. Si el correo
 * suena a cobranza, se convierte en la excusa para irse. Por eso lo primero que
 * dice es que el taller no se bloquea, que es además la verdad: `getLimites`
 * mira el plan, no el estado, así que una suscripción `vencida` conserva su
 * acceso.
 */
function buildEmailPagoFallido({
  nombreUsuario,
  nombreTaller,
  monto,
  ultimoIntento,
}: {
  nombreUsuario: string
  nombreTaller:  string
  monto:         string
  ultimoIntento: boolean
}) {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

        <tr>
          <td style="background:linear-gradient(135deg,#b45309 0%,#92400e 100%);padding:32px 40px;">
            <div style="font-size:26px;font-weight:800;color:#fff;letter-spacing:-1px;">
              Taller<span style="opacity:0.7;">OS</span>
            </div>
            <div style="color:#fde68a;font-size:13px;font-weight:600;margin-top:8px;">
              Tu pago no se pudo procesar
            </div>
          </td>
        </tr>

        <tr>
          <td style="padding:36px 40px;">
            <p style="font-size:16px;color:#111827;margin:0 0 20px;line-height:1.7;">
              Hola ${nombreUsuario}, intentamos cobrar la mensualidad de
              <strong>${nombreTaller}</strong> (${monto}) y el banco no autorizó el cargo.
            </p>

            <p style="font-size:15px;color:#374151;margin:0 0 24px;line-height:1.7;">
              Casi siempre es algo simple: una tarjeta vencida, un límite del banco o
              una tarjeta que cambió de número.
            </p>

            <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:18px 20px;margin-bottom:28px;">
              <p style="margin:0;font-size:15px;color:#166534;line-height:1.6;">
                <strong>Tu taller sigue funcionando con normalidad.</strong> No bloqueamos
                nada ni se pierde información — tus órdenes, clientes e historial están
                intactos. Solo necesitamos que actualices tu método de pago.
              </p>
            </div>

            <table cellpadding="0" cellspacing="0" style="margin:0 auto 28px;">
              <tr>
                <td style="background:#1d4ed8;border-radius:10px;box-shadow:0 4px 14px rgba(0,0,0,0.2);">
                  <a href="https://www.tallerosapp.com/configuracion/plan"
                     style="display:inline-block;padding:16px 36px;color:#fff;font-size:16px;font-weight:700;text-decoration:none;">
                    Actualizar mi tarjeta →
                  </a>
                </td>
              </tr>
            </table>

            <p style="font-size:14px;color:#6b7280;margin:0 0 20px;line-height:1.7;">
              ${ultimoIntento
                ? 'Este fue el último intento de cobro automático. En cuanto actualices la tarjeta, tu plan se reactiva solo.'
                : 'Lo volveremos a intentar automáticamente en unos días. Si actualizas la tarjeta antes, no tienes que hacer nada más.'}
            </p>

            <p style="font-size:14px;color:#6b7280;margin:0;line-height:1.7;">
              ¿Algo no cuadra o prefieres pagar de otra forma? Responde este correo y lo vemos.
            </p>
          </td>
        </tr>

        <tr>
          <td style="background:#f9fafb;padding:20px 40px;text-align:center;border-top:1px solid #f3f4f6;">
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