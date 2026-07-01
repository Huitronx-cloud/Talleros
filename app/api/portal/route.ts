export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { normalizarFromWhatsApp, normalizarTelefonoWhatsApp, mapearErrorTwilio } from '@/lib/twilio'
import twilio from 'twilio'

export async function POST(req: NextRequest) {
  try {
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID!,
      process.env.TWILIO_AUTH_TOKEN!
    )

    const { ordenId } = await req.json()
    const supabase = createClient()

    const { data: orden, error: errorOrden } = await supabase
      .from('ordenes')
      .select('*, clientes(nombre, telefono), talleres(nombre, telefono)')
      .eq('id', ordenId)
      .single()

    if (!orden || errorOrden) {
      return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 })
    }

    const cliente = orden.clientes as any
    const taller  = orden.talleres as any

    // Verificar si ya existe un token activo para esta orden
    const { data: tokenExistente } = await supabase
      .from('portal_tokens')
      .select('token')
      .eq('orden_id', ordenId)
      .gt('expires_at', new Date().toISOString())
      .single()

    let tokenFinal = tokenExistente?.token

    if (!tokenFinal) {
      const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      const { data: nuevoToken, error: errorToken } = await supabase
        .from('portal_tokens')
        .insert({ orden_id: ordenId, taller_id: orden.taller_id, expires_at: expires })
        .select('token')
        .single()

      if (!nuevoToken || errorToken) {
        return NextResponse.json({ error: 'Error generando token' }, { status: 500 })
      }

      tokenFinal = nuevoToken.token
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.tallerosapp.com'
    const url     = `${baseUrl}/portal/${tokenFinal}`

    const vehiculo = [orden.vehiculo_marca, orden.vehiculo_modelo]
      .filter(Boolean)
      .join(' ') || 'tu vehículo'

    const mensaje = `¡Hola ${cliente.nombre}! 👋\n\n*${taller.nombre}* ya recibió tu *${vehiculo}*.\n\nSigue el estado de tu servicio en tiempo real aquí:\n🔗 ${url}\n\nCualquier duda, responde este mensaje. 🔧`

    if (!cliente.telefono) {
      return NextResponse.json({ error: 'El cliente no tiene teléfono registrado' }, { status: 400 })
    }

    try {
      await client.messages.create({
        from: normalizarFromWhatsApp(process.env.TWILIO_WHATSAPP_FROM!),
        to:   normalizarTelefonoWhatsApp(cliente.telefono),
        body: mensaje,
      })
    } catch (twilioError: any) {
      return NextResponse.json({ error: mapearErrorTwilio(twilioError) }, { status: 500 })
    }

    return NextResponse.json({ success: true, url })
  } catch (error: any) {
    console.error('Error portal route:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}