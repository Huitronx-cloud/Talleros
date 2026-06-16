export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'

const BREVO_API_KEY = process.env.BREVO_API_KEY!
const SENDER_EMAIL  = 'hola@tallerosapp.com'
const SENDER_NAME   = 'TallerOS'

// ── Email 1: Inmediato — La guía ─────────────────────────────────────────────
function email1(nombre: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 20px;">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
      <tr>
        <td style="background:linear-gradient(135deg,#1e3a5f,#1d4ed8);padding:32px;text-align:center;">
          <p style="margin:0;color:#fff;font-size:24px;font-weight:900;letter-spacing:-0.5px;">TallerOS</p>
          <p style="margin:8px 0 0;color:#93c5fd;font-size:13px;">Software para talleres mecánicos</p>
        </td>
      </tr>
      <tr>
        <td style="padding:40px 32px;">
          <p style="margin:0 0 16px;color:#0f172a;font-size:16px;font-weight:700;">Hola ${nombre.split(' ')[0]} 👋</p>
          <p style="margin:0 0 16px;color:#334155;font-size:15px;line-height:1.7;">Aquí tienes tu guía gratuita: <strong>"5 errores que le cuestan clientes a tu taller mecánico"</strong></p>
          <p style="margin:0 0 24px;color:#334155;font-size:15px;line-height:1.7;">Estos errores los cometen la mayoría de talleres en LATAM sin darse cuenta — y le cuestan clientes, dinero y reputación todos los días.</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
            ${[
              ['❌ 01','No documentar el estado del vehículo al recibirlo'],
              ['❌ 02','Pedir aprobación verbal (sin registro) para las reparaciones'],
              ['⭐ 03','No pedir reseñas en Google al momento de entregar'],
              ['👥 04','No hacer seguimiento a clientes inactivos'],
              ['📊 05','Operar sin datos de desempeño del taller'],
            ].map(([n, t]) => `
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;">
                <span style="font-size:14px;color:#0f172a;"><strong>${n}</strong> — ${t}</span>
              </td>
            </tr>`).join('')}
          </table>
          <p style="margin:0 0 24px;color:#334155;font-size:15px;line-height:1.7;">En los próximos días te voy a mostrar exactamente cómo los talleres más exitosos de LATAM están eliminando cada uno de estos errores.</p>
          <table cellpadding="0" cellspacing="0" style="margin:0 auto 24px;">
            <tr>
              <td style="background:#2563eb;border-radius:12px;padding:14px 28px;">
                <a href="https://www.tallerosapp.com/registro" style="color:#fff;text-decoration:none;font-size:15px;font-weight:700;">Probar TallerOS gratis 14 días →</a>
              </td>
            </tr>
          </table>
          <p style="margin:0;color:#64748b;font-size:13px;line-height:1.6;">Sin tarjeta de crédito. Cancela cuando quieras.</p>
        </td>
      </tr>
      <tr>
        <td style="background:#f8fafc;padding:20px 32px;border-top:1px solid #e2e8f0;">
          <p style="margin:0;color:#94a3b8;font-size:12px;text-align:center;">© 2026 TallerOS · <a href="https://www.tallerosapp.com" style="color:#94a3b8;">tallerosapp.com</a></p>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body>
</html>`
}

// ── Email 2: Día 2 — El problema del cobro no autorizado ─────────────────────
function email2(nombre: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 20px;">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
      <tr><td style="background:linear-gradient(135deg,#1e3a5f,#1d4ed8);padding:24px 32px;text-align:center;">
        <p style="margin:0;color:#fff;font-size:22px;font-weight:900;">TallerOS</p>
      </td></tr>
      <tr><td style="padding:40px 32px;">
        <p style="margin:0 0 16px;color:#0f172a;font-size:16px;font-weight:700;">Hola ${nombre.split(' ')[0]},</p>
        <p style="margin:0 0 16px;color:#334155;font-size:15px;line-height:1.7;">¿Sabes cuál es la queja #1 de los clientes de talleres mecánicos en LATAM?</p>
        <div style="background:#fef2f2;border-left:4px solid #ef4444;border-radius:8px;padding:16px 20px;margin-bottom:20px;">
          <p style="margin:0;color:#991b1b;font-size:16px;font-weight:700;">"Me cobraron cosas que yo nunca aprobé"</p>
        </div>
        <p style="margin:0 0 16px;color:#334155;font-size:15px;line-height:1.7;">El 63% de los clientes desconfía de los talleres mecánicos. Y la razón principal son los cobros sorpresa.</p>
        <p style="margin:0 0 16px;color:#334155;font-size:15px;line-height:1.7;">Cuando un mecánico detecta un problema adicional durante la reparación, lo más común es llamar al cliente y explicarle verbalmente. El cliente dice "sí" por teléfono y después niega haberlo aprobado.</p>
        <p style="margin:0 0 24px;color:#334155;font-size:15px;line-height:1.7;"><strong>¿La solución?</strong> Aprobación digital por WhatsApp con registro de fecha y hora. El cliente ve exactamente qué se va a hacer y a qué precio — y aprueba con un mensaje. Queda guardado para siempre.</p>
        <table cellpadding="0" cellspacing="0" style="margin:0 auto 24px;">
          <tr><td style="background:#2563eb;border-radius:12px;padding:14px 28px;">
            <a href="https://www.tallerosapp.com/registro" style="color:#fff;text-decoration:none;font-size:15px;font-weight:700;">Ver cómo funciona la aprobación por WhatsApp →</a>
          </td></tr>
        </table>
        <p style="margin:0 0 0;color:#64748b;font-size:13px;">Mañana te cuento cómo un taller en Monterrey eliminó el 100% de sus disputas con clientes en 30 días.</p>
      </td></tr>
      <tr><td style="background:#f8fafc;padding:16px 32px;border-top:1px solid #e2e8f0;">
        <p style="margin:0;color:#94a3b8;font-size:12px;text-align:center;">© 2026 TallerOS · <a href="https://www.tallerosapp.com" style="color:#94a3b8;">tallerosapp.com</a></p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`
}

