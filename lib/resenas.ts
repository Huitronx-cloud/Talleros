import { createClient } from '@supabase/supabase-js'
// DEPRECATED: canal migrado a wa.me — el WhatsApp ya no se envía por Twilio,
// se encola en mensajes_pendientes y el taller lo manda desde su propio chat.
// import { enviarWhatsApp } from './twilio'
import { encolarMensajeWhatsApp } from './mensajes-pendientes'

function personalizar(plantilla: string, vars: Record<string, string>): string {
  return Object.entries(vars).reduce(
    (msg, [key, val]) => msg.replace(new RegExp(`{{${key}}}`, 'g'), val),
    plantilla
  )
}

function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

type ResultadoResena =
  | { ok: false; motivo: string }
  | { ok: true; resultados: { whatsapp: string | null; email: string | null } }

// ── Envía la solicitud de reseña de Google para una orden, respetando la
// configuración del taller (resenas_config: activo, canal, plantillas) ───────
export async function enviarResenaOrden(ordenId: string, tallerId: string): Promise<ResultadoResena> {
  const admin = supabaseAdmin()

  const { data: config } = await admin
    .from('resenas_config')
    .select('*')
    .eq('taller_id', tallerId)
    .single()

  if (!config || !config.activo) {
    return { ok: false, motivo: 'Reseñas inactivas' }
  }

  if (!config.google_review_url) {
    return { ok: false, motivo: 'Sin URL de Google' }
  }

  const { data: suscripcion } = await admin
    .from('suscripciones')
    .select('plan')
    .eq('taller_id', tallerId)
    .single()

  const planActual = suscripcion?.plan ?? 'trial'
  if (planActual !== 'pro' && planActual !== 'trial' && planActual !== 'esencial') {
    return { ok: false, motivo: 'Plan no válido' }
  }

  const { data: orden } = await admin
    .from('ordenes')
    .select(`
      id,
      clientes (id, nombre, telefono, email),
      vehiculos (marca, modelo),
      talleres (nombre, pais)
    `)
    .eq('id', ordenId)
    .single() as any

  if (!orden) {
    return { ok: false, motivo: 'Orden no encontrada' }
  }

  const cliente = orden.clientes
  const vehiculo = orden.vehiculos
  const taller = orden.talleres as any

  if (!cliente) {
    return { ok: false, motivo: 'Orden sin cliente' }
  }

  const vehiculoStr = vehiculo
    ? `${vehiculo.marca || ''} ${vehiculo.modelo || ''}`.trim()
    : 'tu vehículo'

  const vars = {
    nombre: cliente.nombre.split(' ')[0],
    taller: taller?.nombre ?? '',
    vehiculo: vehiculoStr || 'tu vehículo',
    link: config.google_review_url,
  }

  const resultados = { whatsapp: null as string | null, email: null as string | null }

  if ((config.canal === 'whatsapp' || config.canal === 'ambos') && cliente.telefono) {
    const { data: yaEnviado } = await admin
      .from('resenas_enviadas')
      .select('id')
      .eq('orden_id', ordenId)
      .eq('canal', 'whatsapp')
      .limit(1)

    if (!yaEnviado?.length) {
      const mensaje = personalizar(config.mensaje_whatsapp, vars)

      // Canal wa.me: se encola para envío manual desde el WhatsApp del taller.
      const exito = await encolarMensajeWhatsApp(admin, {
        tallerId,
        clienteId: cliente.id,
        tipo: 'resena',
        telefono: cliente.telefono,
        mensaje,
        paisTaller: taller?.pais ?? null,
      })
      // DEPRECATED: canal migrado a wa.me — envío directo por Twilio:
      // try {
      //   await enviarWhatsApp(cliente.telefono, mensaje)
      // } catch (err: any) { ... }

      await admin.from('resenas_enviadas').insert({
        taller_id: tallerId,
        cliente_id: cliente.id,
        orden_id: ordenId,
        canal: 'whatsapp',
        estado: exito ? 'encolado' : 'fallido',
        tipo: 'google_my_business',
        url_resena: config.google_review_url,
        mensaje_enviado: mensaje,
        error_mensaje: exito ? null : 'No se pudo encolar en mensajes_pendientes',
      })

      resultados.whatsapp = exito ? 'encolado' : 'fallido'
    } else {
      resultados.whatsapp = 'ya_enviado'
    }
  }

  if ((config.canal === 'email' || config.canal === 'ambos') && cliente.email) {
    const { data: yaEnviado } = await admin
      .from('resenas_enviadas')
      .select('id')
      .eq('orden_id', ordenId)
      .eq('canal', 'email')
      .limit(1)

    if (!yaEnviado?.length) {
      const asunto = personalizar(config.mensaje_email_asunto, vars)
      const cuerpo = personalizar(config.mensaje_email_cuerpo, vars)
      const exito = await enviarEmail(cliente.email, cuerpo, asunto, taller?.nombre ?? '', config.google_review_url)

      await admin.from('resenas_enviadas').insert({
        taller_id: tallerId,
        cliente_id: cliente.id,
        orden_id: ordenId,
        canal: 'email',
        estado: exito ? 'enviado' : 'fallido',
        tipo: 'google_my_business',
        url_resena: config.google_review_url,
        mensaje_enviado: asunto,
        error_mensaje: exito ? null : 'Error enviando el correo vía Resend',
      })

      resultados.email = exito ? 'enviado' : 'fallido'
    } else {
      resultados.email = 'ya_enviado'
    }
  }

  return { ok: true, resultados }
}

async function enviarEmail(
  email: string,
  cuerpo: string,
  asunto: string,
  tallerNombre: string,
  reviewUrl: string
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
        html: generarEmailHTML(cuerpo, tallerNombre, reviewUrl),
      }),
    })

    if (!res.ok) {
      console.error('Resend error:', await res.text())
    }
    return res.ok
  } catch (err) {
    console.error('Error enviando email de reseña:', err)
    return false
  }
}

function generarEmailHTML(cuerpo: string, tallerNombre: string, reviewUrl: string): string {
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
