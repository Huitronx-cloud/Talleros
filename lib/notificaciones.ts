import { SupabaseClient } from '@supabase/supabase-js'
import { enviarWhatsApp } from './twilio'

type TipoNotificacion = 'orden_lista' | 'recordatorio' | 'seguimiento'

interface EnviarNotificacionParams {
  supabase: SupabaseClient
  tallerId: string
  ordenId: string
  clienteId: string | null
  telefono: string | null
  tipo: TipoNotificacion
  mensaje: string
}

export async function enviarNotificacion({
  supabase,
  tallerId,
  ordenId,
  clienteId,
  telefono,
  tipo,
  mensaje,
}: EnviarNotificacionParams): Promise<void> {
  // Guardar registro en DB (primero como pendiente)
  const { data: notif } = await supabase
    .from('notificaciones')
    .insert({
      taller_id:  tallerId,
      orden_id:   ordenId,
      cliente_id: clienteId,
      tipo,
      mensaje,
      estado: 'pendiente',
    })
    .select('id')
    .single()

  if (!notif) return

  // Intentar envío
  try {
    if (!telefono) throw new Error('El cliente no tiene teléfono registrado')
    await enviarWhatsApp(telefono, mensaje)

    await supabase
      .from('notificaciones')
      .update({ estado: 'enviada' })
      .eq('id', notif.id)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    await supabase
      .from('notificaciones')
      .update({ estado: 'fallida', error_mensaje: msg })
      .eq('id', notif.id)
  }
}

// ── Constructores de mensajes ─────────────────────────────────────────────────

export function mensajeOrdenLista(params: {
  nombre: string
  marca: string | null
  modelo: string | null
  placas: string | null
  tallerNombre: string
  total: number
  moneda?: string
}) {
  const vehiculo = [params.marca, params.modelo].filter(Boolean).join(' ') || 'su vehículo'
  const placas   = params.placas ? ` placas ${params.placas}` : ''
  const sym      = params.moneda === 'COP' ? 'COP ' : '$'
  const total    = params.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })

  return `Hola ${params.nombre} 👋 Su ${vehiculo}${placas} ya está listo para recoger en ${params.tallerNombre}.\n\nTotal a pagar: ${sym}${total}.\n\n¿Tiene alguna pregunta? Responda este mensaje.`
}

export function mensajeRecordatorio(params: {
  nombre: string
  marca: string | null
  modelo: string | null
  tallerNombre: string
  fechaPrometida: string
}) {
  const vehiculo = [params.marca, params.modelo].filter(Boolean).join(' ') || 'su vehículo'
  const fecha    = new Date(params.fechaPrometida + 'T12:00:00').toLocaleDateString('es-MX', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  return `Hola ${params.nombre}, le recordamos que ${vehiculo} está siendo atendido en ${params.tallerNombre}.\n\nFecha estimada de entrega: ${fecha}.\n\nLe avisaremos cuando esté listo ✅`
}

export function mensajeSeguimiento(params: {
  nombre: string
  marca: string | null
  modelo: string | null
  tallerNombre: string
  linkGoogleMaps?: string | null
}) {
  const vehiculo = [params.marca, params.modelo].filter(Boolean).join(' ') || 'su vehículo'
  const link     = params.linkGoogleMaps ? `\n\n📍 ${params.linkGoogleMaps}` : ''

  return `Hola ${params.nombre} 😊 ¿Cómo ha funcionado ${vehiculo} después del servicio en ${params.tallerNombre}?\n\nSu opinión nos ayuda a mejorar. ¿Nos regalas una reseña en Google?${link}`
}
export function mensajeRecordatorioMantenimiento(params: {
  nombre: string
  marca: string | null
  modelo: string | null
  tallerNombre: string
}) {
  const vehiculo = [params.marca, params.modelo].filter(Boolean).join(' ') || 'su vehículo'

  return `Hola ${params.nombre} 👋 Han pasado algunos meses desde que atendimos ${vehiculo} en ${params.tallerNombre}.\n\n🔧 Es un buen momento para revisar su vehículo y prevenir problemas futuros.\n\n¿Le gustaría agendar su próximo servicio? Responda este mensaje y con gusto le atendemos.`
}
export function mensajeResena(params: {
  nombre: string
  marca: string | null
  modelo: string | null
  tallerNombre: string
  googleReviewUrl: string
}) {
  const vehiculo = [params.marca, params.modelo].filter(Boolean).join(' ') || 'su vehículo'

  return `Hola ${params.nombre} 😊 Esperamos que ${vehiculo} esté funcionando perfecto después del servicio en ${params.tallerNombre}.\n\n⭐ ¿Nos regalas una reseña en Google? Solo toma 1 minuto y nos ayuda muchísimo:\n\n${params.googleReviewUrl}\n\n¡Gracias por preferirnos!`
}