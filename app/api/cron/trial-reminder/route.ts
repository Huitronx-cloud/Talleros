import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
export const revalidate = 0
import { createPublicReadClient } from '@/lib/supabase-public'

// Email vía Resend (migrado desde Brevo): va a dueños de taller, no a
// clientes finales, por eso sí puede ser automático.
async function enviarEmail(to: string, _nombre: string, subject: string, html: string) {
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'TallerOS <notificaciones@tallerosapp.com>',
        to: [to],
        subject,
        html,
      }),
    })
  } catch (e) { console.error('Email error:', e) }
}

// DEPRECATED: canal migrado a wa.me — Twilio ya no se usa para WhatsApp.
// Los dueños de taller reciben el recordatorio de trial solo por email.
// async function enviarWhatsApp(telefono: string, mensaje: string) {
//   try {
//     const tel = telefono.replace(/\D/g, '')
//     const to  = tel.length === 10 ? `+52${tel}` : `+${tel}`
//     const sid = process.env.TWILIO_ACCOUNT_SID!
//     const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`
//     await fetch(url, {
//       method: 'POST',
//       headers: {
//         Authorization: `Basic ${Buffer.from(`${sid}:${process.env.TWILIO_AUTH_TOKEN!}`).toString('base64')}`,
//         'Content-Type': 'application/x-www-form-urlencoded',
//       },
//       body: new URLSearchParams({
//         From: `whatsapp:${process.env.TWILIO_WHATSAPP_FROM!}`,
//         To:   `whatsapp:${to}`,
//         Body: mensaje,
//       }).toString(),
//     })
//   } catch (e) { console.error('WhatsApp error:', e) }
// }

// ── Email templates ───────────────────────────────────────────────────────────

function emailDias7(nombre: string, tallerNombre: string): string {
  return `
  <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(135deg,#1e3a5f,#1d4ed8);padding:28px;text-align:center;">
      <p style="margin:0;color:#fff;font-size:13px;font-weight:700;letter-spacing:2px;opacity:0.85;text-transform:uppercase;">TallerOS</p>
      <p style="margin:8px 0 0;color:#fff;font-size:22px;font-weight:900;">🚀 Llevas una semana — ¿cómo va?</p>
    </div>
    <div style="padding:36px 32px;">
      <p style="color:#0f172a;font-size:16px;font-weight:700;margin-bottom:12px;">Hola ${nombre},</p>
      <p style="color:#334155;font-size:15px;line-height:1.7;margin-bottom:24px;">
        Ya llevas 7 días con <strong>${tallerNombre}</strong> en TallerOS. Muchos talleres ven su primera diferencia en esta semana: clientes que dejan de llamar porque ven su vehículo en el portal, y aprobaciones que llegan por WhatsApp sin perseguir al cliente.
      </p>
      <div style="background:#eff6ff;border-radius:12px;padding:16px 20px;border-left:4px solid #2563eb;margin-bottom:24px;">
        <p style="margin:0 0 8px;color:#1e40af;font-size:14px;font-weight:700;">Ahora mismo tienes todo abierto:</p>
        <p style="margin:0;color:#1d4ed8;font-size:14px;line-height:1.8;">
          ✅ Órdenes y clientes sin límite<br/>
          ✅ Recordatorios automáticos de mantenimiento<br/>
          ✅ Campañas de promociones<br/>
          ✅ Reportes de ingresos por mecánico<br/>
          ✅ Tu equipo completo en la misma cuenta
        </p>
      </div>
      <p style="color:#334155;font-size:15px;line-height:1.7;margin-bottom:28px;">
        Te quedan <strong>7 días</strong> con todo esto. Después tu cuenta sigue abierta en el plan gratis (10 órdenes al mes, 20 clientes, 1 usuario) — no se bloquea ni se borra nada, pero estas funciones se guardan.
      </p>
      <a href="https://www.tallerosapp.com/configuracion/plan"
         style="display:block;text-align:center;background:linear-gradient(135deg,#2563eb,#1d4ed8);color:#fff;padding:15px 28px;border-radius:12px;text-decoration:none;font-size:16px;font-weight:800;letter-spacing:0.3px;">
        Ver planes y precios →
      </a>
      <p style="color:#94a3b8;font-size:13px;margin-top:20px;text-align:center;">
        ¿Tienes dudas o quieres una demo en vivo? Responde este email — te contactamos hoy.
      </p>
    </div>
  </div>`
}

