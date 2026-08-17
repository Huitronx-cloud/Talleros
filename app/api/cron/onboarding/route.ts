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
//
// Reescritos el 2026-08-17. Los anteriores hablaban de una cuenta vacía —"aún
// no has completado la configuración", "⬜ agregar tu primer cliente"— pero
// desde la migración 042 el taller entra y ya ve 2 clientes y 1 orden de
// ejemplo. El correo contradecía la pantalla, que es la forma más rápida de
// que dejen de leerte.
//
// Ahora son TRES y cada uno tiene un solo trabajo. Antes eran cuatro, pero el
// paso 1 y el paso 2 disparaban con la misma condición (!tieneClientes), así
// que competían por el mismo momento y con un cron diario nunca llegaban los
// dos.

function emailPrimerClienteReal(nombre: string, tallerNombre: string): string {
  return `  <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(135deg,#1e3a5f,#1d4ed8);padding:28px;text-align:center;">
      <p style="margin:0;color:#fff;font-size:22px;font-weight:900;">TallerOS</p>
    </div>
    <div style="padding:36px 32px;">
      <p style="color:#0f172a;font-size:16px;font-weight:700;margin-bottom:12px;">Hola ${nombre} 👋</p>
      <p style="color:#334155;font-size:15px;line-height:1.7;margin-bottom:16px;">
        Cuando creaste <strong>${tallerNombre}</strong> te dejamos dos clientes y una orden de ejemplo, para que no entraras a una pantalla en blanco. Sirven para mirar, no para trabajar.
      </p>
      <p style="color:#334155;font-size:15px;line-height:1.7;margin-bottom:16px;">
        El siguiente paso es meter <strong>un cliente de verdad</strong>: el próximo que te deje el carro. Son dos minutos y a partir de ahí el taller ya está corriendo en TallerOS.
      </p>
      <a href="https://www.tallerosapp.com/clientes" style="display:inline-block;background:#2563eb;color:#fff;padding:13px 28px;border-radius:10px;text-decoration:none;font-size:15px;font-weight:700;">
        Registrar un cliente real →
      </a>
      <p style="color:#334155;font-size:15px;line-height:1.7;margin-bottom:16px;">
        Los de ejemplo puedes borrarlos cuando quieras, y no gastan tu cupo del plan.
      </p>
      <p style="color:#64748b;font-size:13px;margin-top:20px;">
        ¿Se te atoró algo? Responde este correo y te contesto yo.
      </p>
    </div>
  </div>`
}

function emailPrimeraOrdenReal(nombre: string, tallerNombre: string): string {
  return `  <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(135deg,#1e3a5f,#1d4ed8);padding:28px;text-align:center;">
      <p style="margin:0;color:#fff;font-size:22px;font-weight:900;">TallerOS</p>
    </div>
    <div style="padding:36px 32px;">
      <p style="color:#0f172a;font-size:16px;font-weight:700;margin-bottom:12px;">Vas bien, ${nombre} 🔧</p>
      <p style="color:#334155;font-size:15px;line-height:1.7;margin-bottom:16px;">
        Ya tienes clientes de verdad en <strong>${tallerNombre}</strong>. Falta la parte que cambia tu día: la primera orden de trabajo.
      </p>
      <p style="color:#334155;font-size:15px;line-height:1.7;margin-bottom:16px;">
        La orden es donde vive el dinero. Ahí anotas qué entró, qué se le hizo y cuánto se cobra, el cliente ve el avance en su portal sin llamarte, y la aprobación te llega por WhatsApp sin perseguir a nadie.
      </p>
      <a href="https://www.tallerosapp.com/ordenes/nueva" style="display:inline-block;background:#2563eb;color:#fff;padding:13px 28px;border-radius:10px;text-decoration:none;font-size:15px;font-weight:700;">
        Crear mi primera orden →
      </a>
      <p style="color:#334155;font-size:15px;line-height:1.7;margin-bottom:16px;">
        Con la del próximo carro que entre basta. No hace falta capturar el historial.
      </p>
      <p style="color:#64748b;font-size:13px;margin-top:20px;">
        ¿Se te atoró algo? Responde este correo y te contesto yo.
      </p>
    </div>
  </div>`
}

function emailSinArrancar(nombre: string, tallerNombre: string): string {
  return `  <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(135deg,#1e3a5f,#1d4ed8);padding:28px;text-align:center;">
      <p style="margin:0;color:#fff;font-size:22px;font-weight:900;">TallerOS</p>
    </div>
    <div style="padding:36px 32px;">
      <p style="color:#0f172a;font-size:16px;font-weight:700;margin-bottom:12px;">${nombre}, ¿qué te frenó?</p>
      <p style="color:#334155;font-size:15px;line-height:1.7;margin-bottom:16px;">
        Registraste <strong>${tallerNombre}</strong> hace un par de días y no has llegado a meter un cliente ni una orden. Eso casi nunca es falta de ganas: normalmente es que algo no quedó claro, o que el día no dio.
      </p>
      <p style="color:#334155;font-size:15px;line-height:1.7;margin-bottom:16px;">
        Te lo pregunto en serio, y contesto yo: <strong>¿qué fue?</strong> Responde este correo con una línea. Si prefieres que te lo enseñe en vivo, agendamos quince minutos y lo dejamos configurado juntos.
      </p>
      <a href="https://www.tallerosapp.com/clientes" style="display:inline-block;background:#2563eb;color:#fff;padding:13px 28px;border-radius:10px;text-decoration:none;font-size:15px;font-weight:700;">
        Prefiero intentarlo yo →
      </a>
      <p style="color:#334155;font-size:15px;line-height:1.7;margin-bottom:16px;">
        Y si simplemente no era para ti, dímelo también. Tu cuenta se queda abierta en el plan gratis, no se borra nada.
      </p>
    </div>
  </div>`
}


