import { NextRequest, NextResponse } from 'next/server'
import twilio from 'twilio'

export async function POST(req: NextRequest) {
  try {
    const { telefono, mensaje } = await req.json()

    if (!telefono || !mensaje) {
      return NextResponse.json({ error: 'Faltan datos' }, { status: 400 })
    }

    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID!,
      process.env.TWILIO_AUTH_TOKEN!
    )

    // Asegurar formato internacional
    const numeroDestino = telefono.startsWith('+')
      ? `whatsapp:${telefono}`
      : `whatsapp:+${telefono}`

    await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_FROM!,
      to:   numeroDestino,
      body: mensaje,
    })

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('WhatsApp bienvenida error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}