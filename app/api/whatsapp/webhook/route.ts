export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

const BREVO_API_KEY = process.env.BREVO_API_KEY!
const TWILIO_SID    = process.env.TWILIO_ACCOUNT_SID!
const TWILIO_TOKEN  = process.env.TWILIO_AUTH_TOKEN!
const WA_FROM       = process.env.TWILIO_WHATSAPP_FROM ?? ''

// ── Respuesta automática cuando alguien contesta ──────────────────────────────
async function responderWhatsApp(to: string, mensaje: string): Promise<void> {
  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`
    await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${TWILIO_SID}:${TWILIO_TOKEN}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        From: `whatsapp:${WA_FROM}`,
        To:   `whatsapp:${to}`,
        Body: mensaje,
      }).toString(),
    })
  } catch (e) {
    console.error('Error respondiendo WhatsApp:', e)
  }
}

// ── Notificar a Ivan por email ────────────────────────────────────────────────
async function notificarIvan(de: string, mensaje: string): Promise<void> {
  try {
    await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': BREVO_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sender:      { name: 'TallerOS WhatsApp', email: 'hola@tallerosapp.com' },
        to:          [{ email: 'hola@tallerosapp.com', name: 'Ivan' }],
        subject:     `💬 Respuesta de WhatsApp — ${de}`,
        htmlContent: `
          <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
            <div style="background:#25d366;padding:20px 28px;">
              <p style="margin:0;color:#fff;font-size:18px;font-weight:800;">💬 Nueva respuesta de WhatsApp</p>
            </div>
            <div style="padding:28px 32px;">
              <p style="color:#64748b;font-size:13px;margin-bottom:6px;">De:</p>
              <p style="color:#0f172a;font-size:16px;font-weight:700;margin-bottom:20px;">${de}</p>
              <p style="color:#64748b;font-size:13px;margin-bottom:6px;">Mensaje:</p>
              <div style="background:#f0fdf4;border-radius:12px;padding:16px;border:1px solid #bbf7d0;">
                <p style="color:#166534;font-size:15px;line-height:1.7;margin:0;">${mensaje}</p>
              </div>
              <div style="margin-top:20px;background:#eff6ff;border-radius:12px;padding:14px;border:1px solid #bfdbfe;">
                <p style="color:#1d4ed8;font-size:13px;margin:0;">
                  💡 Este prospecto respondió tu mensaje de TallerOS. Respóndele directamente desde tu WhatsApp al número <strong>${de}</strong> para darle seguimiento personal.
                </p>
              </div>
            </div>
          </div>`,
      }),
    })
  } catch (e) {
    console.error('Error notificando por email:', e)
  }
}

// ── Handler del webhook ───────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const de       = (formData.get('From') as string ?? '').replace('whatsapp:', '')
    const mensaje  = formData.get('Body') as string ?? ''
    const to       = formData.get('To') as string ?? ''

    console.log(`WhatsApp recibido de ${de}: ${mensaje}`)

    if (!de || !mensaje) {
      return new NextResponse('OK', { status: 200 })
    }

    const twimlOk = new NextResponse(
      `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`,
      { status: 200, headers: { 'Content-Type': 'text/xml' } }
    )

    // ── Detección de aprobación/rechazo de cotización ─────────────────────────
    const mensajeLower = mensaje.toLowerCase().trim()
    const esAprobacion = ['si', 'sí', 'yes', 'apruebo', 'acepto', 'ok', 'dale', 'claro', 'adelante'].includes(mensajeLower)
    const esRechazo    = ['no', 'nope', 'rechaz', 'cancel', 'nada'].some(p => mensajeLower === p || mensajeLower.startsWith(p))

    if (esAprobacion || esRechazo) {
      const supabase = createServiceClient()
      const digitos  = de.replace(/\D/g, '')
      const sufijo   = digitos.slice(-10)

      // Buscar cliente por teléfono (últimos 10 dígitos)
      const { data: clientes } = await supabase
        .from('clientes')
        .select('id')
        .ilike('telefono', `%${sufijo}`)

      if (clientes?.length) {
        const clienteIds = clientes.map(c => c.id)

        const { data: cotizacion } = await supabase
          .from('cotizaciones')
          .select('id, numero_cotizacion')
          .in('cliente_id', clienteIds)
          .eq('estado', 'enviada')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (cotizacion) {
          const nuevoEstado = esAprobacion ? 'aprobada' : 'rechazada'
          await supabase
            .from('cotizaciones')
            .update({ estado: nuevoEstado })
            .eq('id', cotizacion.id)

          const num = String(cotizacion.numero_cotizacion).padStart(4, '0')
          const confirmacion = esAprobacion
            ? `✅ ¡Perfecto! Tu aprobación de la cotización *#${num}* quedó registrada. Comenzamos el trabajo a la brevedad. 🔧`
            : `Entendido. La cotización *#${num}* fue cancelada. Cualquier duda, estamos a tus órdenes.`

          await responderWhatsApp(de, confirmacion)

          // Notificar al mecánico/propietario del taller
          try {
            const { data: cotFull } = await supabase
              .from('cotizaciones')
              .select('taller_id, numero_cotizacion')
              .eq('id', cotizacion.id)
              .single()
            if (cotFull?.taller_id) {
              const { data: propietario } = await supabase
                .from('usuarios')
                .select('telefono')
                .eq('taller_id', cotFull.taller_id)
                .eq('rol', 'propietario')
                .single()
              if (propietario?.telefono) {
                const tel = propietario.telefono.replace(/\D/g, '')
                const toMec = tel.length === 10 ? `+52${tel}` : `+${tel}`
                const avisoMecanico = esAprobacion
                  ? `✅ *Cotización #${num} APROBADA*\n\nEl cliente aprobó la cotización. ¡Puedes iniciar el trabajo! 🔧`
                  : `❌ *Cotización #${num} RECHAZADA*\n\nEl cliente rechazó la cotización.`
                await responderWhatsApp(toMec, avisoMecanico)
              }
            }
          } catch (e) {
            console.error('Error notificando al mecánico:', e)
          }

          return twimlOk
        }
      }
    }

    // ── Detectar intención del mensaje (prospecting)
    const interesado = ['si', 'sí', 'me interesa', 'interesa', 'info', 'información', 
                        'demo', 'precio', 'costo', 'cuanto', 'cuánto', 'como', 'cómo'].some(
      palabra => mensajeLower.includes(palabra)
    )

    if (interesado) {
      // Respuesta automática para interesados
      await responderWhatsApp(de, 
        `¡Hola! 👋 Gracias por tu interés en *TallerOS*.\n\nPuedes ver una demo completa y empezar tu prueba gratuita de 14 días aquí:\n\n👉 https://www.tallerosapp.com/registro\n\nSin tarjeta de crédito. Si tienes dudas, responde este mensaje y te contactamos en minutos. 🔧`
      )
      // Notificar a Ivan con prioridad alta
      await notificarIvan(de, `⭐ INTERESADO: ${mensaje}`)
    } else {
      // Para cualquier otro mensaje — notificar a Ivan para respuesta manual
      await notificarIvan(de, mensaje)
    }

    // Twilio espera respuesta TwiML vacía
    return new NextResponse(
      `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`,
      { status: 200, headers: { 'Content-Type': 'text/xml' } }
    )
  } catch (error: any) {
    console.error('Webhook error:', error)
    return new NextResponse(
      `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`,
      { status: 200, headers: { 'Content-Type': 'text/xml' } }
    )
  }
}

// GET para verificación de Twilio
export async function GET() {
  return new NextResponse(
    `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`,
    { status: 200, headers: { 'Content-Type': 'text/xml' } }
  )
}
