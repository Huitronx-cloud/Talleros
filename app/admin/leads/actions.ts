'use server'

import { createServiceClient } from '@/lib/supabase/service'
import { revalidatePath } from 'next/cache'
import { EtapaLead } from '@/types'
import twilio from 'twilio'

const TWILIO_FROM = process.env.TWILIO_WHATSAPP_FROM ?? '+14284362377'

export async function cambiarEtapa(leadId: string, etapa: EtapaLead) {
  const supabase = createServiceClient()
  const { error } = await supabase
    .from('crm_leads')
    .update({ etapa, updated_at: new Date().toISOString() })
    .eq('id', leadId)

  if (error) return { error: error.message }
  revalidatePath('/admin/leads')
  revalidatePath(`/admin/leads/${leadId}`)
  return { error: null }
}

export async function guardarNotas(leadId: string, notas: string) {
  const supabase = createServiceClient()
  const { error } = await supabase
    .from('crm_leads')
    .update({ notas, updated_at: new Date().toISOString() })
    .eq('id', leadId)

  if (error) return { error: error.message }
  revalidatePath(`/admin/leads/${leadId}`)
  return { error: null }
}

export async function enviarRespuesta(leadId: string, telefono: string, mensaje: string) {
  const supabase = createServiceClient()
  const from = TWILIO_FROM.startsWith('whatsapp:') ? TWILIO_FROM : `whatsapp:${TWILIO_FROM}`
  const to   = telefono.startsWith('whatsapp:') ? telefono : `whatsapp:${telefono}`

  try {
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
    await client.messages.create({ from, to, body: mensaje })

    await supabase.from('crm_mensajes').insert({ lead_id: leadId, sentido: 'saliente', mensaje })
    revalidatePath(`/admin/leads/${leadId}`)
    return { error: null }
  } catch (e: any) {
    // 63016/63015: Twilio bloquea mensajes libres fuera de la ventana de 24h
    // desde el último mensaje del lead — solo permite plantillas aprobadas.
    if (e?.code === 63016 || e?.code === 63015) {
      return { error: 'Pasaron más de 24h desde el último mensaje del lead. WhatsApp solo permite responder con plantillas aprobadas fuera de ese plazo.' }
    }
    return { error: e?.message ?? 'Error al enviar el mensaje' }
  }
}
