import { NextRequest, NextResponse } from 'next/server'
import { enviarWhatsApp } from '@/lib/twilio'

export async function POST(req: NextRequest) {
  try {
    const { telefono, mensaje } = await req.json()

    if (!telefono || !mensaje) {
      return NextResponse.json({ error: 'telefono y mensaje son requeridos' }, { status: 400 })
    }

    await enviarWhatsApp(telefono, mensaje)

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('[WhatsApp bienvenida]', error)
    return NextResponse.json({ error: error.message ?? 'Error enviando mensaje' }, { status: 500 })
  }
}
