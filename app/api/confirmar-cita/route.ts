export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import twilio from 'twilio'
import { Resend } from 'resend'

export async function POST(req: NextRequest) {
  const supabaseAdmin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const resend = new Resend(process.env.RESEND_API_KEY!)

  try {
    const { citaId, tallerId } = await req.json()

    // Obtener datos de la cita
    const { data: cita } = await supabaseAdmin
      .from('citas')
      .select('*')
      .eq('id', citaId)
      .single()

    if (!cita) return NextResponse.json({ error: 'Cita no encontrada' }, { status: 404 })

    // Obtener nombre del taller
    const { data: taller } = await supabaseAdmin
      .from('talleres')
      .select('nombre, telefono')
      .eq('id', tallerId)
      .single()

    const nombreTaller  = taller?.nombre ?? 'El taller'
    const telefonoTaller = taller?.telefono ?? ''

    const fechaFormateada = new Date(cita.fecha + 'T12:00:00').toLocaleDateString('es-MX', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    })

    // ── WHATSAPP ──
    if (cita.cliente_telefono) {
      try {
        const twilioClient = twilio(
          process.env.TWILIO_ACCOUNT_SID!,
          process.env.TWILIO_AUTH_TOKEN!
        )
        const telefonoLimpio = cita.cliente_telefono.replace(/\D/g, '')
        const numeroDestino  = telefonoLimpio.startsWith('+')
          ? `whatsapp:${telefonoLimpio}`
          : `whatsapp:+${telefonoLimpio}`

        await twilioClient.messages.create({
          from: process.env.TWILIO_WHATSAPP_FROM!,
          to:   numeroDestino,
          body: `✅ *¡Tu cita está confirmada!*\n\n📅 *Fecha:* ${fechaFormateada}\n🕐 *Hora:* ${cita.hora.slice(0, 5)} hrs\n🔧 *Taller:* ${nombreTaller}${telefonoTaller ? `\n📞 *Teléfono:* ${telefonoTaller}` : ''}\n\n¡Te esperamos! Si necesitas cambiar tu cita, contáctanos.`,
        })
      } catch (e) {
        console.error('WhatsApp error (no crítico):', e)
      }
    }

    // ── EMAIL ──
    if (cita.cliente_email) {
      try {
        await resend.emails.send({
          from:    'TallerOS <hola@tallerosapp.com>',
          to:      cita.cliente_email,
          subject: `✅ Cita confirmada — ${nombreTaller}`,
          html:    buildEmailConfirmacion({
            clienteNombre: cita.cliente_nombre,
            nombreTaller,
            fechaFormateada,
            hora:          cita.hora.slice(0, 5),
            vehiculo:      [cita.vehiculo_marca, cita.vehiculo_modelo].filter(Boolean).join(' '),
            descripcion:   cita.descripcion,
            telefonoTaller,
          }),
        })
      } catch (e) {
        console.error('Email error (no crítico):', e)
      }
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error confirmando cita:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

function buildEmailConfirmacion({
  clienteNombre, nombreTaller, fechaFormateada, hora, vehiculo, descripcion, telefonoTaller,
}: {
  clienteNombre: string; nombreTaller: string; fechaFormateada: string
  hora: string; vehiculo: string; descripcion: string | null; telefonoTaller: string
}) {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:linear-gradient(135deg,#16a34a,#15803d);padding:40px;text-align:center;">
            <div style="font-size:48px;margin-bottom:12px;">✅</div>
            <div style="font-size:24px;font-weight:800;color:#fff;">¡Cita Confirmada!</div>
            <div style="color:rgba(255,255,255,0.85);font-size:14px;margin-top:8px;">${nombreTaller}</div>
          </td>
        </tr>
        <tr>
          <td style="padding:40px;">
            <p style="font-size:18px;font-weight:700;color:#111827;margin:0 0 24px;">
              Hola ${clienteNombre}, tu cita está confirmada 🎉
            </p>
            <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:24px;margin-bottom:24px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:8px 0;font-size:14px;">
                    <span style="color:#6b7280;">📅 Fecha</span><br>
                    <strong style="color:#111827;">${fechaFormateada}</strong>
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 0;font-size:14px;border-top:1px solid #dcfce7;">
                    <span style="color:#6b7280;">🕐 Hora</span><br>
                    <strong style="color:#111827;">${hora} hrs</strong>
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 0;font-size:14px;border-top:1px solid #dcfce7;">
                    <span style="color:#6b7280;">🔧 Taller</span><br>
                    <strong style="color:#111827;">${nombreTaller}</strong>
                  </td>
                </tr>
                ${vehiculo ? `
                <tr>
                  <td style="padding:8px 0;font-size:14px;border-top:1px solid #dcfce7;">
                    <span style="color:#6b7280;">🚗 Vehículo</span><br>
                    <strong style="color:#111827;">${vehiculo}</strong>
                  </td>
                </tr>` : ''}
                ${descripcion ? `
                <tr>
                  <td style="padding:8px 0;font-size:14px;border-top:1px solid #dcfce7;">
                    <span style="color:#6b7280;">📝 Servicio</span><br>
                    <strong style="color:#111827;">${descripcion}</strong>
                  </td>
                </tr>` : ''}
                ${telefonoTaller ? `
                <tr>
                  <td style="padding:8px 0;font-size:14px;border-top:1px solid #dcfce7;">
                    <span style="color:#6b7280;">📞 Contacto</span><br>
                    <strong style="color:#111827;">${telefonoTaller}</strong>
                  </td>
                </tr>` : ''}
              </table>
            </div>
            <p style="color:#6b7280;font-size:14px;text-align:center;margin:0;">
              ¿Necesitas cancelar o cambiar tu cita? Contáctanos directamente.
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:#f9fafb;padding:20px 40px;text-align:center;border-top:1px solid #f3f4f6;">
            <p style="color:#9ca3af;font-size:11px;margin:0;">
              Powered by <strong>TallerOS</strong> — Gestión inteligente para talleres mecánicos
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}