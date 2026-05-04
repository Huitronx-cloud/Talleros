import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { Orden, Taller } from '@/types'
import OrdenDocumento from '@/lib/pdf/orden-documento'
import twilio from 'twilio'

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()

  const { data: orden, error } = await supabase
    .from('ordenes')
    .select('*, clientes(nombre, telefono)')
    .eq('id', params.id)
    .single()

  if (error || !orden) return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 })

  const cliente  = orden.clientes as { nombre: string; telefono: string | null } | null
  const telefono = cliente?.telefono

  if (!telefono) return NextResponse.json({ error: 'El cliente no tiene teléfono registrado' }, { status: 400 })

  const { data: taller } = await supabase
    .rpc('get_taller_para_pdf', { p_taller_id: orden.taller_id })

  if (!taller) return NextResponse.json({ error: 'Taller no encontrado' }, { status: 404 })

  try {
   // 1. Generar PDF en memoria
    const { createElement } = await import('react')
    const buffer = await renderToBuffer(
      createElement(OrdenDocumento, {
        orden: orden as Orden,
        taller: taller as Taller,
      }) as any
    )

    // 2. Subir PDF a Supabase Storage
    const numero   = String(orden.numero_orden).padStart(4, '0')
    const filename = `orden-${numero}-${Date.now()}.pdf`
    const adminClient = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const { error: uploadError } = await adminClient.storage
  .from('pdfs-ordenes')
  .upload(filename, buffer, {
    contentType: 'application/pdf',
    upsert: true,
  })

const { data: urlData } = adminClient.storage
  .from('pdfs-ordenes')
  .getPublicUrl(filename)

    if (uploadError) throw new Error(`Error subiendo PDF: ${uploadError.message}`)

    // 3. Obtener URL pública
    const { data: urlData } = supabase.storage
      .from('pdfs-ordenes')
      .getPublicUrl(filename)

    const pdfUrl = urlData.publicUrl

    // 4. Enviar por WhatsApp con Twilio
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID!,
      process.env.TWILIO_AUTH_TOKEN!
    )

    const telefonoLimpio = telefono.replace(/\D/g, '')
    const to = telefonoLimpio.startsWith('52') || telefonoLimpio.length === 10
      ? `whatsapp:+52${telefonoLimpio.slice(-10)}`
      : `whatsapp:+${telefonoLimpio}`

    const vehiculo = [orden.vehiculo_marca, orden.vehiculo_modelo].filter(Boolean).join(' ') || 'su vehículo'
    const moneda   = (taller as any).moneda === 'COP' ? 'COP $' : '$'
    const totalFmt = (orden.total ?? 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })

    await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_FROM!,
      to,
      body: `Hola ${cliente?.nombre} 👋 Aquí está el reporte de servicio de su ${vehiculo} en ${(taller as any).nombre}.\n\n💰 Total: ${moneda}${totalFmt}\n\nAdjunto encontrará el PDF con el detalle completo. ¡Gracias por preferirnos! 🙏`,
      mediaUrl: [pdfUrl],
    })

    // 5. Registrar notificación
    await supabase.from('notificaciones').insert({
      taller_id:  orden.taller_id,
      orden_id:   params.id,
      cliente_id: orden.cliente_id,
      tipo:       'seguimiento',
      mensaje:    `PDF de orden #${numero} enviado por WhatsApp`,
      estado:     'enviada',
    })

    return NextResponse.json({ success: true, pdfUrl })
  } catch (e: any) {
    console.error('[PDF WhatsApp]', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}