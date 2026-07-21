import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const maxDuration = 60
import { createPublicReadClient } from '@/lib/supabase-public'

// ── Helpers ───────────────────────────────────────────────────────────────────

async function enviarEmail(to: string, nombre: string, subject: string, html: string) {
  try {
    await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': process.env.BREVO_API_KEY!, 'Content-Type': 'application/json' },
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
    const sid = process.env.TWILIO_ACCOUNT_SID!
    const tel = telefono.replace(/\D/g, '')
    const to  = tel.length === 10 ? `+52${tel}` : `+${tel}`
    const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`
    await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${sid}:${process.env.TWILIO_AUTH_TOKEN!}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ From: `whatsapp:${process.env.TWILIO_WHATSAPP_FROM!}`, To: `whatsapp:${to}`, Body: mensaje }).toString(),
    })
  } catch (e) { console.error('WhatsApp error:', e) }
}

function horasDesde(fecha: string): number {
  return (Date.now() - new Date(fecha).getTime()) / (1000 * 60 * 60)
}

// ── Templates de mensajes ─────────────────────────────────────────────────────

function emailPaso1(nombre: string, tallerNombre: string): string {
  return `
  <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(135deg,#1e3a5f,#1d4ed8);padding:28px;text-align:center;">
      <p style="margin:0;color:#fff;font-size:22px;font-weight:900;">TallerOS</p>
    </div>
    <div style="padding:36px 32px;">
      <p style="color:#0f172a;font-size:16px;font-weight:700;margin-bottom:12px;">Hola ${nombre} 👋</p>
      <p style="color:#334155;font-size:15px;line-height:1.7;margin-bottom:16px;">
        Notamos que <strong>${tallerNombre}</strong> aún no ha completado la configuración inicial.
        Solo toma 3 minutos y es el primer paso para que TallerOS funcione perfectamente para ti.
      </p>
      <p style="color:#334155;font-size:15px;line-height:1.7;margin-bottom:24px;">
        📋 <strong>Qué te falta completar:</strong><br/>
        ✅ Configurar tu taller (nombre, moneda, logo)<br/>
        ⬜ Agregar tu primer cliente<br/>
        ⬜ Crear tu primera orden de trabajo
      </p>
      <a href="https://www.tallerosapp.com/configuracion" style="display:inline-block;background:#2563eb;color:#fff;padding:13px 28px;border-radius:10px;text-decoration:none;font-size:15px;font-weight:700;">
        Completar configuración →
      </a>
      <p style="color:#64748b;font-size:13px;margin-top:20px;">
        ¿Tienes dudas? Responde este email y te ayudamos en minutos.
      </p>
    </div>
  </div>`
}

function emailPaso2(nombre: string, tallerNombre: string): string {
  return `
  <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(135deg,#1e3a5f,#1d4ed8);padding:28px;text-align:center;">
      <p style="margin:0;color:#fff;font-size:22px;font-weight:900;">TallerOS</p>
    </div>
    <div style="padding:36px 32px;">
      <p style="color:#0f172a;font-size:16px;font-weight:700;margin-bottom:12px;">Hola ${nombre} 👋</p>
      <p style="color:#334155;font-size:15px;line-height:1.7;margin-bottom:16px;">
        ¡Excelente! Ya configuraste <strong>${tallerNombre}</strong>. El siguiente paso es agregar tu primer cliente.
      </p>
      <p style="color:#334155;font-size:15px;line-height:1.7;margin-bottom:24px;">
        Cuando agregues un cliente, TallerOS le envía automáticamente un mensaje de bienvenida por WhatsApp. Es la primera impresión de tu taller digital. 💬
      </p>
      <a href="https://www.tallerosapp.com/clientes" style="display:inline-block;background:#2563eb;color:#fff;padding:13px 28px;border-radius:10px;text-decoration:none;font-size:15px;font-weight:700;">
        Agregar primer cliente →
      </a>
    </div>
  </div>`
}

function emailPaso3(nombre: string, tallerNombre: string): string {
  return `
  <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(135deg,#1e3a5f,#1d4ed8);padding:28px;text-align:center;">
      <p style="margin:0;color:#fff;font-size:22px;font-weight:900;">TallerOS</p>
    </div>
    <div style="padding:36px 32px;">
      <p style="color:#0f172a;font-size:16px;font-weight:700;margin-bottom:12px;">¡Ya casi llegas, ${nombre}! 🚀</p>
      <p style="color:#334155;font-size:15px;line-height:1.7;margin-bottom:16px;">
        Ya tienes clientes registrados en <strong>${tallerNombre}</strong>. Solo falta crear tu primera orden de trabajo para que el taller empiece a operar completamente en TallerOS.
      </p>
      <p style="color:#334155;font-size:15px;line-height:1.7;margin-bottom:24px;">
        Una orden de trabajo te permite rastrear el estado del vehículo, agregar fotos del diagnóstico y enviar la cotización al cliente por WhatsApp para que la apruebe. 🔧
      </p>
      <a href="https://www.tallerosapp.com/ordenes" style="display:inline-block;background:#2563eb;color:#fff;padding:13px 28px;border-radius:10px;text-decoration:none;font-size:15px;font-weight:700;">
        Crear primera orden →
      </a>
    </div>
  </div>`
}

function emailInactivo48h(nombre: string, tallerNombre: string): string {
  return `
  <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(135deg,#7c3aed,#4f46e5);padding:28px;text-align:center;">
      <p style="margin:0;color:#fff;font-size:22px;font-weight:900;">TallerOS</p>
    </div>
    <div style="padding:36px 32px;">
      <p style="color:#0f172a;font-size:16px;font-weight:700;margin-bottom:12px;">Hola ${nombre}, ¿necesitas ayuda? 🤝</p>
      <p style="color:#334155;font-size:15px;line-height:1.7;margin-bottom:16px;">
        Notamos que llevas 2 días sin entrar a <strong>${tallerNombre}</strong> en TallerOS. Queremos asegurarnos de que todo esté bien y que puedas aprovechar al máximo tu prueba gratuita.
      </p>
      <p style="color:#334155;font-size:15px;line-height:1.7;margin-bottom:24px;">
        ¿Hay algo que no quedó claro? ¿Tienes alguna duda? Responde este email directamente — lo lee una persona real y te respondemos en menos de 2 horas. ⚡
      </p>
      <a href="https://www.tallerosapp.com/dashboard" style="display:inline-block;background:#7c3aed;color:#fff;padding:13px 28px;border-radius:10px;text-decoration:none;font-size:15px;font-weight:700;">
        Volver a TallerOS →
      </a>
      <p style="color:#64748b;font-size:13px;margin-top:20px;">
        Tu prueba gratuita de 14 días sigue activa. No pierdas el tiempo que te queda.
      </p>
    </div>
  </div>`
}

function waPaso(nombre: string, paso: number, url: string): string {
  const msgs: Record<number, string> = {
    1: `¡Hola ${nombre}! 👋 Soy el asistente de *TallerOS*. Notamos que aún no has completado la configuración de tu taller. Solo toma 3 minutos. Entra aquí: ${url}`,
    2: `¡Hola ${nombre}! 🎉 Ya configuraste tu taller en *TallerOS*. El siguiente paso es agregar tu primer cliente. Cuando lo hagas, le llega un WhatsApp de bienvenida automático. Entra aquí: ${url}`,
    3: `¡Casi listo ${nombre}! 🚀 Ya tienes clientes en *TallerOS*. Solo falta crear tu primera orden de trabajo para operar al 100%. Entra aquí: ${url}`,
  }
  return msgs[paso] ?? ''
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
    // Obtener todos los talleres con sus usuarios propietarios
    const { data: talleres } = await supabase
      .from('talleres')
      .select(`
        id, nombre, created_at,
        usuarios!inner(id, nombre, email, telefono, rol),
        clientes(count),
        ordenes(count)
      `)
      .order('created_at', { ascending: false })

    if (!talleres) return NextResponse.json({ ok: true, procesados: 0 })

    for (const taller of talleres) {
      const propietario = (taller.usuarios as any[]).find((u: any) => u.rol === 'propietario')
      if (!propietario) continue

      const horas         = horasDesde(taller.created_at)
      const tieneClientes = (taller.clientes as any)?.[0]?.count > 0
      const tieneOrdenes  = (taller.ordenes as any)?.[0]?.count > 0
      const nombre        = propietario.nombre?.split(' ')[0] ?? 'Hola'
      const email         = propietario.email
      const telefono      = propietario.telefono

      // ── Paso 1: Sin clientes ni órdenes — 24h después del registro ──
      if (horas >= 24 && horas < 36 && !tieneClientes) {
        if (email) {
          await enviarEmail(email, nombre,
            '⚙️ Completa la configuración de tu taller — TallerOS',
            emailPaso1(nombre, taller.nombre)
          )
        }
        if (telefono) {
          await enviarWhatsApp(telefono, waPaso(nombre, 1, 'https://www.tallerosapp.com/configuracion'))
        }
        resultados.push({ taller: taller.nombre, accion: 'paso1_24h' })
      }

      // ── Paso 2: Tiene configuración pero sin clientes — 36h ──
      if (horas >= 36 && horas < 48 && !tieneClientes) {
        if (email) {
          await enviarEmail(email, nombre,
            '👥 Agrega tu primer cliente en TallerOS',
            emailPaso2(nombre, taller.nombre)
          )
        }
        if (telefono) {
          await enviarWhatsApp(telefono, waPaso(nombre, 2, 'https://www.tallerosapp.com/clientes'))
        }
        resultados.push({ taller: taller.nombre, accion: 'paso2_36h' })
      }

      // ── Paso 3: Tiene clientes pero sin órdenes — 48h ──
      if (horas >= 48 && horas < 60 && tieneClientes && !tieneOrdenes) {
        if (email) {
          await enviarEmail(email, nombre,
            '🔧 Crea tu primera orden de trabajo — TallerOS',
            emailPaso3(nombre, taller.nombre)
          )
        }
        if (telefono) {
          await enviarWhatsApp(telefono, waPaso(nombre, 3, 'https://www.tallerosapp.com/ordenes'))
        }
        resultados.push({ taller: taller.nombre, accion: 'paso3_48h' })
      }

      // ── Inactivo 48h: sin clientes Y sin órdenes — alerta a Ivan ──
      if (horas >= 48 && horas < 60 && !tieneClientes && !tieneOrdenes) {
        if (email) {
          await enviarEmail(email, nombre,
            '¿Necesitas ayuda con TallerOS? Estamos aquí 🤝',
            emailInactivo48h(nombre, taller.nombre)
          )
        }
        // Notificar a Ivan también
        await enviarEmail(
          'hola@tallerosapp.com',
          'Ivan',
          `⚠️ Usuario inactivo 48h: ${taller.nombre}`,
          `<p>El taller <strong>${taller.nombre}</strong> (${email}) lleva 48 horas sin completar ningún paso del onboarding. Podría necesitar ayuda personal.</p>`
        )
        resultados.push({ taller: taller.nombre, accion: 'inactivo_48h_alerta' })
      }
    }

    return NextResponse.json({ ok: true, procesados: talleres.length, acciones: resultados })
  } catch (error: any) {
    console.error('Onboarding agent error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