function emailDias4(nombre: string, tallerNombre: string): string {
  return `
  <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(135deg,#92400e,#d97706);padding:28px;text-align:center;">
      <p style="margin:0;color:#fff;font-size:13px;font-weight:700;letter-spacing:2px;opacity:0.85;text-transform:uppercase;">TallerOS</p>
      <p style="margin:8px 0 0;color:#fff;font-size:22px;font-weight:900;">⚠️ Te quedan 4 días de acceso completo</p>
    </div>
    <div style="padding:36px 32px;">
      <p style="color:#0f172a;font-size:16px;font-weight:700;margin-bottom:12px;">Hola ${nombre},</p>
      <p style="color:#334155;font-size:15px;line-height:1.7;margin-bottom:8px;">
        En <strong>4 días</strong> tu prueba de <strong>${tallerNombre}</strong> pasa al plan gratis. Tu cuenta no se cierra y tus datos no se tocan — pero estos topes empiezan a aplicar:
      </p>
      <div style="background:#fef9c3;border-radius:12px;padding:16px 20px;border-left:4px solid #d97706;margin:16px 0 24px;">
        <p style="margin:0;color:#78350f;font-size:14px;line-height:1.8;">
          🔧 10 órdenes de trabajo al mes<br/>
          👥 20 clientes registrados<br/>
          🧑‍🔧 1 sola persona en el equipo<br/>
          📊 Sin recordatorios, promociones ni reportes
        </p>
      </div>
      <p style="color:#334155;font-size:15px;line-height:1.7;margin-bottom:28px;">
        Si tu taller hace más de 10 órdenes al mes, el plan <strong>Esencial</strong> te quita esos topes y cuesta menos que una hora de mano de obra.
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
      <p style="margin:8px 0 0;color:#fff;font-size:22px;font-weight:900;">Mañana pasas al plan gratis</p>
    </div>
    <div style="padding:36px 32px;">
      <p style="color:#0f172a;font-size:16px;font-weight:700;margin-bottom:12px;">Hola ${nombre},</p>
      <p style="color:#334155;font-size:15px;line-height:1.7;margin-bottom:16px;">
        Mañana <strong>${tallerNombre}</strong> pasa al plan gratis. Tu cuenta sigue abierta y no se borra nada — puedes seguir trabajando con 10 órdenes al mes, 20 clientes y 1 usuario.
      </p>
      <div style="background:#fef2f2;border-radius:12px;padding:16px 20px;border-left:4px solid #dc2626;margin-bottom:24px;">
        <p style="margin:0 0 6px;color:#991b1b;font-size:14px;font-weight:700;">Lo que dejas de tener mañana:</p>
        <p style="margin:0;color:#7f1d1d;font-size:14px;line-height:1.8;">
          🔔 Recordatorios automáticos de mantenimiento<br/>
          📣 Campañas de promociones a tus clientes<br/>
          📊 Reportes de ingresos por mecánico<br/>
          🧑‍🔧 Tu equipo trabajando contigo en la misma cuenta
        </p>
      </div>
      <p style="color:#334155;font-size:15px;line-height:1.7;margin-bottom:28px;">
        Eso es lo que desbloquean los planes de pago. El proceso toma menos de 2 minutos y puedes cancelar cuando quieras.
      </p>
      <a href="https://www.tallerosapp.com/configuracion/plan"
         style="display:block;text-align:center;background:linear-gradient(135deg,#dc2626,#b91c1c);color:#fff;padding:15px 28px;border-radius:12px;text-decoration:none;font-size:16px;font-weight:800;letter-spacing:0.3px;">
        Ver qué desbloquea cada plan →
      </a>
      <p style="color:#94a3b8;font-size:13px;margin-top:20px;text-align:center;">
        ¿Prefieres hablar primero? Responde este email o escríbenos al WhatsApp y te ayudamos.
      </p>
    </div>
  </div>`
}

// ── WhatsApp messages ─────────────────────────────────────────────────────────
// DEPRECATED: canal migrado a wa.me — estas plantillas ya no se envían
// automáticamente (Twilio deshabilitado); se conservan por si se reutilizan
// en un flujo manual.

function waDias7(nombre: string): string {
  return `🚀 Hola ${nombre}! Ya llevas una semana con *TallerOS*.\n\nTe quedan 7 días de prueba. Para seguir usando el portal del cliente, aprobaciones por WA y recordatorios automáticos, elige tu plan aquí 👇\nhttps://www.tallerosapp.com/configuracion/plan\n\n¿Tienes dudas? Responde este mensaje.`
}

function waDias4(nombre: string): string {
  return `⚠️ Hola ${nombre}! Tu prueba de *TallerOS* termina en *4 días*.\n\nNo pierdas el acceso a tus clientes, órdenes y cotizaciones.\n\nSuscríbete hoy y tu taller sigue sin interrupciones 👇\nhttps://www.tallerosapp.com/configuracion/plan`
}

function waDias1(nombre: string): string {
  return `🔴 Hola ${nombre}! Mañana *termina tu prueba de TallerOS*.\n\nSi no te suscribes hoy, tu equipo no podrá acceder mañana.\n\nTarda 2 minutos 👇\nhttps://www.tallerosapp.com/configuracion/plan\n\n¿Tienes dudas? Responde este mensaje y te ayudamos ahora.`
}

