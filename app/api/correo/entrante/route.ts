export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

// ── Entrada de correo de soporte ─────────────────────────────────────────────
// Brevo Inbound Parsing recibe lo que se reenvía desde hola@tallerosapp.com y
// lo publica aquí. El objetivo de este endpoint no es contestar por nosotros:
// es que ningún mensaje se quede en silencio mientras alguien lo lee.
//
// Hace tres cosas y ninguna más:
//   1. Guarda el correo, para que exista fuera de un buzón.
//   2. Acusa recibo al cliente en el momento.
//   3. Avisa al dueño por WhatsApp (y por SMS si el WhatsApp no entra).
//
// Lo que deliberadamente NO hace: responder la solicitud. Los dos reportes de
// esta semana necesitaron cruzar Stripe, Vercel y la base para entenderse. Un
// bot habría contestado con seguridad algo equivocado, que es peor que tardar.

const AVISO_A = '+16476791091'

type CorreoNormalizado = {
  de_email:   string
  de_nombre:  string | null
  asunto:     string
  cuerpo:     string
  message_id: string | null
}

/**
 * Brevo manda `{ items: [...] }`, pero el formato exacto varía entre versiones
 * y otros proveedores publican el objeto plano. Se aceptan las dos formas y se
 * leen las claves en varias capitalizaciones: si esto falla, el correo se
 * pierde sin que nadie lo note, que es justo lo que se quiere evitar.
 */
function normalizar(payload: any): CorreoNormalizado | null {
  const item = payload?.items?.[0] ?? payload
  if (!item) return null

  const from = item.From ?? item.from ?? item.sender ?? {}
  const email = (typeof from === 'string' ? from : from.Address ?? from.address ?? from.email) ?? ''
  if (!email) return null

  const cuerpo =
    item.RawTextBody ?? item.rawTextBody ?? item.text ??
    item.RawHtmlBody ?? item.rawHtmlBody ?? item.html ?? ''

  return {
    de_email:   String(email).toLowerCase().trim(),
    de_nombre:  (typeof from === 'string' ? null : from.Name ?? from.name) ?? null,
    asunto:     String(item.Subject ?? item.subject ?? '(sin asunto)').slice(0, 500),
    cuerpo:     String(cuerpo).slice(0, 20_000),
    message_id: item.MessageId ?? item.messageId ?? item.Uuid ?? null,
  }
}

/**
 * Un acuse automático que contesta a otro acuse automático es un bucle de
 * correo, y cada vuelta cuesta envíos y reputación de dominio. Estas son las
 * tres puertas por las que se cuela ese bucle.
 */
function esAutomatico(c: CorreoNormalizado): boolean {
  if (c.de_email.endsWith('@tallerosapp.com')) return true
  if (/^(no-?reply|noreply|mailer-daemon|postmaster|bounce)/i.test(c.de_email)) return true
  return /^(re:\s*)?(auto|automatic reply|out of office|fuera de la oficina|respuesta autom)/i
    .test(c.asunto)
}

async function avisarAlDueno(c: CorreoNormalizado): Promise<boolean> {
  const sid   = process.env.TWILIO_ACCOUNT_SID
  const token = process.env.TWILIO_AUTH_TOKEN
  if (!sid || !token) return false

  const texto =
    `📥 Correo nuevo en hola@\n\n` +
    `De: ${c.de_nombre ? `${c.de_nombre} <${c.de_email}>` : c.de_email}\n` +
    `Asunto: ${c.asunto}\n\n` +
    `${c.cuerpo.replace(/\s+/g, ' ').slice(0, 300)}${c.cuerpo.length > 300 ? '…' : ''}`

  const enviar = async (from: string, to: string): Promise<boolean> => {
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization:  `Basic ${Buffer.from(`${sid}:${token}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ From: from, To: to, Body: texto }),
      }
    )
    if (!res.ok) console.error('[correo entrante] Twilio', from, await res.text().catch(() => ''))
    return res.ok
  }

  // WhatsApp primero, pero no se puede confiar en él para esto: fuera de la
  // ventana de 24 horas Twilio rechaza el mensaje con el error 63016, y estos
  // avisos llegan justamente cuando llevas días sin escribirle al número. Por
  // eso el SMS no es un respaldo decorativo — es el que va a funcionar casi
  // siempre. Se configura con TWILIO_SMS_FROM.
  const wa = process.env.TWILIO_WHATSAPP_FROM
  if (wa) {
    const from = wa.startsWith('whatsapp:') ? wa : `whatsapp:${wa}`
    if (await enviar(from, `whatsapp:${AVISO_A}`)) return true
  }

  const sms = process.env.TWILIO_SMS_FROM
  if (sms) return await enviar(sms, AVISO_A)

  return false
}

