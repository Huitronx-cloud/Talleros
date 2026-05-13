import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function personalizar(plantilla: string, vars: Record<string, string>): string {
  return Object.entries(vars).reduce(
    (msg, [key, val]) => msg.replace(new RegExp(`{{${key}}}`, 'g'), val),
    plantilla
  )
}

export async function POST(req: NextRequest) {
  try {
    const { orden_id, taller_id } = await req.json()

    if (!orden_id || !taller_id) {
      return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 })
    }

    // Obtener config de reseñas del taller
    const { data: config } = await supabaseAdmin
      .from('resenas_config')
      .select('*')
      .eq('taller_id', taller_id)
      .single()

    if (!config || !config.activo) {
      return NextResponse.json({ ok: false, motivo: 'Reseñas inactivas' })
    }

    if (!config.google_review_url) {
      return NextResponse.json({ ok: false, motivo: 'Sin URL de Google' })
    }

    // Obtener datos de la orden
    const { data: orden } = await supabaseAdmin
      .from('ordenes')
      .select(`
        id,
        clientes (id, nombre, telefono, email),
        vehiculos (marca, modelo),
        talleres (nombre, plan)
      `)
      .eq('id', orden_id)
      .single() as any

    if (!orden) {
      return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 })
    }

    const taller = orden.talleres
    if (taller?.plan !== 'pro') {
      return NextResponse.json({ ok: false, motivo: 'Plan no Pro' })
    }

    const cliente = orden.clientes
    const vehiculo = orden.vehiculos
    const vehiculoStr = vehiculo
      ? `${vehiculo.marca || ''} ${vehiculo.modelo || ''}`.trim()
      : 'tu vehículo'

    const vars = {
      nombre: cliente.nombre.split(' ')[0],
      taller: taller.nombre,
      vehiculo: vehiculoStr,
      link: config.google_review_url,
    }

    const resultados = { whatsapp: null as any, email: null as any }

    // Enviar WhatsApp
    if ((config.canal === 'whatsapp' || config.canal === 'ambos') && cliente.telefono) {
      // Verificar que no se haya enviado ya
      const { data: yaEnviado } = await supabaseAdmin
        .from('resenas_enviadas')
        .select('id')
        .eq('orden_id', orden_id)
        .eq('canal', 'whatsapp')
        .limit(1)

      if (!yaEnviado?.length) {
        const mensaje = personalizar(config.mensaje_whatsapp, vars)
        const exito = await enviarWhatsApp(cliente.telefono, mensaje)

        await supabaseAdmin.from('resenas_enviadas').insert({
          taller_id,
          cliente_id: cliente.id,
          orden_id,
          canal: 'whatsapp',
          estado: exito ? 'enviado' : 'fallido',
          mensaje_enviado: mensaje,
        })

        resultados.whatsapp = exito ? 'enviado' : 'fallido'
      } else {
        resultados.whatsapp = 'ya_enviado'
      }
    }

    // Enviar Email
    if ((config.canal === 'email' || config.canal === 'ambos') && cliente.email) {
      const { data: yaEnviado } = await supabaseAdmin
        .from('resenas_enviadas')
        .select('id')
        .eq('orden_id', orden_id)
        .eq('canal', 'email')
        .limit(1)

      if (!yaEnviado?.length) {
        const asunto = personalizar(config.mensaje_email_asunto, vars)
        const cuerpo = personalizar(config.mensaje_email_cuerpo, vars)
        const exito = await enviarEmail(cliente.email, cliente.nombre, asunto, cuerpo, taller.nombre, config.google_review_url)

        await supabaseAdmin.from('resenas_enviadas').insert({
          taller_id,
          cliente_id: cliente.id,
          orden_id,
          canal: 'email',
          estado: exito ? 'enviado' : 'fallido',
          mensaje_enviado: asunto,
        })

        resultados.email = exito ? 'enviado' : 'fallido'
      } else {
        resultados.email = 'ya_enviado'
      }
    }

    return NextResponse.json({ ok: true, resultados })
  } catch (error: any) {
    console.error('Error enviando reseña:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

async function enviarWhatsApp(telefono: string, mensaje: string): Promise<boolean> {
  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID!
    const authToken  = process.env.TWILIO_AUTH_TOKEN!
    const from       = process.env.TWILIO_WHATSAPP_FROM!

    const telefonoLimpio = telefono.replace(/\D/g, '')
    const telefonoFull   = telefonoLimpio.startsWith('1')
      ? `+${telefonoLimpio}`
      : `+52${telefonoLimpio}`

    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          From: `whatsapp:${from}`,
          To:   `whatsapp:${telefonoFull}`,
          Body: mensaje,
        }).toString(),
      }
    )

    return res.ok
  } catch {
    return false
  }
}

async function enviarEmail(
  email: string,
  nombre: string,
  asunto: string,
  cuerpo: string,
  tallerNombre: string,
  reviewUrl: string
): Promise<boolean> {
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization:  `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from:    `${tallerNombre} via TallerOS <notificaciones@tallerosapp.com>`,
        to:      [email],
        subject: asunto,
        html:    generarEmailHTML(nombre, cuerpo, tallerNombre, reviewUrl),
      }),
    })

    return res.ok
  } catch {
    return false
  }
}

function generarEmailHTML(
  nombre: string,
  cuerpo: string,
  tallerNombre: string,
  reviewUrl: string
): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:#0f172a;padding:32px;text-align:center;">
            <p style="margin:0;color:#fbbf24;font-size:32px;">⭐⭐⭐⭐⭐</p>
            <p style="margin:12px 0 0;color:#fff;font-size:20px;font-weight:700;">${tallerNombre}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:40px 32px;text-align:center;">
            <p style="margin:0 0 24px;color:#0f172a;font-size:16px;line-height:1.6;">
              ${cuerpo.replace(/\n/g, '<br>')}
            </p>
            <a href="${reviewUrl}" style="display:inline-block;background:#0f172a;color:#fff;font-weight:700;font-size:16px;padding:14px 32px;border-radius:8px;text-decoration:none;">
              ⭐ Dejar mi reseña en Google
            </a>
            <p style="margin:32px 0 0;color:#94a3b8;font-size:12px;border-top:1px solid #e2e8f0;padding-top:24px;">
              Enviado por ${tallerNombre} a través de TallerOS
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}