// ── Handler principal ─────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const supabase = createPublicReadClient()

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
        suscripciones(id, plan, estado, trial_fin, trial_reminder_etapas),
        usuarios!inner(nombre, email, telefono, rol)
      `)

    if (!talleres) return NextResponse.json({ ok: true, procesados: 0 })

    // Límite global por ejecución — protección contra la cola acumulada
    const LIMITE_POR_EJECUCION = 50
    let pendientesRestantes = 0

    // Deduplicación: cada etapa (7dias/4dias/1dia) se manda UNA sola vez por
    // suscripción — antes la ventana de 2 días duplicaba cada correo.
    const marcarEtapa = async (suscripcionId: string, etapas: string[], etapa: string) => {
      await supabase
        .from('suscripciones')
        .update({ trial_reminder_etapas: [...etapas, etapa] })
        .eq('id', suscripcionId)
    }

    for (const taller of talleres) {
      const suscripcion = (taller.suscripciones as any[])?.[0]
      if (!suscripcion || suscripcion.plan !== 'trial' || suscripcion.estado !== 'activa') continue
      if (!suscripcion.trial_fin) continue

      const propietario = (taller.usuarios as any[]).find((u: any) => u.rol === 'propietario')
      if (!propietario?.email) continue

      const etapas: string[] = suscripcion.trial_reminder_etapas ?? []
      const dias    = Math.ceil((new Date(suscripcion.trial_fin).getTime() - Date.now()) / 86400000)
      const nombre  = propietario.nombre?.split(' ')[0] ?? 'Hola'
      const email   = propietario.email
      const telefono = propietario.telefono

      if (resultados.length >= LIMITE_POR_EJECUCION) {
        pendientesRestantes++
        continue
      }

      // ── 7 días restantes: punto medio — re-engagement ────────────────────
      if (dias >= 6 && dias <= 7 && !etapas.includes('7dias')) {
        await enviarEmail(email, nombre,
          '🚀 Te quedan 7 días con todas las funciones abiertas',
          emailDias7(nombre, taller.nombre)
        )
        // DEPRECATED: canal migrado a wa.me — ya no se envía WhatsApp por Twilio
        // if (telefono) await enviarWhatsApp(telefono, waDias7(nombre))
        await marcarEtapa(suscripcion.id, etapas, '7dias')
        resultados.push({ taller: taller.nombre, accion: 'trial_7dias', dias })
      }

      // ── 4 días restantes: urgencia media ─────────────────────────────────
      if (dias >= 3 && dias <= 4 && !etapas.includes('4dias')) {
        await enviarEmail(email, nombre,
          `${taller.nombre}: en ${dias} días pasas al plan gratis`,
          emailDias4(nombre, taller.nombre)
        )
        // DEPRECATED: canal migrado a wa.me — ya no se envía WhatsApp por Twilio
        // if (telefono) await enviarWhatsApp(telefono, waDias4(nombre))
        await marcarEtapa(suscripcion.id, etapas, '4dias')
        resultados.push({ taller: taller.nombre, accion: 'trial_4dias', dias })
      }

      // ── 1 día restante: urgencia máxima + alerta a Ivan ──────────────────
      if (dias >= 0 && dias <= 1 && !etapas.includes('1dia')) {
        await enviarEmail(email, nombre,
          `${taller.nombre}: mañana pasas al plan gratis`,
          emailDias1(nombre, taller.nombre)
        )
        // DEPRECATED: canal migrado a wa.me — ya no se envía WhatsApp por Twilio
        // if (telefono) await enviarWhatsApp(telefono, waDias1(nombre))

        // Aviso a Ivan para seguimiento personal
        await enviarEmail(
          'hola@tallerosapp.com',
          'Ivan',
          `🎯 Pasa a gratis ${dias === 0 ? 'hoy' : 'mañana'}: ${taller.nombre}`,
          `<div style="font-family:Arial;padding:20px;">
            <p><strong>${taller.nombre}</strong> (${email}${telefono ? ` · ${telefono}` : ''}) pasa al plan gratis ${dias === 0 ? 'hoy' : 'mañana'}.</p>
            <p>No se bloquea nada, solo pierde las funciones de pago. Es el mejor momento para contacto personal: ya usó la app dos semanas y sabe qué le sirve.</p>
          </div>`
        )
        await marcarEtapa(suscripcion.id, etapas, '1dia')
        resultados.push({ taller: taller.nombre, accion: `trial_${dias}dia`, dias })
      }
    }

    console.log(`[cron trial-reminder] acciones=${resultados.length} pendientes_restantes=${pendientesRestantes}`)
    return NextResponse.json({ ok: true, procesados: talleres.length, acciones: resultados, pendientes_restantes: pendientesRestantes })
  } catch (error: any) {
    console.error('Trial reminder error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
