export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const CLIENT_ID     = process.env.GOOGLE_CLIENT_ID!
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!
const TWILIO_SID    = process.env.TWILIO_ACCOUNT_SID!
const TWILIO_TOKEN  = process.env.TWILIO_AUTH_TOKEN!
const WA_FROM       = process.env.TWILIO_WHATSAPP_FROM ?? ''

// ── Refrescar token si expiró ─────────────────────────────────────────────────
async function refrescarToken(refreshToken: string): Promise<string | null> {
  try {
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id:     CLIENT_ID,
        client_secret: CLIENT_SECRET,
        refresh_token: refreshToken,
        grant_type:    'refresh_token',
      }).toString(),
    })
    const data = await res.json()
    return data.access_token ?? null
  } catch {
    return null
  }
}

// ── Obtener URL de reseña de Google My Business ───────────────────────────────
async function obtenerUrlResena(accessToken: string, locationId: string): Promise<string | null> {
  try {
    const res  = await fetch(
      `https://mybusinessbusinessinformation.googleapis.com/v1/${locationId}?readMask=name,title,metadata`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )
    const data = await res.json()
    // La URL de reseña viene en metadata.mapsUri o la construimos con el place ID
    const mapsUri = data.metadata?.mapsUri
    if (mapsUri) {
      // Convertir maps URI a URL de reseña directa
      return `${mapsUri}&action=write-review`
    }
    return null
  } catch {
    return null
  }
}

// ── Enviar WhatsApp con link de reseña ────────────────────────────────────────
async function enviarWhatsAppResena(
  telefono: string,
  nombreCliente: string,
  nombreTaller: string,
  urlResena: string
): Promise<void> {
  try {
    const tel = telefono.replace(/\D/g, '')
    const to  = tel.startsWith('+') ? tel : `+${tel}`
    const msg = `¡Hola ${nombreCliente}! 😊\n\nGracias por confiar en *${nombreTaller}*. Esperamos que tu vehículo esté funcionando perfecto.\n\n¿Podrías dejarnos una reseña en Google? Solo toma 1 minuto y nos ayuda mucho:\n\n⭐ ${urlResena}\n\n¡Muchas gracias!`

    await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(`${TWILIO_SID}:${TWILIO_TOKEN}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          From: `whatsapp:${WA_FROM}`,
          To:   `whatsapp:${to}`,
          Body: msg,
        }).toString(),
      }
    )
  } catch (e) {
    console.error('WhatsApp reseña error:', e)
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const { orden_id, cliente_id } = await req.json()

    // Obtener datos del taller
    const { data: usuario } = await supabase
      .from('usuarios')
      .select('taller_id')
      .eq('id', user.id)
      .single()

    const { data: taller } = await supabase
      .from('talleres')
      .select('nombre, google_access_token, google_refresh_token, google_token_expiry, gmb_location_id')
      .eq('id', usuario?.taller_id)
      .single()

    if (!taller?.google_access_token || !taller?.gmb_location_id) {
      return NextResponse.json({
        error: 'Google My Business no conectado',
        conectar: '/api/google/connect'
      }, { status: 400 })
    }

    // Refrescar token si expiró
    let accessToken = taller.google_access_token
    const expiry    = new Date(taller.google_token_expiry ?? 0)
    if (expiry < new Date() && taller.google_refresh_token) {
      const nuevoToken = await refrescarToken(taller.google_refresh_token)
      if (nuevoToken) {
        accessToken = nuevoToken
        await supabase
          .from('talleres')
          .update({
            google_access_token: nuevoToken,
            google_token_expiry: new Date(Date.now() + 3600 * 1000).toISOString(),
          })
          .eq('id', usuario?.taller_id)
      }
    }

    // Obtener URL de reseña
    const urlResena = await obtenerUrlResena(accessToken, taller.gmb_location_id)
    if (!urlResena) {
      return NextResponse.json({ error: 'No se pudo obtener la URL de reseña' }, { status: 500 })
    }

    // Obtener datos del cliente
    const { data: cliente } = await supabase
      .from('clientes')
      .select('nombre, telefono')
      .eq('id', cliente_id)
      .single()

    if (!cliente?.telefono) {
      return NextResponse.json({ error: 'Cliente sin teléfono' }, { status: 400 })
    }

    // Enviar WhatsApp con link de reseña de Google
    await enviarWhatsAppResena(
      cliente.telefono,
      cliente.nombre.split(' ')[0],
      taller.nombre,
      urlResena
    )

    // Registrar que se envió la reseña
    await supabase.from('resenas_enviadas').insert({
      taller_id:  usuario?.taller_id,
      cliente_id,
      orden_id,
      tipo:       'google_my_business',
      url_resena: urlResena,
      enviado_at: new Date().toISOString(),
    })

    return NextResponse.json({ ok: true, url_resena: urlResena })
  } catch (error: any) {
    console.error('Google review error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
