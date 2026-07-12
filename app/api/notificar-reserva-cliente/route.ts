export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
// DEPRECATED: canal migrado a wa.me — el acuse por WhatsApp al cliente ya no
// sale por Twilio. El cliente recibe el acuse por email, y el TALLER recibe
// una notificación push para aprobar la cita o sugerir otro día.
// import { enviarWhatsApp } from '@/lib/twilio'
import { Resend } from 'resend'

export async function POST(req: NextRequest) {
  try {
    const supabaseAdmin = createAdmin(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const resend = new Resend(process.env.RESEND_API_KEY!)

    const { citaId, tallerId } = await req.json()
    if (!citaId || !tallerId) {
      return NextResponse.json({ error: 'citaId y tallerId requeridos' }, { status: 400 })
    }

    const [{ data: cita }, { data: taller }] = await Promise.all([
      supabaseAdmin.from('citas').select('*').eq('id', citaId).single(),
      supabaseAdmin.from('talleres').select('nombre, telefono').eq('id', tallerId).single(),
    ])

    if (!cita) return NextResponse.json({ error: 'Cita no encontrada' }, { status: 404 })

    const nombreTaller   = taller?.nombre ?? 'El taller'
    const telefonoTaller = taller?.telefono ?? ''
    const fechaFormateada = new Date(cita.fecha + 'T12:00:00').toLocaleDateString('es-MX', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    })
    const hora = cita.hora.slice(0, 5)

    // DEPRECATED: canal migrado a wa.me — acuse por WhatsApp vía Twilio:
    // if (cita.cliente_telefono) {
    //   await enviarWhatsApp(cita.cliente_telefono, `📅 *¡Recibimos tu cita!*\n\nHola ${cita.cliente_nombre}...`)
    // }

    // ── PUSH al equipo del taller ── para que apruebe la cita o sugiera otro
    // día desde /citas (los botones abren wa.me con el mensaje al cliente)
    try {
      const { data: staff } = await supabaseAdmin
        .from('usuarios')
        .select('id')
        .eq('taller_id', tallerId)
        .in('rol', ['propietario', 'admin', 'recepcion'])

      const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.tallerosapp.com'
      await Promise.allSettled(
        (staff ?? []).map(u =>
          fetch(`${baseUrl}/api/push/enviar`, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              usuarioId: u.id,
              titulo:    '📅 Nueva solicitud de cita',
              cuerpo:    `${cita.cliente_nombre} pidió cita el ${fechaFormateada} a las ${hora}. Entra para confirmarla o sugerir otro día.`,
              url:       '/citas',
            }),
          })
        )
      )
    } catch (e) {
      console.error('[notificar-reserva-cliente] push al taller error:', e)
    }

    // ── EMAIL al cliente ──
    if (cita.cliente_email) {
      try {
        await resend.emails.send({
          from:    'TallerOS <hola@tallerosapp.com>',
          to:      cita.cliente_email,
          subject: `📅 Cita recibida — ${nombreTaller}`,
          html:    buildEmailAcuse({
            clienteNombre: cita.cliente_nombre,
            nombreTaller,
            fechaFormateada,
            hora,
            vehiculo:      [cita.vehiculo_marca, cita.vehiculo_modelo].filter(Boolean).join(' '),
            descripcion:   cita.descripcion,
            telefonoTaller,
          }),
        })
      } catch (e) {
        console.error('[notificar-reserva-cliente] Email error:', e)
      }
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[notificar-reserva-cliente]', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

function buildEmailAcuse({
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
          <td style="background:linear-gradient(135deg,#2563eb,#1d4ed8);padding:40px;text-align:center;">
            <div style="font-size:48px;margin-bottom:12px;">📅</div>
            <div style="font-size:24px;font-weight:800;color:#fff;">¡Cita Recibida!</div>
            <div style="color:rgba(255,255,255,0.85);font-size:14px;margin-top:8px;">${nombreTaller}</div>
          </td>
        </tr>
        <tr>
          <td style="padding:40px;">
            <p style="font-size:18px;font-weight:700;color:#111827;margin:0 0 8px;">
              Hola ${clienteNombre} 👋
            </p>
            <p style="color:#6b7280;font-size:14px;margin:0 0 24px;">
              Hemos recibido tu solicitud de cita. Te confirmaremos en breve.
            </p>
            <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:24px;margin-bottom:24px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:8px 0;font-size:14px;">
                    <span style="color:#6b7280;">📅 Fecha solicitada</span><br>
                    <strong style="color:#111827;">${fechaFormateada}</strong>
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 0;font-size:14px;border-top:1px solid #dbeafe;">
                    <span style="color:#6b7280;">🕐 Hora</span><br>
                    <strong style="color:#111827;">${hora} hrs</strong>
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 0;font-size:14px;border-top:1px solid #dbeafe;">
                    <span style="color:#6b7280;">🔧 Taller</span><br>
                    <strong style="color:#111827;">${nombreTaller}</strong>
                  </td>
                </tr>
                ${vehiculo ? `
                <tr>
                  <td style="padding:8px 0;font-size:14px;border-top:1px solid #dbeafe;">
                    <span style="color:#6b7280;">🚗 Vehículo</span><br>
                    <strong style="color:#111827;">${vehiculo}</strong>
                  </td>
                </tr>` : ''}
                ${descripcion ? `
                <tr>
                  <td style="padding:8px 0;font-size:14px;border-top:1px solid #dbeafe;">
                    <span style="color:#6b7280;">📝 Servicio</span><br>
                    <strong style="color:#111827;">${descripcion}</strong>
                  </td>
                </tr>` : ''}
                ${telefonoTaller ? `
                <tr>
                  <td style="padding:8px 0;font-size:14px;border-top:1px solid #dbeafe;">
                    <span style="color:#6b7280;">📞 Contacto del taller</span><br>
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
