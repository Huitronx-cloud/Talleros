export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  const supabaseAdmin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    const {
      tallerId,
      nombreTaller,
      clienteIds,
      canal,
      mensaje,
      descripcion,
      pretexto,
      tipoDescuento,
      valorDescuento,
    } = await req.json()

    if (!tallerId || !clienteIds?.length || !mensaje) {
      return NextResponse.json({ error: 'Faltan datos requeridos' }, { status: 400 })
    }

    // Verificar que el taller es Pro
    const { data: suscripcion } = await supabaseAdmin
      .from('suscripciones')
      .select('plan')
      .eq('taller_id', tallerId)
      .single()

    if (suscripcion?.plan !== 'pro' && suscripcion?.plan !== 'trial') {
      return NextResponse.json({ error: 'Plan Pro requerido' }, { status: 403 })
    }

    // Obtener clientes seleccionados
    const { data: clientes } = await supabaseAdmin
      .from('clientes')
      .select('id, nombre, telefono, email')
      .in('id', clienteIds)
      .eq('taller_id', tallerId)

    if (!clientes?.length) {
      return NextResponse.json({ error: 'No se encontraron clientes' }, { status: 404 })
    }

    let enviados = 0
    let fallidos = 0

    for (const cliente of clientes) {
      const primerNombre = cliente.nombre.split(' ')[0]
      const mensajePersonalizado = mensaje.replace(
        /(?:Hola\s+)\w+/,
        `Hola ${primerNombre}`
      )

      // Enviar WhatsApp
      if ((canal === 'whatsapp' || canal === 'ambos') && cliente.telefono) {
        const ok = await enviarWhatsApp(cliente.telefono, mensajePersonalizado)
        ok ? enviados++ : fallidos++
      }

      // Enviar Email
      if ((canal === 'email' || canal === 'ambos') && cliente.email) {
        const asunto = `🎁 Oferta especial para ti de ${nombreTaller}`
        const ok = await enviarEmail(
          cliente.email,
          cliente.nombre,
          asunto,
          mensajePersonalizado,
          nombreTaller
        )
        ok ? enviados++ : fallidos++
      }

      // Si no tiene el canal requerido, cuenta como fallido
      if (
        canal === 'whatsapp' && !cliente.telefono ||
        canal === 'email' && !cliente.email ||
        canal === 'ambos' && !cliente.telefono && !cliente.email
      ) {
        fallidos++
      }
    }

    // Registrar en tabla promociones (si existe) — best effort
    try {
      await supabaseAdmin.from('promociones').insert({
        taller_id: tallerId,
        descripcion,
        pretexto,
        tipo_descuento: tipoDescuento,
        valor_descuento: valorDescuento ? parseFloat(valorDescuento) : null,
        canal,
        total_enviados: enviados,
        total_fallidos: fallidos,
        clientes_count: clientes.length,
        created_at: new Date().toISOString(),
      })
    } catch {
      // La tabla puede no existir aún — no bloquea el envío
    }

    return NextResponse.json({ enviados, fallidos })
  } catch (error: any) {
    console.error('Error promociones:', error)
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
      : telefonoLimpio.startsWith('52')
        ? `+${telefonoLimpio}`
        : `+52${telefonoLimpio}`

    const url  = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`
    const body = new URLSearchParams({
      From: `whatsapp:${from}`,
      To:   `whatsapp:${telefonoFull}`,
      Body: mensaje,
    })

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    })

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
  tallerNombre: string
): Promise<boolean> {
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${tallerNombre} via TallerOS <notificaciones@tallerosapp.com>`,
        to:   [email],
        subject: asunto,
        html: generarEmailHTML(nombre, cuerpo, tallerNombre),
      }),
    })
    return res.ok
  } catch {
    return false
  }
}

function generarEmailHTML(nombre: string, cuerpo: string, tallerNombre: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          <tr>
            <td style="background:#f97316;padding:32px;text-align:center;">
              <p style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.5px;">${tallerNombre}</p>
              <p style="margin:8px 0 0;color:#fed7aa;font-size:13px;">🎁 Oferta especial para ti</p>
            </td>
          </tr>
          <tr>
            <td style="padding:40px 32px;">
              <p style="margin:0 0 16px;color:#0f172a;font-size:16px;line-height:1.6;">
                ${cuerpo.replace(/\n/g, '<br>').replace(/\*([^*]+)\*/g, '<strong>$1</strong>')}
              </p>
              <p style="margin:32px 0 0;color:#64748b;font-size:13px;border-top:1px solid #e2e8f0;padding-top:24px;">
                Enviado por ${tallerNombre} a través de TallerOS
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `
}
