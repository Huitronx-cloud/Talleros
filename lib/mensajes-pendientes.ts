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
