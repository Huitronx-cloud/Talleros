import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const GOOGLE_API_KEY = process.env.GOOGLE_MAPS_API_KEY!
const BREVO_API_KEY  = process.env.BREVO_API_KEY!
const TWILIO_SID     = process.env.TWILIO_ACCOUNT_SID!
const TWILIO_TOKEN   = process.env.TWILIO_AUTH_TOKEN!
const TWILIO_FROM    = process.env.TWILIO_WHATSAPP_FROM!

// ── Ciudades objetivo ─────────────────────────────────────────────────────────
// El agente rota entre ciudades cada día para maximizar cobertura
const CIUDADES = [
  // México
  { nombre: 'Ciudad de México, México',   pais: 'MX', idioma: 'es' },
  { nombre: 'Monterrey, Nuevo León',       pais: 'MX', idioma: 'es' },
  { nombre: 'Guadalajara, Jalisco',        pais: 'MX', idioma: 'es' },
  { nombre: 'Puebla, México',              pais: 'MX', idioma: 'es' },
  { nombre: 'Tijuana, Baja California',    pais: 'MX', idioma: 'es' },
  // Colombia
  { nombre: 'Bogotá, Colombia',            pais: 'CO', idioma: 'es' },
  { nombre: 'Medellín, Colombia',          pais: 'CO', idioma: 'es' },
  { nombre: 'Cali, Colombia',              pais: 'CO', idioma: 'es' },
  // Perú
  { nombre: 'Lima, Perú',                  pais: 'PE', idioma: 'es' },
  { nombre: 'Arequipa, Perú',              pais: 'PE', idioma: 'es' },
]

const TERMINOS_BUSQUEDA = [
  'taller mecánico',
  'taller automotriz',
  'mecánica automotriz',
  'servicio automotriz',
]

// ── Tipos ─────────────────────────────────────────────────────────────────────
interface Prospecto {
  nombre: string
  telefono: string | null
  email: string | null
  direccion: string | null
  ciudad: string
  pais: string
  google_place_id: string
  website: string | null
  rating: number | null
}

// ── Google Places API ─────────────────────────────────────────────────────────
async function buscarTalleres(ciudad: string, termino: string): Promise<any[]> {
  try {
    const query   = encodeURIComponent(`${termino} en ${ciudad}`)
    const url     = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${query}&key=${GOOGLE_API_KEY}&language=es&type=car_repair`
    const res     = await fetch(url)
    const data    = await res.json()
    return data.results ?? []
  } catch {
    return []
  }
}

async function obtenerDetalles(placeId: string): Promise<any> {
  try {
    const fields = 'name,formatted_phone_number,website,rating,formatted_address,url'
    const url    = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&key=${GOOGLE_API_KEY}&language=es`
    const res    = await fetch(url)
    const data   = await res.json()
    return data.result ?? null
  } catch {
    return null
  }
}

// ── Verificar si ya fue contactado ───────────────────────────────────────────
async function yaContactado(placeId: string): Promise<boolean> {
  try {
    const { data } = await supabase
      .from('prospectos_enviados')
      .select('id')
      .eq('google_place_id', placeId)
      .single()
    return !!data
  } catch {
    return false
  }
}

async function registrarContacto(prospecto: Prospecto): Promise<void> {
  try {
    await supabase.from('prospectos_enviados').insert({
      nombre:          prospecto.nombre,
      telefono:        prospecto.telefono,
      email:           prospecto.email,
      direccion:       prospecto.direccion,
      ciudad:          prospecto.ciudad,
      pais:            prospecto.pais,
      google_place_id: prospecto.google_place_id,
      website:         prospecto.website,
      rating:          prospecto.rating,
      contactado_at:   new Date().toISOString(),
    })
  } catch (e) {
    console.error('Error registrando prospecto:', e)
  }
}

