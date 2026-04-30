import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import twilio from 'twilio'

export async function POST(req: NextRequest) {
  try {
    console.log('Paso 1: inicio')
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID!,
      process.env.TWILIO_AUTH_TOKEN!
    )
    console.log('Paso 2: twilio ok')
    const { ordenId } = await req.json()
    console.log('Paso 3: ordenId', ordenId)
    const supabase = createClient()
    console.log('Paso 4: supabase ok')
    const { data: orden, error: errorOrden } = await supabase
      .from('ordenes')
      .select('*, clientes(nombre, telefono), talleres(nombre, telefono)')
      .eq('id', ordenId)
      .single()
    console.log('Paso 5: orden', orden?.id, 'error', errorOrden)
    if (!orden) {
      return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 })
    }
    const { data: token, error: errorToken } = await supabase
      .from('portal_tokens')
      .insert({ orden_id: ordenId, taller_id: orden.taller_id })
      .select('token')
      .single()
    console.log('Paso 6: token', token, 'error', errorToken)
    if (!token) {
      return NextResponse.json({ error: 'Error generando token' }, { status: 500 })
    }
    const cliente = orden.clientes as any
    const taller = orden.talleres as any
   const url = (process.env.NEXT_PUBLIC_URL ?? 'http://localhost:3000') + '/portal/' + token.token
    console.log('Paso 7: enviando WhatsApp a', cliente.telefono)
    await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_FROM,
      to: 'whatsapp:+' + cliente.telefono,
      body: 'Hola ' + cliente.nombre + ' Desde ' + taller.nombre + ' le compartimos el portal: ' + url,
    })
    console.log('Paso 8: WhatsApp enviado')
    return NextResponse.json({ success: true, url })
  } catch (error: any) {
    console.error('ERROR COMPLETO:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}