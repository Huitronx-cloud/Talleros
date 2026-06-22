import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { createClient } from '@supabase/supabase-js'

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
  { nombre: 'León, Guanajuato',            pais: 'MX', idioma: 'es' },
  { nombre: 'Querétaro, México',           pais: 'MX', idioma: 'es' },
  { nombre: 'Mérida, Yucatán',             pais: 'MX', idioma: 'es' },
  // Colombia
  { nombre: 'Bogotá, Colombia',            pais: 'CO', idioma: 'es' },
  { nombre: 'Medellín, Colombia',          pais: 'CO', idioma: 'es' },
  { nombre: 'Cali, Colombia',              pais: 'CO', idioma: 'es' },
  { nombre: 'Barranquilla, Colombia',      pais: 'CO', idioma: 'es' },
  { nombre: 'Bucaramanga, Colombia',       pais: 'CO', idioma: 'es' },
  // Perú
  { nombre: 'Lima, Perú',                  pais: 'PE', idioma: 'es' },
  { nombre: 'Arequipa, Perú',              pais: 'PE', idioma: 'es' },
  { nombre: 'Trujillo, Perú',              pais: 'PE', idioma: 'es' },
  // Argentina
  { nombre: 'Buenos Aires, Argentina',     pais: 'AR', idioma: 'es' },
  { nombre: 'Córdoba, Argentina',          pais: 'AR', idioma: 'es' },
  { nombre: 'Rosario, Argentina',          pais: 'AR', idioma: 'es' },
  // Chile
  { nombre: 'Santiago, Chile',             pais: 'CL', idioma: 'es' },
  { nombre: 'Valparaíso, Chile',           pais: 'CL', idioma: 'es' },
  { nombre: 'Concepción, Chile',           pais: 'CL', idioma: 'es' },
]