function waPaso(nombre: string, paso: number, url: string): string {
  const msgs: Record<number, string> = {
    1: `Hola ${nombre} 👋 Soy el asistente de *TallerOS*. Los dos clientes y la orden que ves en tu cuenta son de ejemplo. Cuando metas uno real —el próximo carro que te dejen— el taller ya está corriendo. Son dos minutos: ${url}`,
    2: `Hola ${nombre} 🔧 Ya tienes clientes de verdad en *TallerOS*. Falta la primera orden de trabajo, que es donde vive el dinero: qué entró, qué se hizo y cuánto se cobra. Con la del próximo carro basta: ${url}`,
    3: `Hola ${nombre}, registraste tu taller hace un par de días y no has llegado a meter un cliente ni una orden. ¿Qué te frenó? Respóndeme por aquí y te ayudo, o si prefieres lo intentas tú: ${url}`,
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
        usuarios!inner(id, nombre, email, telefono, rol)
      `)
      .order('created_at', { ascending: false })

    if (!talleres) return NextResponse.json({ ok: true, procesados: 0 })

    // Los conteos van APARTE y filtrando es_ejemplo.
    //
    // Antes se pedían incrustados —clientes(count), ordenes(count)— sin filtro
    // alguno. Desde que cada alta nace con 2 clientes y 1 orden de ejemplo
    // (migración 042), esos conteos nunca daban cero, así que las cuatro etapas
    // de abajo, que todas exigen "todavía no tiene", dejaron de dispararse. Los
    // crons corrían, no fallaban, y no mandaban nada: cinco correos y sus
    // WhatsApp muertos en silencio desde el 2026-08-03.
    //
    // Dos consultas en bloque y un Set, en vez de una por taller: con 73
    // talleres, preguntar de uno en uno serían 146 viajes en una función que
    // tiene 60 segundos.
    const [clientesReales, ordenesReales] = await Promise.all([
      supabase.from('clientes').select('taller_id').eq('es_ejemplo', false),
      supabase.from('ordenes').select('taller_id').eq('es_ejemplo', false),
    ])
    const conClientes = new Set((clientesReales.data ?? []).map(c => c.taller_id))
    const conOrdenes  = new Set((ordenesReales.data ?? []).map(o => o.taller_id))

    for (const taller of talleres) {
      const propietario = (taller.usuarios as any[]).find((u: any) => u.rol === 'propietario')
      if (!propietario) continue

      const horas         = horasDesde(taller.created_at)
      const tieneClientes = conClientes.has(taller.id)
      const tieneOrdenes  = conOrdenes.has(taller.id)
      const nombre        = propietario.nombre?.split(' ')[0] ?? 'Hola'
      const email         = propietario.email
      const telefono      = propietario.telefono

      // Las ventanas duran 24 h, no 12, porque el cron corre una vez al día:
      // con ventanas de 12 h cada taller caía en unas y se saltaba otras según
      // la hora a la que se hubiera registrado, y nadie recibía la secuencia
      // completa. Con 24 h, cada taller pasa por cada etapa exactamente una vez.

      // ── Día 1: todavía sin un cliente real ──
      if (horas >= 24 && horas < 48 && !tieneClientes) {
        if (email) {
          await enviarEmail(email, nombre,
            `${nombre}, mete un cliente de verdad en ${taller.nombre}`,
            emailPrimerClienteReal(nombre, taller.nombre)
          )
        }
        if (telefono) {
          await enviarWhatsApp(telefono, waPaso(nombre, 1, 'https://www.tallerosapp.com/clientes'))
        }
        resultados.push({ taller: taller.nombre, accion: 'primer_cliente_real' })
      }

      // ── Día 2: ya tiene clientes reales, pero ninguna orden real ──
      if (horas >= 48 && horas < 72 && tieneClientes && !tieneOrdenes) {
        if (email) {
          await enviarEmail(email, nombre,
            `Ya tienes clientes en ${taller.nombre}. Falta la orden.`,
            emailPrimeraOrdenReal(nombre, taller.nombre)
          )
        }
        if (telefono) {
          await enviarWhatsApp(telefono, waPaso(nombre, 2, 'https://www.tallerosapp.com/ordenes/nueva'))
        }
        resultados.push({ taller: taller.nombre, accion: 'primera_orden_real' })
      }

      // ── Día 2: no arrancó con nada ──
      if (horas >= 48 && horas < 72 && !tieneClientes && !tieneOrdenes) {
        if (email) {
          await enviarEmail(email, nombre,
            `${nombre}, ¿qué te frenó con ${taller.nombre}?`,
            emailSinArrancar(nombre, taller.nombre)
          )
        }
        if (telefono) {
          await enviarWhatsApp(telefono, waPaso(nombre, 3, 'https://www.tallerosapp.com/clientes'))
        }
        // Avisar a Ivan: este es el que conviene llamar a mano
        await enviarEmail(
          'hola@tallerosapp.com',
          'Ivan',
          `⚠️ Sin arrancar a las 48h: ${taller.nombre}`,
          `<p>El taller <strong>${taller.nombre}</strong> (${email}) lleva dos días sin crear ningún cliente ni orden reales. Se le acaba de mandar el correo preguntándole qué lo frenó — vale la pena responder tú si contesta.</p>`
        )
        resultados.push({ taller: taller.nombre, accion: 'sin_arrancar_48h' })
      }
    }

    return NextResponse.json({ ok: true, procesados: talleres.length, acciones: resultados })
  } catch (error: any) {
    console.error('Onboarding agent error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