// ── Email 3: Día 4 — Caso de éxito ───────────────────────────────────────────
function email3(nombre: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 20px;">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
      <tr><td style="background:linear-gradient(135deg,#1e3a5f,#1d4ed8);padding:24px 32px;text-align:center;">
        <p style="margin:0;color:#fff;font-size:22px;font-weight:900;">TallerOS</p>
      </td></tr>
      <tr><td style="padding:40px 32px;">
        <p style="margin:0 0 16px;color:#0f172a;font-size:16px;font-weight:700;">Hola ${nombre.split(' ')[0]},</p>
        <p style="margin:0 0 16px;color:#334155;font-size:15px;line-height:1.7;">Te prometí contarte sobre Roberto Garza, dueño del Taller Garza en Monterrey.</p>
        <div style="background:#f0fdf4;border-radius:12px;padding:20px 24px;margin-bottom:20px;border:1px solid #bbf7d0;">
          <p style="margin:0 0 8px;color:#166534;font-size:14px;font-weight:700;">⭐⭐⭐⭐⭐ Roberto Garza — Taller Garza, Monterrey MX</p>
          <p style="margin:0;color:#15803d;font-size:14px;line-height:1.7;font-style:italic;">"Desde que usamos TallerOS los clientes ya no llaman a preguntar cómo va su carro. El portal en tiempo real nos ahorró horas de atención telefónica. Y las reseñas en Google llegaron solas."</p>
        </div>
        <p style="margin:0 0 16px;color:#334155;font-size:15px;line-height:1.7;">Lo que cambió en su taller en 30 días:</p>
        ${['Cero disputas por cobros — todo aprobado por WhatsApp','Portal en tiempo real eliminó el 80% de llamadas entrantes','7 reseñas nuevas en Google en el primer mes','3 clientes inactivos regresaron por los recordatorios automáticos'].map(t => `
        <div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:10px;">
          <span style="color:#22c55e;font-weight:700;font-size:16px;flex-shrink:0;">✓</span>
          <p style="margin:0;color:#334155;font-size:14px;line-height:1.6;">${t}</p>
        </div>`).join('')}
        <p style="margin:24px 0 24px;color:#334155;font-size:15px;line-height:1.7;">Estos resultados no son de un taller grande. Roberto tiene 4 mecánicos. TallerOS funciona para talleres de cualquier tamaño.</p>
        <table cellpadding="0" cellspacing="0" style="margin:0 auto 24px;">
          <tr><td style="background:#2563eb;border-radius:12px;padding:14px 28px;">
            <a href="https://www.tallerosapp.com/registro" style="color:#fff;text-decoration:none;font-size:15px;font-weight:700;">Quiero estos resultados en mi taller →</a>
          </td></tr>
        </table>
      </td></tr>
      <tr><td style="background:#f8fafc;padding:16px 32px;border-top:1px solid #e2e8f0;">
        <p style="margin:0;color:#94a3b8;font-size:12px;text-align:center;">© 2026 TallerOS · <a href="https://www.tallerosapp.com" style="color:#94a3b8;">tallerosapp.com</a></p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`
}

// ── Email 4: Día 6 — Objeción de precio ──────────────────────────────────────
function email4(nombre: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 20px;">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
      <tr><td style="background:linear-gradient(135deg,#1e3a5f,#1d4ed8);padding:24px 32px;text-align:center;">
        <p style="margin:0;color:#fff;font-size:22px;font-weight:900;">TallerOS</p>
      </td></tr>
      <tr><td style="padding:40px 32px;">
        <p style="margin:0 0 16px;color:#0f172a;font-size:16px;font-weight:700;">Hola ${nombre.split(' ')[0]},</p>
        <p style="margin:0 0 16px;color:#334155;font-size:15px;line-height:1.7;">Sé lo que estás pensando: <strong>"¿Vale la pena pagar por un software?"</strong></p>
        <p style="margin:0 0 16px;color:#334155;font-size:15px;line-height:1.7;">Hagamos una cuenta rápida:</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;margin-bottom:20px;">
          <tr style="background:#f8fafc;">
            <td style="padding:12px 16px;font-size:13px;font-weight:700;color:#64748b;">QUÉ RECUPERAS</td>
            <td style="padding:12px 16px;font-size:13px;font-weight:700;color:#64748b;text-align:right;">VALOR MENSUAL</td>
          </tr>
          ${[
            ['1 cliente recuperado por recordatorio','$800–$2,000 MXN'],
            ['1 disputa de cobro evitada','$500–$3,000 MXN'],
            ['2 clientes nuevos por reseñas en Google','$1,600–$4,000 MXN'],
            ['Horas de llamadas eliminadas (portal)','$1,000–$2,000 MXN'],
          ].map(([q, v]) => `
          <tr style="border-top:1px solid #f1f5f9;">
            <td style="padding:12px 16px;font-size:14px;color:#334155;">${q}</td>
            <td style="padding:12px 16px;font-size:14px;color:#22c55e;font-weight:700;text-align:right;">${v}</td>
          </tr>`).join('')}
          <tr style="background:#f0fdf4;border-top:2px solid #22c55e;">
            <td style="padding:14px 16px;font-size:15px;font-weight:800;color:#0f172a;">Total recuperado</td>
            <td style="padding:14px 16px;font-size:15px;font-weight:800;color:#16a34a;text-align:right;">$3,900–$11,000 MXN/mes</td>
          </tr>
        </table>
        <p style="margin:0 0 8px;color:#334155;font-size:15px;line-height:1.7;">TallerOS Plan Esencial cuesta <strong>$24 USD/mes</strong> (~$480 MXN).</p>
        <p style="margin:0 0 24px;color:#334155;font-size:15px;line-height:1.7;">Si recuperas aunque sea <strong>un solo cliente</strong> al mes, ya pagaste el año completo.</p>
        <table cellpadding="0" cellspacing="0" style="margin:0 auto 24px;">
          <tr><td style="background:#2563eb;border-radius:12px;padding:14px 28px;">
            <a href="https://www.tallerosapp.com/registro" style="color:#fff;text-decoration:none;font-size:15px;font-weight:700;">Empezar 14 días gratis — sin tarjeta →</a>
          </td></tr>
        </table>
      </td></tr>
      <tr><td style="background:#f8fafc;padding:16px 32px;border-top:1px solid #e2e8f0;">
        <p style="margin:0;color:#94a3b8;font-size:12px;text-align:center;">© 2026 TallerOS · <a href="https://www.tallerosapp.com" style="color:#94a3b8;">tallerosapp.com</a></p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`
}