const TERMINOS_BUSQUEDA = [
  'taller mecánico',
  'taller automotriz',
  'mecánica automotriz',
  'servicio automotriz',
  'taller de frenos',
  'alineación y balanceo',
  'taller eléctrico automotriz',
  'taller de transmisiones',
  'hojalatería y pintura',
  'taller de suspensión',
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
interface ResultadoBusqueda {
  results: any[]
  status: string
  errorMessage?: string
}

async function buscarTalleres(ciudad: string, termino: string): Promise<ResultadoBusqueda> {
  try {
    const query   = encodeURIComponent(`${termino} en ${ciudad}`)
    const url     = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${query}&key=${GOOGLE_API_KEY}&language=es`
    const res     = await fetch(url)
    const data    = await res.json()
    console.log(`Places API status: ${data.status}, results: ${data.results?.length ?? 0}${data.error_message ? `, error: ${data.error_message}` : ''}`)
    return { results: data.results ?? [], status: data.status ?? 'UNKNOWN', errorMessage: data.error_message }
  } catch (e: any) {
    return { results: [], status: 'FETCH_ERROR', errorMessage: e.message }
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
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
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

async function registrarContacto(prospecto: Prospecto, error?: string): Promise<void> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  try {
    await supabase.from('prospectos_enviados').insert({
    ...(error ? { error } : {}),
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

// ── CRM interno — sincronizar lead unificado ─────────────────────────────────
async function sincronizarLeadCRM(prospecto: Prospecto, etapa: 'nuevo' | 'contactado'): Promise<void> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const telefonoNormalizado = prospecto.telefono
    ? normalizarTelefono(prospecto.telefono, prospecto.pais)
    : null

  try {
    await supabase.from('crm_leads').upsert({
      nombre:          prospecto.nombre,
      telefono:        telefonoNormalizado,
      email:           prospecto.email,
      direccion:       prospecto.direccion,
      ciudad:          prospecto.ciudad,
      pais:            prospecto.pais,
      google_place_id: prospecto.google_place_id,
      website:         prospecto.website,
      origen:          'prospeccion',
      etapa,
    }, { onConflict: telefonoNormalizado ? 'telefono' : 'google_place_id' })
  } catch (e) {
    console.error('Error sincronizando lead CRM:', e)
  }
}

// ── Extraer email del sitio web del prospecto ────────────────────────────────
// Google Places no devuelve email — lo buscamos en el HTML del sitio (mailto:
// primero, luego cualquier email visible en el texto).
const DOMINIOS_EMAIL_IGNORADOS = ['sentry.io', 'wixpress.com', 'example.com', 'godaddy.com', 'cloudflare.com', 'schema.org']

function emailValido(email: string): boolean {
  const dominio = email.toLowerCase()
  return !DOMINIOS_EMAIL_IGNORADOS.some(d => dominio.endsWith(`@${d}`) || dominio.includes(`.${d}`))
}

async function extraerEmailDeWebsite(url: string): Promise<string | null> {
  try {
    const controller = new AbortController()
    const timeoutId   = setTimeout(() => controller.abort(), 5000)
    const res = await fetch(url, {
      signal:  controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; TallerOSBot/1.0)' },
    })
    clearTimeout(timeoutId)
    if (!res.ok) return null

    const html = await res.text()

    const mailto = html.match(/mailto:([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i)
    if (mailto && emailValido(mailto[1])) return mailto[1].toLowerCase()

    const enTexto = html.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) ?? []
    const valido  = enTexto.find(emailValido)
    return valido?.toLowerCase() ?? null
  } catch {
    return null
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

// ── Códigos de país por defecto ───────────────────────────────────────────────
const CODIGO_PAIS: Record<string, string> = {
  MX: '52',
  CO: '57',
  PE: '51',
  AR: '54',
  CL: '56',
}

function normalizarTelefono(raw: string, pais: string): string | null {
  // Si ya tiene + o código de país largo (ej: +52 55...), limpiar y usar tal cual
  const soloDigitos = raw.replace(/\D/g, '')

  // Google a veces incluye el código de país (10-13 dígitos) o no (7-9 dígitos)
  // Si el número tiene más de 10 dígitos, asumimos que ya tiene código de país
  if (soloDigitos.length >= 10) {
    return `+${soloDigitos}`
  }

  // Número local — agregar código de país según el país del prospecto
  const codigo = CODIGO_PAIS[pais]
  if (!codigo) return null

  return `+${codigo}${soloDigitos}`
}

// ── WhatsApp frío ─────────────────────────────────────────────────────────────
async function enviarWhatsAppFrio(prospecto: Prospecto): Promise<{ ok: boolean; error?: string }> {
  if (!prospecto.telefono) return { ok: false, error: 'sin_telefono' }

  const to = normalizarTelefono(prospecto.telefono, prospecto.pais)
  if (!to) return { ok: false, error: 'numero_invalido' }

  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${TWILIO_SID}:${TWILIO_TOKEN}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        From: `whatsapp:${process.env.TWILIO_WHATSAPP_FROM ?? '+17242625304'}`,
        To:               `whatsapp:${to}`,
        ContentSid:       'HXbf735472bd3841f57341050e045adc3d',
        ContentVariables: JSON.stringify({ '1': prospecto.nombre }),
      }).toString(),
    })

    const data = await res.json()

    if (!res.ok || data.status === 'failed' || data.error_code) {
      console.error(`WhatsApp error para ${prospecto.nombre} (${to}): code=${data.error_code} msg=${data.error_message}`)
      return { ok: false, error: `twilio_${data.error_code ?? res.status}` }
    }

    console.log(`✅ WhatsApp enviado a ${prospecto.nombre} (${to}) — SID: ${data.sid}`)
    return { ok: true }

  } catch (e) {
    console.error('WhatsApp fetch error:', e)
    return { ok: false, error: 'fetch_error' }
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

  // Rotar ciudad y término por día + hora para que cada ejecución cubra combinación distinta
  const ahora      = new Date()
  const diaDelMes  = ahora.getDate()
  const horaActual = ahora.getHours()
  const indice     = (diaDelMes * 3 + Math.floor(horaActual / 4)) % CIUDADES.length
  const terminoIdx = (diaDelMes + horaActual) % TERMINOS_BUSQUEDA.length
  const ciudadHoy  = CIUDADES[indice]
  const terminoHoy = TERMINOS_BUSQUEDA[terminoIdx]

  console.log(`[Hora ${horaActual}h] Buscando: "${terminoHoy}" en ${ciudadHoy.nombre}`)

  const contactados: string[] = []
  const omitidos:    string[] = []

  try {
    const busqueda = await buscarTalleres(ciudadHoy.nombre, terminoHoy)

    if (busqueda.status !== 'OK' && busqueda.status !== 'ZERO_RESULTS') {
      console.error(`Places API falló: ${busqueda.status} — ${busqueda.errorMessage ?? 'sin detalle'}`)
    }

    // Limitar a 10 por ejecución para no quemar el presupuesto
    const lugaresLimitados = busqueda.results.slice(0, 10)

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
        email:           null, // Google Maps no da email — se busca en el website
        direccion:       detalles.formatted_address ?? null,
        ciudad:          ciudadHoy.nombre,
        pais:            ciudadHoy.pais,
        google_place_id: placeId,
        website:         detalles.website ?? null,
        rating:          detalles.rating ?? null,
      }

      if (prospecto.website) {
        prospecto.email = await extraerEmailDeWebsite(prospecto.website)
      }

      // Registrar siempre para no volver a procesar
      await registrarContacto(prospecto)

      // Canal de email — independiente del canal de WhatsApp
      if (prospecto.email) {
        await agregarABrevo(prospecto)
      }

      // Enviar WhatsApp si tiene teléfono (requiere plantilla aprobada por Meta)
      if (prospecto.telefono) {
        const resultado = await enviarWhatsAppFrio(prospecto)
        if (resultado.ok) {
          await registrarContacto(prospecto)
          await sincronizarLeadCRM(prospecto, 'contactado')
          contactados.push(`✅ ${prospecto.nombre} | 📞 ${prospecto.telefono}${prospecto.email ? ` | 📧 ${prospecto.email}` : ''}${prospecto.website ? ` | 🌐 ${prospecto.website}` : ''} | 📍 ${prospecto.direccion ?? prospecto.ciudad}`)
        } else {
          // Registrar fallidos también para no reintentar
          await registrarContacto(prospecto, resultado.error)
          await sincronizarLeadCRM(prospecto, 'nuevo')
          omitidos.push(`❌ ${prospecto.nombre} (error: ${resultado.error}) | 📞 ${prospecto.telefono}${prospecto.email ? ` | 📧 ${prospecto.email}` : ''}`)
        }
      } else if (prospecto.website) {
        // Sin teléfono pero tiene website — lista para seguimiento manual (o ya contactado por email)
        await sincronizarLeadCRM(prospecto, prospecto.email ? 'contactado' : 'nuevo')
        contactados.push(`${prospecto.nombre}${prospecto.email ? ` | 📧 ${prospecto.email}` : ''} | 🌐 ${prospecto.website} | 📍 ${prospecto.direccion ?? prospecto.ciudad} (sin teléfono)`)
      } else {
        // Sin teléfono ni website — no es un lead gestionable, no se sincroniza al CRM
        omitidos.push(`${prospecto.nombre} (sin datos de contacto)`)
        continue
      }

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
        subject:     `📊 Agente de prospección — ${contactados.length} talleres encontrados hoy en ${ciudadHoy.nombre}`,
        htmlContent: `
          <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;">
            <div style="background:linear-gradient(135deg,#1e3a5f,#1d4ed8);padding:24px;border-radius:12px 12px 0 0;text-align:center;">
              <p style="margin:0;color:#fff;font-size:20px;font-weight:900;">TallerOS — Agente de Prospección</p>
            </div>
            <div style="background:#fff;padding:28px;border:1px solid #e2e8f0;border-radius:0 0 12px 12px;">
              <p style="color:#64748b;font-size:13px;margin-bottom:4px;">Ciudad:</p>
              <p style="color:#0f172a;font-weight:700;margin-bottom:16px;">${ciudadHoy.nombre}</p>
              <p style="color:#64748b;font-size:13px;margin-bottom:4px;">Término de búsqueda:</p>
              <p style="color:#0f172a;font-weight:700;margin-bottom:20px;">${terminoHoy}</p>
              ${busqueda.status !== 'OK' && busqueda.status !== 'ZERO_RESULTS' ? `
              <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:14px;margin-bottom:20px;">
                <p style="margin:0;font-size:13px;color:#b91c1c;line-height:1.6;">
                  ⚠️ <strong>Google Places API falló</strong> (status: ${busqueda.status}). ${busqueda.errorMessage ?? 'Sin detalle adicional.'} Revisa la API key en Google Cloud Console (Places API habilitada, billing activo, sin restricciones de referrer).
                </p>
              </div>
              ` : ''}
              <p style="color:#0f172a;font-size:16px;font-weight:800;margin-bottom:12px;">📋 Talleres encontrados (${contactados.length}):</p>
              ${contactados.map(t => `<div style="background:#f8fafc;border-radius:8px;padding:10px 14px;margin-bottom:8px;font-size:13px;color:#334155;border-left:3px solid #2563eb;">${t}</div>`).join('')}
              ${omitidos.length > 0 ? `
              <p style="color:#94a3b8;font-size:13px;margin-top:20px;margin-bottom:8px;">Omitidos (${omitidos.length}):</p>
              ${omitidos.map(t => `<div style="background:#fafafa;border-radius:8px;padding:8px 14px;margin-bottom:6px;font-size:12px;color:#94a3b8;">${t}</div>`).join('')}
              ` : ''}
              <div style="background:#eff6ff;border-radius:10px;padding:14px;margin-top:20px;border:1px solid #bfdbfe;">
                <p style="margin:0;font-size:13px;color:#1d4ed8;line-height:1.6;">
                  💡 <strong>Próximos pasos:</strong> Los que tienen 📧 email ya recibieron el correo de prospección automático. Los talleres con 🌐 website pero sin 📧 no tenían un email visible en su sitio — puedes visitarlos para buscarlo manualmente.
                </p>
              </div>
            </div>
          </div>`,
      }),
    })

    return NextResponse.json({
      ok:             true,
      ciudad:         ciudadHoy.nombre,
      termino:        terminoHoy,
      places_status:  busqueda.status,
      places_error:   busqueda.errorMessage ?? null,
      contactados:    contactados.length,
      omitidos:       omitidos.length,
      detalle:        contactados,
    })

  } catch (error: any) {
    console.error('Prospecting agent error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
