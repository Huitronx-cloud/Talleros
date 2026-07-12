export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

import { createServiceClient } from '@/lib/supabase/service'
import { encolarMensajeWhatsApp } from '@/lib/mensajes-pendientes'

const CLIENT_ID     = process.env.GOOGLE_CLIENT_ID!
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!

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

// DEPRECATED: canal migrado a wa.me — la solicitud de reseña ya no se envía
// por Twilio, se encola en mensajes_pendientes (tipo 'resena') y el taller la
// manda con un tap desde su propio WhatsApp.
// async function enviarWhatsAppResena(telefono, nombreCliente, nombreTaller, urlResena) {
//   const tel = telefono.replace(/\D/g, '')
//   const to  = tel.length === 10 ? `+52${tel}` : `+${tel}`
//   await fetch(`https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`, {
//     method: 'POST',
//     headers: { Authorization: `Basic ...`, 'Content-Type': 'application/x-www-form-urlencoded' },
//     body: new URLSearchParams({ From: `whatsapp:${WA_FROM}`, To: `whatsapp:${to}`, Body: msg }).toString(),
//   })
// }

function mensajeResena(nombreCliente: string, nombreTaller: string, urlResena: string): string {
  return `¡Hola ${nombreCliente}! 😊\n\nGracias por confiar en *${nombreTaller}*. Esperamos que tu vehículo esté funcionando perfecto.\n\n¿Podrías dejarnos una reseña en Google? Solo toma 1 minuto y nos ayuda mucho:\n\n⭐ ${urlResena}\n\n¡Muchas gracias!`
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

    // Obtener datos del cliente (incluye país del taller para el link wa.me)
    const { data: cliente } = await supabase
      .from('clientes')
      .select('nombre, telefono')
      .eq('id', cliente_id)
      .single()

    if (!cliente?.telefono) {
      return NextResponse.json({ error: 'Cliente sin teléfono' }, { status: 400 })
    }

    const { data: tallerPais } = await supabase
      .from('talleres')
      .select('pais')
      .eq('id', usuario?.taller_id)
      .single()

    // Canal wa.me: se encola y el taller la envía desde su propio WhatsApp
    const admin = createServiceClient()
    await encolarMensajeWhatsApp(admin, {
      tallerId:   usuario?.taller_id,
      clienteId:  cliente_id,
      tipo:       'resena',
      telefono:   cliente.telefono,
      mensaje:    mensajeResena(cliente.nombre.split(' ')[0], taller.nombre, urlResena),
      paisTaller: tallerPais?.pais ?? null,
    })

    // Registrar que se encoló la reseña
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