function emailAcuse(nombre: string | null, asunto: string): string {
  const saludo = nombre ? `Hola ${nombre.split(' ')[0]}` : 'Hola'
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:linear-gradient(135deg,#1e3a5f,#1d4ed8);padding:28px 36px;">
            <div style="font-size:24px;font-weight:800;color:#fff;letter-spacing:-1px;">
              Taller<span style="opacity:0.7;">OS</span>
            </div>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 36px;">
            <p style="font-size:16px;color:#111827;margin:0 0 18px;line-height:1.7;">
              ${saludo}, recibimos tu mensaje.
            </p>
            <div style="background:#f8fafc;border-left:3px solid #cbd5e1;padding:12px 16px;margin-bottom:20px;">
              <p style="margin:0;font-size:14px;color:#475569;">${asunto}</p>
            </div>
            <p style="font-size:15px;color:#374151;margin:0 0 18px;line-height:1.7;">
              Ya está en nuestras manos y lo estamos revisando. Te respondemos hoy mismo,
              y si es algo que requiere revisar tu cuenta a fondo, te vamos contando cómo va.
            </p>
            <p style="font-size:15px;color:#374151;margin:0;line-height:1.7;">
              No necesitas hacer nada más. Si mientras tanto se te ocurre algún dato que
              nos ayude —una captura, el nombre de tu taller, a qué hora te pasó—
              respóndele a este mismo correo.
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:#f9fafb;padding:18px 36px;text-align:center;border-top:1px solid #f3f4f6;">
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

export async function POST(req: NextRequest) {
  if (req.nextUrl.searchParams.get('token') !== process.env.CORREO_ENTRANTE_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const correo = normalizar(await req.json().catch(() => null))
  if (!correo) {
    console.error('[correo entrante] no se pudo interpretar el payload')
    return NextResponse.json({ error: 'Payload no reconocido' }, { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Emparejar con un taller por el correo de quien escribe. Si no coincide con
  // ningún usuario, la fila se guarda igual: puede ser alguien que todavía no
  // se registra, y ese correo interesa tanto como el de un cliente.
  const { data: usuario } = await supabase
    .from('usuarios')
    .select('taller_id')
    .eq('email', correo.de_email)
    .maybeSingle()

  const { data: fila, error: errorInsert } = await supabase
    .from('soporte_correos')
    .insert({
      de_email:   correo.de_email,
      de_nombre:  correo.de_nombre,
      asunto:     correo.asunto,
      cuerpo:     correo.cuerpo,
      taller_id:  usuario?.taller_id ?? null,
      message_id: correo.message_id,
    })
    .select('id')
    .single()

  // 23505 = message_id repetido: el webhook reintentó uno que ya guardamos.
  // No es un error, y devolver 200 evita que Brevo siga reintentando.
  if (errorInsert?.code === '23505') {
    return NextResponse.json({ ok: true, duplicado: true })
  }
  if (errorInsert) {
    console.error('[correo entrante] no se pudo guardar:', errorInsert.message)
    return NextResponse.json({ error: errorInsert.message }, { status: 500 })
  }

  if (esAutomatico(correo)) {
    return NextResponse.json({ ok: true, id: fila.id, automatico: true })
  }

  // El acuse y el aviso son independientes: que falle uno no puede impedir el
  // otro. Se registra cuál salió, porque fallan por motivos distintos.
  const [acuse, aviso] = await Promise.all([
    (async () => {
      if (!process.env.RESEND_API_KEY) return false
      try {
        await new Resend(process.env.RESEND_API_KEY).emails.send({
          from:    'TallerOS <hola@tallerosapp.com>',
          to:      correo.de_email,
          subject: `Recibimos tu mensaje — ${correo.asunto}`.slice(0, 120),
          html:    emailAcuse(correo.de_nombre, correo.asunto),
        })
        return true
      } catch (e) {
        console.error('[correo entrante] acuse falló:', e)
        return false
      }
    })(),
    avisarAlDueno(correo).catch(e => {
      console.error('[correo entrante] aviso falló:', e)
      return false
    }),
  ])

  await supabase
    .from('soporte_correos')
    .update({ acuse_enviado: acuse, aviso_enviado: aviso })
    .eq('id', fila.id)

  return NextResponse.json({ ok: true, id: fila.id, acuse, aviso })
}
