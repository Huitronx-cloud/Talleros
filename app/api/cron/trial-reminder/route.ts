import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const BREVO_API_KEY = process.env.BREVO_API_KEY!
const TWILIO_SID    = process.env.TWILIO_ACCOUNT_SID!
const TWILIO_TOKEN  = process.env.TWILIO_AUTH_TOKEN!
const TWILIO_FROM   = process.env.TWILIO_WHATSAPP_FROM!

async function enviarEmail(to: string, nombre: string, subject: string, html: string) {
  try {
    await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': BREVO_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sender: { name: 'TallerOS', email: 'hola@tallerosapp.com' },
        to: [{ email: to, name: nombre }],
        subject,
        htmlContent: html,
      }),
    })
  } catch (e) { console.error('Email error:', e) }
}

async function enviarWhatsApp(telefono: string, mensaje: string) {
  try {
    const tel = telefono.replace(/\D/g, '')
    const to  = tel.startsWith('+') ? tel : `+${tel}`
    const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`
    await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${TWILIO_SID}:${TWILIO_TOKEN}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        From: `whatsapp:${TWILIO_FROM}`,
        To:   `whatsapp:${to}`,
        Body: mensaje,
      }).toString(),
    })
  } catch (e) { console.error('WhatsApp error:', e) }
}

// ── Email templates ───────────────────────────────────────────────────────────

function emailDias4(nombre: string, tallerNombre: string): string {
  return `
  <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(135deg,#92400e,#d97706);padding:28px;text-align:center;">
      <p style="margin:0;color:#fff;font-size:13px;font-weight:700;letter-spacing:2px;opacity:0.85;text-transform:uppercase;">TallerOS</p>
      <p style="margin:8px 0 0;color:#fff;font-size:22px;font-weight:900;">⚠️ Te quedan 4 días</p>
    </div>
    <div style="padding:36px 32px;">
      <p style="color:#0f172a;font-size:16px;font-weight:700;margin-bottom:12px;">Hola ${nombre},</p>
      <p style="color:#334155;font-size:15px;line-height:1.7;margin-bottom:8px;">
        Tu prueba gratuita de <strong>${tallerNombre}</strong> en TallerOS termina en <strong>4 días</strong>.
      </p>
      <p style="color:#334155;font-size:15px;line-height:1.7;margin-bottom:24px;">
        No pierdas el acceso a todo lo que ya tienes registrado:
      </p>
      <div style="background:#fef9c3;border-radius:12px;padding:16px 20px;border-left:4px solid #d97706;margin-bottom:24px;">
        <p style="margin:0;color:#78350f;font-size:14px;line-height:1.8;">
          🔧 Tus clientes y vehículos registrados<br/>
          📋 Tus órdenes de trabajo activas<br/>
          💬 El historial de cotizaciones<br/>
          📊 El reporte de ingresos del mes
        </p>
      </div>
      <p style="color:#334155;font-size:15px;line-height:1.7;margin-bottom:28px;">
        Al suscribirte hoy, todo queda guardado y tu equipo sigue trabajando sin interrupciones. El plan más popular cuesta menos que una hora de mano de obra.
      </p>
      <a href="https://www.tallerosapp.com/configuracion/plan"
         style="display:block;text-align:center;background:linear-gradient(135deg,#d97706,#b45309);color:#fff;padding:15px 28px;border-radius:12px;text-decoration:none;font-size:16px;font-weight:800;letter-spacing:0.3px;">
        Ver planes y precios →
      </a>
      <p style="color:#94a3b8;font-size:13px;margin-top:20px;text-align:center;">
        ¿Tienes dudas? Responde este email — una persona real te atiende en menos de 2 horas.
      </p>
    </div>
  </div>`
}

function emailDias1(nombre: string, tallerNombre: string): string {
  return `
  <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(135deg,#7f1d1d,#dc2626);padding:28px;text-align:center;">
      <p style="margin:0;color:#fff;font-size:13px;font-weight:700;letter-spacing:2px;opacity:0.85;text-transform:uppercase;">TallerOS</p>
      <p style="margin:8px 0 0;color:#fff;font-size:22px;font-weight:900;">🔴 Mañana termina tu prueba</p>
    </div>
    <div style="padding:36px 32px;">
      <p style="color:#0f172a;font-size:16px;font-weight:700;margin-bottom:12px;">Hola ${nombre},</p>
      <p style="color:#334155;font-size:15px;line-height:1.7;margin-bottom:16px;">
        La prueba gratuita de <strong>${tallerNombre}</strong> en TallerOS termina <strong>mañana</strong>.
      </p>
      <div style="background:#fef2f2;border-radius:12px;padding:16px 20px;border-left:4px solid #dc2626;margin-bottom:24px;">
        <p style="margin:0 0 6px;color:#991b1b;font-size:14px;font-weight:700;">Si no te suscribes hoy:</p>
        <p style="margin:0;color:#7f1d1d;font-size:14px;line-height:1.8;">
          ❌ Tu cuenta quedará bloqueada<br/>
          ❌ Tu equipo no podrá acceder al sistema<br/>
          ❌ Las cotizaciones pendientes quedan congeladas<br/>
          ❌ Los clientes no recibirán notificaciones
        </p>
      </div>
      <p style="color:#334155;font-size:15px;line-height:1.7;margin-bottom:28px;">
        Suscríbete ahora y tu taller sigue operando mañana sin ningún corte. El proceso toma menos de 2 minutos.
      </p>
      <a href="https://www.tallerosapp.com/configuracion/plan"
         style="display:block;text-align:center;background:linear-gradient(135deg,#dc2626,#b91c1c);color:#fff;padding:15px 28px;border-radius:12px;text-decoration:none;font-size:16px;font-weight:800;letter-spacing:0.3px;">
        Suscribirme ahora — antes de que venza →
      </a>
      <p style="color:#94a3b8;font-size:13px;margin-top:20px;text-align:center;">
        ¿Prefieres hablar primero? Responde este email o escríbenos al WhatsApp y te ayudamos.
      </p>
    </div>
  </div>`
}

// ── WhatsApp messages ─────────────────────────────────────────────────────────

function waDias4(nombre: string): string {
  return `⚠️ Hola ${nombre}! Tu prueba de *TallerOS* termina en *4 días*.\n\nNo pierdas el acceso a tus clientes, órdenes y cotizaciones.\n\nSuscríbete hoy y tu taller sigue sin interrupciones 👇\nhttps://www.tallerosapp.com/configuracion/plan`
}

function waDias1(nombre: string): string {
  return `🔴 Hola ${nombre}! Mañana *termina tu prueba de TallerOS*.\n\nSi no te suscribes hoy, tu equipo no podrá acceder mañana.\n\nTarda 2 minutos 👇\nhttps://www.tallerosapp.com/configuracion/plan\n\n¿Tienes dudas? Responde este mensaje y te ayudamos ahora.`
}

// ── Handler principal ─────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const resultados: any[] = []

  try {
    const { data: talleres } = await supabase
      .from('talleres')
      .select(`
        id, nombre,
        suscripciones(plan, estado, trial_fin),
        usuarios!inner(nombre, email, telefono, rol)
      `)

    if (!talleres) return NextResponse.json({ ok: true, procesados: 0 })

    for (const taller of talleres) {
      const suscripcion = (taller.suscripciones as any[])?.[0]
      if (!suscripcion || suscripcion.plan !== 'trial' || suscripcion.estado !== 'activa') continue
      if (!suscripcion.trial_fin) continue

      const propietario = (taller.usuarios as any[]).find((u: any) => u.rol === 'propietario')
      if (!propietario?.email) continue

      const dias    = Math.ceil((new Date(suscripcion.trial_fin).getTime() - Date.now()) / 86400000)
      const nombre  = propietario.nombre?.split(' ')[0] ?? 'Hola'
      const email   = propietario.email
      const telefono = propietario.telefono

      // ── 4 días restantes: urgencia media ─────────────────────────────────
      if (dias >= 3 && dias <= 4) {
        await enviarEmail(email, nombre,
          `⚠️ Te quedan ${dias} días de prueba — TallerOS`,
          emailDias4(nombre, taller.nombre)
        )
        if (telefono) await enviarWhatsApp(telefono, waDias4(nombre))
        resultados.push({ taller: taller.nombre, accion: 'trial_4dias', dias })
      }

      // ── 1 día restante: urgencia máxima + alerta a Ivan ──────────────────
      if (dias >= 0 && dias <= 1) {
        await enviarEmail(email, nombre,
          dias === 0
            ? '🔴 Tu prueba de TallerOS termina hoy — actúa ahora'
            : '🔴 Mañana termina tu prueba de TallerOS',
          emailDias1(nombre, taller.nombre)
        )
        if (telefono) await enviarWhatsApp(telefono, waDias1(nombre))

        // Aviso a Ivan para seguimiento personal
        await enviarEmail(
          'hola@tallerosapp.com',
          'Ivan',
          `🎯 Trial por vencer: ${taller.nombre} (${dias === 0 ? 'hoy' : 'mañana'})`,
          `<div style="font-family:Arial;padding:20px;">
            <p><strong>${taller.nombre}</strong> (${email}${telefono ? ` · ${telefono}` : ''}) vence ${dias === 0 ? 'hoy' : 'mañana'}.</p>
            <p>Es el momento ideal para contacto personal. Tienen <strong>${dias === 0 ? 'pocas horas' : '1 día'}</strong> para convertir.</p>
          </div>`
        )
        resultados.push({ taller: taller.nombre, accion: `trial_${dias}dia`, dias })
      }
    }

    return NextResponse.json({ ok: true, procesados: talleres.length, acciones: resultados })
  } catch (error: any) {
    console.error('Trial reminder error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
