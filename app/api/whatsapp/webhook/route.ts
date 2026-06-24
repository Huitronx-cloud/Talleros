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

// ── CRM interno — registrar conversación con el lead ──────────────────────────
// Solo aplica al flujo de prospección/dudas sobre TallerOS (no a los clientes
// de los talleres, que se filtran antes por la aprobación de cotización).
async function sincronizarLeadEntrante(telefono: string, mensaje: string, nombrePerfil: string | null): Promise<string | null> {
  const supabase = createServiceClient()
  try {
    const { data: existente } = await supabase
      .from('crm_leads')
      .select('id, etapa')
      .eq('telefono', telefono)
      .maybeSingle()

    let leadId: string | null = null

    if (existente) {
      leadId = existente.id
      if (existente.etapa === 'nuevo') {
        await supabase.from('crm_leads').update({ etapa: 'contactado' }).eq('id', existente.id)
      }
    } else {
      const { data: nuevo } = await supabase
        .from('crm_leads')
        .insert({ telefono, nombre: nombrePerfil, origen: 'whatsapp_inbound', etapa: 'contactado' })
        .select('id')
        .single()
      leadId = nuevo?.id ?? null
    }

    if (leadId) {
      await supabase.from('crm_mensajes').insert({ lead_id: leadId, sentido: 'entrante', mensaje })
    }
    return leadId
  } catch (e) {
    console.error('Error sincronizando lead entrante CRM:', e)
    return null
  }
}

async function registrarMensajeSaliente(leadId: string | null, mensaje: string): Promise<void> {
  if (!leadId) return
  try {
    const supabase = createServiceClient()
    await supabase.from('crm_mensajes').insert({ lead_id: leadId, sentido: 'saliente', mensaje })
  } catch (e) {
    console.error('Error registrando mensaje saliente CRM:', e)
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
    const perfil   = formData.get('ProfileName') as string ?? null

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

        // ── Detección de aprobación/rechazo de trabajo extra en una orden ────
        const { data: ordenExtra } = await supabase
          .from('ordenes')
          .select('id, taller_id, numero_orden, servicio_extra, costo_extra, total, vehiculo_marca, vehiculo_modelo')
          .in('cliente_id', clienteIds)
          .eq('extra_estado', 'pendiente')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (ordenExtra) {
          const nuevoExtraEstado = esAprobacion ? 'aprobado' : 'rechazado'
          const nuevoTotal = esAprobacion
            ? (Number(ordenExtra.total) || 0) + (Number(ordenExtra.costo_extra) || 0)
            : ordenExtra.total

          await supabase
            .from('ordenes')
            .update({
              extra_estado: nuevoExtraEstado,
              total: nuevoTotal,
            })
            .eq('id', ordenExtra.id)

          const vehiculo = `${ordenExtra.vehiculo_marca ?? ''} ${ordenExtra.vehiculo_modelo ?? ''}`.trim()
          const confirmacionExtra = esAprobacion
            ? `✅ ¡Perfecto! Tu autorización para el trabajo adicional en tu ${vehiculo} quedó registrada. Continuamos con el servicio. 🔧`
            : `Entendido. El trabajo adicional en tu ${vehiculo} fue cancelado. Continuamos solo con lo ya acordado.`

          await responderWhatsApp(de, confirmacionExtra)

          // Notificar al mecánico/propietario del taller
          try {
            const { data: propietario } = await supabase
              .from('usuarios')
              .select('telefono')
              .eq('taller_id', ordenExtra.taller_id)
              .eq('rol', 'propietario')
              .single()
            if (propietario?.telefono) {
              const tel = propietario.telefono.replace(/\D/g, '')
              const toMec = tel.length === 10 ? `+52${tel}` : `+${tel}`
              const avisoMecanico = esAprobacion
                ? `✅ *Trabajo extra orden #${ordenExtra.numero_orden} APROBADO*\n\nEl cliente autorizó: ${ordenExtra.servicio_extra ?? ''}`
                : `❌ *Trabajo extra orden #${ordenExtra.numero_orden} RECHAZADO*\n\nEl cliente rechazó el trabajo adicional.`
              await responderWhatsApp(toMec, avisoMecanico)
            }
          } catch (e) {
            console.error('Error notificando al mecánico:', e)
          }

          return twimlOk
        }
      }
    }

    // ── CRM interno — este punto solo se alcanza si el mensaje no era una
    // aprobación/rechazo de cotización de un cliente de taller, así que
    // corresponde a un prospecto o alguien con dudas sobre TallerOS.
    const leadId = await sincronizarLeadEntrante(de, mensaje, perfil)

    // ── Detectar intención del mensaje (prospecting)
    const interesado = ['si', 'sí', 'me interesa', 'interesa', 'info', 'información',
                        'demo', 'precio', 'costo', 'cuanto', 'cuánto', 'como', 'cómo'].some(
      palabra => mensajeLower.includes(palabra)
    )

    if (interesado) {
      // Respuesta automática para interesados
      const respuesta = `¡Hola! 👋 Gracias por tu interés en *TallerOS*.\n\nPuedes ver una demo completa y empezar tu prueba gratuita de 14 días aquí:\n\n👉 https://www.tallerosapp.com/registro\n\nSin tarjeta de crédito. Si tienes dudas, responde este mensaje y te contactamos en minutos. 🔧`
      await responderWhatsApp(de, respuesta)
      await registrarMensajeSaliente(leadId, respuesta)
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

// GET para verificación de Meta WhatsApp Cloud API y Twilio
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const mode      = searchParams.get('hub.mode')
  const token     = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  if (mode === 'subscribe' && token === process.env.CRON_SECRET) {
    return new NextResponse(challenge, { status: 200 })
  }

  return new NextResponse(
    `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`,
    { status: 200, headers: { 'Content-Type': 'text/xml' } }
  )
}