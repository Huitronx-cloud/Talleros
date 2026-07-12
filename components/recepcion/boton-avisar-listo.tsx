'use client'

import { Orden } from '@/types'
import BotonWhatsAppLink from '@/components/ordenes/whatsapp-link-modal'

// Aviso de "vehículo listo" desde recepción — canal wa.me: abre el modal con
// el mensaje pre-llenado y el empleado lo envía desde su propio WhatsApp.
// (Antes enviaba por Twilio vía /api/notificaciones.)
export default function BotonAvisarListo({ orden }: { orden: Orden }) {
  return (
    <BotonWhatsAppLink
      ordenId={orden.id}
      estado={orden.estado}
      plantillaInicial="listo_entrega"
      label="Avisar WA"
    />
  )
}
