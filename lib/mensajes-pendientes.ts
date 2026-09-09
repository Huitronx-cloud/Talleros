import { SupabaseClient } from '@supabase/supabase-js'
import { buildWhatsAppLink } from './whatsapp-link'

export type TipoMensajePendiente =
  | 'recordatorio'
  | 'resena'
  | 'cita'
  | 'promocion'
  | 'aviso'
  | 'garantia'
  | 'seguimiento'

/**
 * Cuántos días vive un mensaje antes de caducar.
 *
 * Un mensaje sin enviar no es una deuda eterna: se pudre. Un taller tenía 48
 * avisos de "su vehículo está listo para recoger", el más viejo de hace 55
 * días. Mandar hoy uno de esos le llega a un cliente que recogió su coche hace
 * casi dos meses, y deja al taller peor que si no le hubiera escrito nunca.
 * Sus 4 recordatorios de cita eran para confirmar citas de julio.
 *
 * Por eso caducan, y por eso no todos igual:
 *
 *   · Un aviso y una cita mueren rápido. Hablan de algo que pasa AHORA —el
 *     coche está listo, la cita es el jueves— y una semana después son falsos.
 *   · Un seguimiento, una reseña o un recordatorio de mantenimiento aguantan:
 *     "¿cómo va tu coche después del servicio?" sigue teniendo sentido al mes.
 *
 * Caducar NO es descartar. Descartado significa que una persona decidió que
 * no; caducado significa que se nos pasó el momento. Se guardan los dos por
 * separado para poder saber cuál de las dos cosas está pasando.
 */
export const DIAS_DE_VIDA: Record<string, number> = {
  aviso:        7,
  cita:         7,
  seguimiento:  30,
  resena:       30,
  recordatorio: 30,
  garantia:     30,
  promocion:    14,
}

/** Los días que vive un tipo, con 30 para cualquiera que no esté en la tabla. */
export function diasDeVida(tipo: string): number {
  return DIAS_DE_VIDA[tipo] ?? 30
}

/** Si a este mensaje ya se le pasó el momento. */
export function estaCaducado(tipo: string, creadoEn: string): boolean {
  const edadDias = (Date.now() - new Date(creadoEn).getTime()) / (1000 * 60 * 60 * 24)
  return edadDias > diasDeVida(tipo)
}

// Encola un WhatsApp en mensajes_pendientes para que el equipo del taller lo
// envíe con un tap desde su propio WhatsApp (links wa.me requieren gesto
// humano — los crons no pueden enviar automáticamente).
// `supabase` debe ser un cliente service-role: la tabla tiene RLS y los
// talleres solo pueden leer/actualizar, no insertar.
export async function encolarMensajeWhatsApp(
  supabase: SupabaseClient,
  params: {
    tallerId:   string
    clienteId?: string | null
    tipo:       TipoMensajePendiente
    telefono:   string
    mensaje:    string
    paisTaller?: string | null
  }
): Promise<boolean> {
  const { error } = await supabase.from('mensajes_pendientes').insert({
    taller_id:     params.tallerId,
    cliente_id:    params.clienteId ?? null,
    tipo:          params.tipo,
    telefono:      params.telefono,
    mensaje_texto: params.mensaje,
    wa_link:       buildWhatsAppLink(params.telefono, params.mensaje, params.paisTaller),
  })
  if (error) console.error('[mensajes_pendientes] error encolando:', error.message)
  return !error
}