// ── Email 5: Día 8 — Última llamada ──────────────────────────────────────────
function email5(nombre: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 20px;">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
      <tr><td style="background:linear-gradient(135deg,#1e3a5f,#1d4ed8);padding:24px 32px;text-align:center;">
        <p style="margin:0;color:#fff;font-size:22px;font-weight:900;">TallerOS</p>
      </td></tr>
      <tr><td style="padding:40px 32px;">
        <p style="margin:0 0 16px;color:#0f172a;font-size:16px;font-weight:700;">Hola ${nombre.split(' ')[0]},</p>
        <p style="margin:0 0 16px;color:#334155;font-size:15px;line-height:1.7;">Este es mi último email de esta serie.</p>
        <p style="margin:0 0 16px;color:#334155;font-size:15px;line-height:1.7;">Esta semana te compartí los 5 errores que le cuestan clientes a los talleres, cómo eliminar las disputas por cobros, los resultados reales de un taller en Monterrey y por qué TallerOS se paga solo desde el primer mes.</p>
        <p style="margin:0 0 24px;color:#334155;font-size:15px;line-height:1.7;">Si todavía no has dado el paso, quiero darte una razón más para hacerlo hoy:</p>
        <div style="background:linear-gradient(135deg,#1e3a5f,#1d4ed8);border-radius:14px;padding:24px;text-align:center;margin-bottom:24px;">
          <p style="margin:0 0 8px;color:#93c5fd;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">Oferta de lanzamiento</p>
          <p style="margin:0 0 4px;color:#fff;font-size:28px;font-weight:900;">50% de descuento</p>
          <p style="margin:0 0 16px;color:#bfdbfe;font-size:14px;">Por tiempo limitado — precio sube pronto</p>
          <a href="https://www.tallerosapp.com/registro" style="display:inline-block;background:#fff;color:#1d4ed8;padding:13px 28px;border-radius:10px;text-decoration:none;font-size:15px;font-weight:800;">Empezar ahora con 50% OFF →</a>
        </div>
        <p style="margin:0 0 16px;color:#334155;font-size:14px;line-height:1.7;">Si tienes cualquier duda, responde este email directamente. Lo leo yo personalmente.</p>
        <p style="margin:0;color:#334155;font-size:14px;">Un abrazo,<br/><strong>El equipo de TallerOS</strong></p>
      </td></tr>
      <tr><td style="background:#f8fafc;padding:16px 32px;border-top:1px solid #e2e8f0;">
        <p style="margin:0;color:#94a3b8;font-size:12px;text-align:center;">© 2026 TallerOS · <a href="https://www.tallerosapp.com" style="color:#94a3b8;">tallerosapp.com</a></p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`
}

async function sendEmail(to: string, toName: string, subject: string, html: string): Promise<boolean> {
  try {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': BREVO_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sender: { name: SENDER_NAME, email: SENDER_EMAIL },
        to: [{ email: to, name: toName }],
        subject,
        htmlContent: html,
      }),
    })
    return res.ok
  } catch {
    return false
  }
}

async function addContactToBrevo(email: string, nombre: string): Promise<void> {
  try {
    await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: {
        'api-key': BREVO_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        attributes: { FIRSTNAME: nombre.split(' ')[0], LASTNAME: nombre.split(' ').slice(1).join(' ') || '' },
        listIds: [2], // Lista principal de TallerOS
        updateEnabled: true,
      }),
    })
  } catch {}
}

export async function POST(req: NextRequest) {
  try {
    const { nombre, email } = await req.json()

    if (!nombre || !email) {
      return NextResponse.json({ ok: false, error: 'Faltan datos' }, { status: 400 })
    }

    // 1. Agregar a Brevo
    await addContactToBrevo(email, nombre)

    // 2. Email 1 — Inmediato
    await sendEmail(email, nombre, '📥 Aquí está tu guía gratuita — 5 errores que cuestan clientes', email1(nombre))

    // 3. Programar emails 2-5 con delay via Brevo transactional
    // Los scheduledAt deben ser en el futuro
    const now = new Date()

    const schedule = [
      { days: 2,  subject: '❌ El error #1 que más dinero les cuesta a los talleres',           html: email2(nombre) },
      { days: 4,  subject: '⭐ Cómo el Taller Garza eliminó el 100% de sus disputas en 30 días', html: email3(nombre) },
      { days: 6,  subject: '💰 ¿Vale la pena pagar por un software? (la cuenta rápida)',         html: email4(nombre) },
      { days: 8,  subject: '🔥 Última llamada — oferta de lanzamiento 50% OFF',                  html: email5(nombre) },
    ]

    for (const item of schedule) {
      const scheduledAt = new Date(now.getTime() + item.days * 24 * 60 * 60 * 1000)
      try {
        await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: {
            'api-key': BREVO_API_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sender:      { name: SENDER_NAME, email: SENDER_EMAIL },
            to:          [{ email, name: nombre }],
            subject:     item.subject,
            htmlContent: item.html,
            scheduledAt: scheduledAt.toISOString(),
          }),
        })
      } catch {}
    }

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('Funnel error:', error)
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }
}
