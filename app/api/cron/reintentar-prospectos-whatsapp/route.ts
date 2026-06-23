export const dynamic = 'force-dynamic'
export const maxDuration = 300

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// ── Backfill manual — corrige y reenvía el WhatsApp a los prospectos que
// fallaron por el bug de formato de teléfono (Google Places sin código de
// país). No se agrega a vercel.json: se dispara a mano una sola vez.
const TWILIO_SID   = process.env.TWILIO_ACCOUNT_SID!
const TWILIO_TOKEN = process.env.TWILIO_AUTH_TOKEN!
const TWILIO_FROM  = process.env.TWILIO_WHATSAPP_FROM!
const CONTENT_SID  = 'HXbf735472bd3841f57341050e045adc3d'

const CODIGO_PAIS: Record<string, string> = {
  MX: '52', CO: '57', PE: '51', AR: '54', CL: '56',
}

function reconstruirTelefono(raw: string, pais: string): string | null {
  const digitos = raw.replace(/\D/g, '')
  const codigo  = CODIGO_PAIS[pais]
  if (!digitos || !codigo) return null
  return `+${codigo}${digitos}`
}

async function enviarWhatsApp(to: string, nombre: string): Promise<{ ok: boolean; error?: string }> {
  const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${TWILIO_SID}:${TWILIO_TOKEN}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      From:             `whatsapp:${TWILIO_FROM}`,
      To:               `whatsapp:${to}`,
      ContentSid:       CONTENT_SID,
      ContentVariables: JSON.stringify({ '1': nombre }),
    }).toString(),
  })
  const data = await res.json()
  if (!res.ok || data.error_code) {
    return { ok: false, error: `${data.error_code ?? res.status}` }
  }
  return { ok: true }
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const limite = Number(req.nextUrl.searchParams.get('limit') ?? 25)

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Solo los que quedaron en formato local (sin "+") — esos son los que
  // nunca pudieron entregarse por el bug. Los ya corregidos quedan con "+"
  // y este filtro los salta, así que el endpoint es seguro de repetir.
  const { data: prospectos, error: errLectura } = await supabase
    .from('prospectos_enviados')
    .select('id, nombre, telefono, pais, google_place_id')
    .not('telefono', 'is', null)
    .not('telefono', 'like', '+%')
    .limit(limite)

  if (errLectura) {
    return NextResponse.json({ error: errLectura.message }, { status: 500 })
  }

  const resultados: string[] = []
  let enviados = 0

  for (const p of prospectos ?? []) {
    const telefonoOk = reconstruirTelefono(p.telefono!, p.pais)
    if (!telefonoOk) {
      resultados.push(`⚠️ ${p.nombre}: país desconocido (${p.pais}), no se pudo reconstruir el teléfono`)
      continue
    }

    const resultado = await enviarWhatsApp(telefonoOk, p.nombre)

    if (resultado.ok) {
      enviados++
      await supabase.from('prospectos_enviados').update({ telefono: telefonoOk }).eq('id', p.id)
      const { data: lead } = await supabase
        .from('crm_leads')
        .update({ telefono: telefonoOk })
        .eq('google_place_id', p.google_place_id)
        .select('id')
        .maybeSingle()
      if (lead?.id) {
        await supabase.from('crm_mensajes').insert({
          lead_id: lead.id,
          sentido: 'saliente',
          mensaje: '📲 WhatsApp de prospección reenviado (plantilla aprobada por Meta)',
        })
      }
      resultados.push(`✅ ${p.nombre} (${telefonoOk})`)
    } else {
      resultados.push(`⚠️ ${p.nombre} (${telefonoOk}): falló — ${resultado.error}`)
    }

    await new Promise(r => setTimeout(r, 1200))
  }

  return NextResponse.json({
    procesados: (prospectos ?? []).length,
    enviados,
    resultados,
    nota: (prospectos ?? []).length === limite
      ? `Había más de ${limite} pendientes — vuelve a llamar este endpoint para procesar el resto.`
      : 'No quedan más prospectos pendientes por reintentar.',
  })
}
