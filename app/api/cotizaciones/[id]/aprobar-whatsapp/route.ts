export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { normalizarFromWhatsApp } from '@/lib/twilio'
import twilio from 'twilio'

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: cotizacion } = await supabase
    .from('cotizaciones')
    .select('*, clientes(nombre, telefono), talleres(nombre)')
    .eq('id', params.id)
    .single()

  if (!cotizacion) {
    return NextResponse.json({ error: 'Cotización no encontrada' }, { status: 404 })
  }

  const cliente = cotizacion.clientes as any
  const taller  = cotizacion.talleres as any
  const numero  = String(cotizacion.numero_cotizacion).padStart(4, '0')

  const telefonoLimpio = (cliente?.telefono ?? '').replace(/\D/g, '')
  if (!telefonoLimpio) {
    return NextResponse.json({ error: 'El cliente no tiene teléfono registrado' }, { status: 400 })
  }

  const lineas = (cotizacion.servicios ?? [])
    .map((s: any) => `• ${s.descripcion}: $${(s.total ?? 0).toLocaleString()}`)
    .join('\n')

  const sym      = cotizacion.moneda === 'MXN' ? '$' : `${cotizacion.moneda} `
  const totalFmt = `${sym}${(cotizacion.total ?? 0).toLocaleString()}`

  const mensaje =
    `Hola ${cliente.nombre} 👋\n\n` +
    `*${taller.nombre}* te envía la cotización *#${numero}* para tu aprobación:\n\n` +
    `${lineas}\n\n` +
    `*Total: ${totalFmt}*\n\n` +
    `Responde *SÍ* para aprobar ✅\n` +
    `Responde *NO* para rechazar ❌\n\n` +
    `_Sin tu aprobación no iniciamos ningún trabajo._`

  try {
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID!,
      process.env.TWILIO_AUTH_TOKEN!
    )
    await client.messages.create({
      from: normalizarFromWhatsApp(process.env.TWILIO_WHATSAPP_FROM!),
      to:   `whatsapp:+${telefonoLimpio}`,
      body: mensaje,
    })
  } catch (err: any) {
    return NextResponse.json({ error: `Error enviando WhatsApp: ${err.message}` }, { status: 500 })
  }

  await supabase
    .from('cotizaciones')
    .update({ estado: 'enviada' })
    .eq('id', params.id)

  return NextResponse.json({ ok: true })
}
