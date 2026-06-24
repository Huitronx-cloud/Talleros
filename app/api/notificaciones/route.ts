export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import twilio from 'twilio'
import { createClient } from '@/lib/supabase/server'
import { mapearErrorTwilio, normalizarTelefonoWhatsApp, normalizarFromWhatsApp } from '@/lib/twilio'

export async function POST(req: NextRequest) {
  const client = twilio(
    process.env.TWILIO_ACCOUNT_SID!,
    process.env.TWILIO_AUTH_TOKEN!
  )

  try {
    const { tipo, ordenId, servicioExtra, costoExtra, fotos, garantiaDias, garantiaKm } = await req.json()
    const supabase = createClient()

    const { data: orden } = await supabase
      .from('ordenes')
      .select(`
        *,
        clientes(nombre, telefono),
        talleres(nombre)
      `)
      .eq('id', ordenId)
      .single()

    if (!orden) {
      return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 })
    }
    if (servicioExtra) orden.servicio_extra = servicioExtra
if (costoExtra) orden.costo_extra = costoExtra
if (fotos) orden.fotos = fotos
if (garantiaDias) orden.garantia_dias = garantiaDias
if (garantiaKm) orden.garantia_km = garantiaKm

    const cliente = orden.clientes as any
    const taller = orden.talleres as any
    const telefono = cliente?.telefono

    if (!telefono) {
      return NextResponse.json({ error: 'Cliente sin teléfono' }, { status: 400 })
    }

    const mensajes: Record<string, string> = {
      orden_lista: `Hola ${cliente.nombre} 👋 Su ${orden.vehiculo_marca} ${orden.vehiculo_modelo} placas ${orden.placas} ya está listo para recoger en ${taller.nombre}. Total a pagar: $${orden.total?.toLocaleString()} ${orden.moneda ?? 'MXN'}. ¿Tiene alguna pregunta? Responda este mensaje.`,
      recordatorio: `Hola ${cliente.nombre}, le recordamos que su ${orden.vehiculo_marca} ${orden.vehiculo_modelo} está siendo atendido en ${taller.nombre}. Fecha estimada de entrega: ${orden.fecha_prometida}. Le avisaremos cuando esté listo.`,
      seguimiento: `Hola ${cliente.nombre} 😊 ¿Cómo ha funcionado su ${orden.vehiculo_marca} ${orden.vehiculo_modelo} después del servicio en ${taller.nombre}? Su opinión nos ayuda a mejorar. ¡Gracias por preferirnos!`,
      aprobacion_extra: `Hola ${cliente.nombre} 👋 Su ${orden.vehiculo_marca} ${orden.vehiculo_modelo} en ${taller.nombre} requiere trabajo adicional:\n\n🔧 ${orden.servicio_extra ?? ''}\n💰 Costo adicional: $${orden.costo_extra ?? 0} ${orden.moneda ?? 'MXN'}\n\nResponda *SÍ* para autorizar o *NO* para cancelar. Su respuesta quedará registrada.`,
      garantia: `Hola ${cliente.nombre} ✅ Su ${orden.vehiculo_marca} ${orden.vehiculo_modelo} placas ${orden.placas} ha sido entregado por ${taller.nombre}.\n\n🛡 GARANTÍA DE SERVICIO\nSu reparación tiene garantía de ${orden.garantia_dias ?? 30} días o ${orden.garantia_km ?? 1000} km, lo que ocurra primero.\n\nFecha de entrega: ${new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}\n\nConserve este mensaje como comprobante. Gracias por preferirnos.`,
      recordatorio_mantenimiento: `Hola ${cliente.nombre} 👋 Han pasado algunos meses desde que atendimos su ${orden.vehiculo_marca} ${orden.vehiculo_modelo} en ${taller.nombre}.\n\n🔧 Es un buen momento para revisar su vehículo y prevenir problemas futuros.\n\n¿Le gustaría agendar su próximo servicio? Responda este mensaje y con gusto le atendemos.`,
      fotos_diagnostico: `Hola ${cliente.nombre} 📸 Le compartimos fotos del diagnóstico de su ${orden.vehiculo_marca} ${orden.vehiculo_modelo} en ${taller.nombre}:\n\n${(orden.fotos ?? []).map((f: any, i: number) => `🔧 ${f.descripcion}\n🖼 ${f.url}`).join('\n\n')}\n\nSi tiene alguna pregunta, responda este mensaje.`,
    }

    const mensaje = mensajes[tipo]

    if (!mensaje) {
      return NextResponse.json({ error: 'Tipo de mensaje inválido' }, { status: 400 })
    }

    const to = normalizarTelefonoWhatsApp(telefono)
    const from = normalizarFromWhatsApp(process.env.TWILIO_WHATSAPP_FROM!)

    try {
      if (tipo === 'fotos_diagnostico' && fotos && fotos.length > 0) {
        // Primer mensaje con texto
        await client.messages.create({
          from,
          to,
          body: `Hola ${cliente.nombre} 📸 Le compartimos fotos del diagnóstico de su ${orden.vehiculo_marca} ${orden.vehiculo_modelo} en ${taller.nombre}:`,
        })
        // Una imagen por mensaje
        for (const foto of fotos) {
          await client.messages.create({
            from,
            to,
            body: `🔧 ${foto.descripcion}`,
            mediaUrl: [foto.url],
          })
        }
      } else {
        await client.messages.create({ from, to, body: mensaje })
      }
    } catch (twilioError: any) {
      const mensajeError = mapearErrorTwilio(twilioError)
      const { error: insertError } = await supabase.from('notificaciones').insert({
        taller_id: orden.taller_id,
        cliente_id: orden.cliente_id,
        orden_id: ordenId,
        tipo,
        mensaje,
        estado: 'fallida',
        error_mensaje: mensajeError,
      })
      if (insertError) console.error('Error guardando notificación fallida:', insertError)
      return NextResponse.json({ error: mensajeError }, { status: 500 })
    }

    const { error: insertError } = await supabase.from('notificaciones').insert({
      taller_id: orden.taller_id,
      cliente_id: orden.cliente_id,
      orden_id: ordenId,
      tipo,
      mensaje,
      estado: 'enviada',
    })
    if (insertError) console.error('Error guardando notificación:', insertError)

    if (tipo === 'aprobacion_extra') {
      const { error: extraError } = await supabase
        .from('ordenes')
        .update({
          servicio_extra: orden.servicio_extra,
          costo_extra: orden.costo_extra,
          extra_estado: 'pendiente',
        })
        .eq('id', ordenId)
      if (extraError) console.error('Error guardando trabajo extra pendiente:', extraError)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error WhatsApp:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}