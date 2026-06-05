import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  getClientesParaRecordar,
  personalizarMensaje,
  registrarRecordatorioEnviado,
} from '@/lib/recordatorios'

export async function GET(req: NextRequest) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Seguridad: solo Vercel Cron puede llamar este endpoint
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Obtener todos los talleres Pro con recordatorios activos
    const { data: configs, error } = await supabaseAdmin
      .from('recordatorios_config')
      .select(`
        *,
        talleres (
          id,
          nombre,
          plan
        )
      `)
      .eq('activo', true)

    if (error) throw error

    const resultados = {
      procesados: 0,
      enviados: 0,
      fallidos: 0,
      talleres: [] as any[],
    }

    for (const config of configs || []) {
      const taller = config.talleres as any

      // Solo talleres Pro
      if (!taller || (taller.plan !== 'pro' && taller.plan !== 'trial')) continue

      const clientes = await getClientesParaRecordar(
        taller.id,
        config.meses_intervalo
      )

      const tallerResultado = {
        taller_id: taller.id,
        taller_nombre: taller.nombre,
        clientes_encontrados: clientes.length,
        enviados: 0,
        fallidos: 0,
      }

      for (const cliente of clientes) {
        resultados.procesados++

        // Enviar por WhatsApp
        if (
          (config.canal === 'whatsapp' || config.canal === 'ambos') &&
          cliente.telefono
        ) {
          const mensaje = personalizarMensaje(config.mensaje_whatsapp, {
            nombre: cliente.nombre.split(' ')[0],
            taller: taller.nombre,
            vehiculo: cliente.vehiculo,
            meses: cliente.meses_desde_ultima_visita,
          })

          const exito = await enviarWhatsApp(cliente.telefono, mensaje)

          await registrarRecordatorioEnviado({
            tallerId: taller.id,
            clienteId: cliente.cliente_id,
            ordenId: cliente.ultima_orden_id,
            canal: 'whatsapp',
            estado: exito ? 'enviado' : 'fallido',
            mensajeEnviado: mensaje,
            errorDetalle: exito ? undefined : 'Error Twilio',
          })

          if (exito) {
            resultados.enviados++
            tallerResultado.enviados++
          } else {
            resultados.fallidos++
            tallerResultado.fallidos++
          }
        }

        // Enviar por Email
        if (
          (config.canal === 'email' || config.canal === 'ambos') &&
          cliente.email
        ) {
          const asunto = personalizarMensaje(config.mensaje_email_asunto, {
            nombre: cliente.nombre.split(' ')[0],
            taller: taller.nombre,
            vehiculo: cliente.vehiculo,
            meses: cliente.meses_desde_ultima_visita,
          })

          const cuerpo = personalizarMensaje(config.mensaje_email_cuerpo, {
            nombre: cliente.nombre.split(' ')[0],
            taller: taller.nombre,
            vehiculo: cliente.vehiculo,
            meses: cliente.meses_desde_ultima_visita,
          })

          const exito = await enviarEmail(
            cliente.email,
            cliente.nombre,
            asunto,
            cuerpo,
            taller.nombre
          )

          await registrarRecordatorioEnviado({
            tallerId: taller.id,
            clienteId: cliente.cliente_id,
            ordenId: cliente.ultima_orden_id,
            canal: 'email',
            estado: exito ? 'enviado' : 'fallido',
            mensajeEnviado: asunto,
            errorDetalle: exito ? undefined : 'Error Resend',
          })

          if (exito) {
            resultados.enviados++
            tallerResultado.enviados++
          } else {
            resultados.fallidos++
            tallerResultado.fallidos++
          }
        }
      }

      resultados.talleres.push(tallerResultado)
    }

    return NextResponse.json({ ok: true, resultados })
  } catch (error: any) {
    console.error('Error cron recordatorios:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

async function enviarWhatsApp(
  telefono: string,
  mensaje: string
): Promise<boolean> {
  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID!
    const authToken = process.env.TWILIO_AUTH_TOKEN!
    const from = process.env.TWILIO_WHATSAPP_FROM!

    // Normalizar teléfono
    const telefonoLimpio = telefono.replace(/\D/g, '')
    const telefonoFull = telefonoLimpio.startsWith('1')
      ? `+${telefonoLimpio}`
      : `+52${telefonoLimpio}` // Default México, ajustar según país

    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`

    const body = new URLSearchParams({
      From: `whatsapp:${from}`,
      To: `whatsapp:${telefonoFull}`,
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
        to: [email],
        subject: asunto,
        html: generarEmailHTML(nombre, cuerpo, tallerNombre),
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
  tallerNombre: string
): string {
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
          <!-- Header -->
          <tr>
            <td style="background:#0f172a;padding:32px;text-align:center;">
              <p style="margin:0;color:#38bdf8;font-size:22px;font-weight:700;letter-spacing:-0.5px;">${tallerNombre}</p>
              <p style="margin:8px 0 0;color:#64748b;font-size:13px;">Recordatorio de mantenimiento</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px 32px;">
              <p style="margin:0 0 16px;color:#0f172a;font-size:16px;line-height:1.6;">
                ${cuerpo.replace(/\n/g, '<br>')}
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