// ── Agregar a Brevo ───────────────────────────────────────────────────────────
async function agregarABrevo(prospecto: Prospecto): Promise<void> {
  if (!prospecto.email) return
  try {
    await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: { 'api-key': BREVO_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email:      prospecto.email,
        attributes: {
          FIRSTNAME:   prospecto.nombre,
          CIUDAD:      prospecto.ciudad,
          PAIS:        prospecto.pais,
          TELEFONO:    prospecto.telefono ?? '',
          TIPO_LEAD:   'prospecto_google_maps',
        },
        listIds:       [3], // Lista separada para prospectos fríos
        updateEnabled: true,
      }),
    })

    // Enviar email de prospección frío
    await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': BREVO_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sender:      { name: 'TallerOS', email: 'hola@tallerosapp.com' },
        to:          [{ email: prospecto.email, name: prospecto.nombre }],
        subject:     `${prospecto.nombre} — ¿Todavía usas papel y llamadas para gestionar tu taller?`,
        htmlContent: emailFrio(prospecto),
      }),
    })
  } catch (e) {
    console.error('Brevo error:', e)
  }
}

// ── WhatsApp frío ─────────────────────────────────────────────────────────────
async function enviarWhatsAppFrio(prospecto: Prospecto): Promise<void> {
  if (!prospecto.telefono) return
  try {
    const tel = prospecto.telefono.replace(/\D/g, '')
    const to  = tel.startsWith('+') ? tel : `+${tel}`
    const msg = `Hola, ¿habla con ${prospecto.nombre}? 👋\n\nSoy Ivan de *TallerOS* — un software para talleres mecánicos que permite que tus clientes aprueben reparaciones por WhatsApp, vean el avance de su vehículo en tiempo real y te dejen reseñas en Google automáticamente.\n\n¿Te gustaría ver una demo de 10 minutos? Es completamente gratis. 🔧\n\nwww.tallerosapp.com/guia`

    const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`
    await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${TWILIO_SID}:${TWILIO_TOKEN}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        From: `whatsapp:+15559828390`,
        To:   `whatsapp:${to}`,
        Body: msg,
      }).toString(),
    })
  } catch (e) {
    console.error('WhatsApp error:', e)
  }
}

// ── Email frío ────────────────────────────────────────────────────────────────
function emailFrio(p: Prospecto): string {
  return `
<div style="font-family:'Segoe UI',Arial,sans-serif;max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
  <div style="background:linear-gradient(135deg,#1e3a5f,#1d4ed8);padding:28px;text-align:center;">
    <p style="margin:0;color:#fff;font-size:22px;font-weight:900;">TallerOS</p>
    <p style="margin:6px 0 0;color:#93c5fd;font-size:13px;">Software para talleres mecánicos</p>
  </div>
  <div style="padding:36px 32px;">
    <p style="color:#0f172a;font-size:16px;font-weight:700;margin-bottom:12px;">Hola equipo de ${p.nombre} 👋</p>
    <p style="color:#334155;font-size:15px;line-height:1.7;margin-bottom:16px;">
      Encontré su taller en Google Maps y quería compartirles algo que está cambiando la forma en que operan los talleres mecánicos en ${p.ciudad}.
    </p>
    <p style="color:#334155;font-size:15px;line-height:1.7;margin-bottom:20px;">
      <strong>TallerOS</strong> es un software que permite:
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      ${[
        ['✅','Que tus clientes aprueben reparaciones por WhatsApp — con registro digital'],
        ['⭐','Solicitar reseñas en Google automáticamente al entregar cada vehículo'],
        ['📱','Que el cliente vea el avance de su vehículo en tiempo real desde su celular'],
        ['🔔','Recordatorios automáticos de mantenimiento cada 3-6 meses'],
      ].map(([icon, txt]) => `
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #f1f5f9;font-size:14px;color:#0f172a;">
          ${icon} ${txt}
        </td>
      </tr>`).join('')}
    </table>
    <p style="color:#334155;font-size:15px;line-height:1.7;margin-bottom:24px;">
      El 63% de los clientes desconfía de los talleres. TallerOS resuelve eso con transparencia y tecnología.
    </p>
    <a href="https://www.tallerosapp.com/registro" style="display:inline-block;background:#2563eb;color:#fff;padding:13px 28px;border-radius:10px;text-decoration:none;font-size:15px;font-weight:700;">
      Ver demo gratis 14 días →
    </a>
    <p style="color:#64748b;font-size:13px;margin-top:20px;">
      Sin tarjeta de crédito. Cancela cuando quieras. Soporte en español.
    </p>
  </div>
  <div style="background:#f8fafc;padding:16px 32px;border-top:1px solid #e2e8f0;">
    <p style="margin:0;color:#94a3b8;font-size:12px;text-align:center;">
      © 2026 TallerOS · <a href="https://www.tallerosapp.com" style="color:#94a3b8;">tallerosapp.com</a>
      · <a href="https://www.tallerosapp.com/baja?email={{email}}" style="color:#94a3b8;">Dar de baja</a>
    </p>
  </div>
</div>`
}

// ── Handler principal ─────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Elegir ciudad del día basado en el día del mes
  const diaDelMes   = new Date().getDate()
  const ciudadHoy   = CIUDADES[diaDelMes % CIUDADES.length]
  const terminoHoy  = TERMINOS_BUSQUEDA[diaDelMes % TERMINOS_BUSQUEDA.length]

  console.log(`🔍 Buscando: "${terminoHoy}" en ${ciudadHoy.nombre}`)

  const contactados: string[] = []
  const omitidos:    string[] = []

  try {
    const lugares = await buscarTalleres(ciudadHoy.nombre, terminoHoy)

    // Limitar a 10 por ejecución para no quemar el presupuesto
    const lugaresLimitados = lugares.slice(0, 10)

    for (const lugar of lugaresLimitados) {
      const placeId = lugar.place_id
      if (!placeId) continue

      // Verificar si ya lo contactamos antes
      const yaEnviado = await yaContactado(placeId)
      if (yaEnviado) {
        omitidos.push(lugar.name)
        continue
      }

      // Obtener detalles completos
      const detalles = await obtenerDetalles(placeId)
      if (!detalles) continue

      const prospecto: Prospecto = {
        nombre:          detalles.name ?? lugar.name,
        telefono:        detalles.formatted_phone_number ?? null,
        email:           null, // Google Maps no da email — se puede extraer del website
        direccion:       detalles.formatted_address ?? null,
        ciudad:          ciudadHoy.nombre,
        pais:            ciudadHoy.pais,
        google_place_id: placeId,
        website:         detalles.website ?? null,
        rating:          detalles.rating ?? null,
      }

      // Solo contactar si tiene teléfono (para WhatsApp)
      if (!prospecto.telefono && !prospecto.email) {
        omitidos.push(prospecto.nombre)
        continue
      }

      // Registrar para no volver a contactar
      await registrarContacto(prospecto)

      // Enviar WhatsApp frío con número Business real
      if (prospecto.telefono) {
        await enviarWhatsAppFrio(prospecto)
      }

      // Agregar a Brevo y enviar email frío
      if (prospecto.email) {
        await agregarABrevo(prospecto)
      }

      contactados.push(prospecto.nombre)

      // Pausa de 2 segundos entre contactos para no saturar
      await new Promise(r => setTimeout(r, 2000))
    }

    // Notificar a Ivan con el resumen del día
    await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': BREVO_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sender:      { name: 'TallerOS Agente', email: 'hola@tallerosapp.com' },
        to:          [{ email: 'hola@tallerosapp.com', name: 'Ivan' }],
        subject:     `📊 Agente de prospección — ${contactados.length} talleres contactados hoy`,
        htmlContent: `
          <p><strong>Ciudad:</strong> ${ciudadHoy.nombre}</p>
          <p><strong>Término:</strong> ${terminoHoy}</p>
          <p><strong>Contactados (${contactados.length}):</strong> ${contactados.join(', ') || 'ninguno'}</p>
          <p><strong>Omitidos ya contactados (${omitidos.length}):</strong> ${omitidos.join(', ') || 'ninguno'}</p>
        `,
      }),
    })

    return NextResponse.json({
      ok:          true,
      ciudad:      ciudadHoy.nombre,
      termino:     terminoHoy,
      contactados: contactados.length,
      omitidos:    omitidos.length,
      detalle:     contactados,
    })

  } catch (error: any) {
    console.error('Prospecting agent error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
