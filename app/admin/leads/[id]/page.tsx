export const dynamic = 'force-dynamic'
import { createServiceClient } from '@/lib/supabase/service'
import { notFound } from 'next/navigation'
import { Lead, MensajeCRM } from '@/types'
import LeadConversacion from '@/components/admin/lead-conversacion'

export default async function LeadDetallePage({ params }: { params: { id: string } }) {
  const supabase = createServiceClient()

  const { data: lead } = await supabase
    .from('crm_leads')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!lead) notFound()

  const { data: mensajes } = await supabase
    .from('crm_mensajes')
    .select('*')
    .eq('lead_id', params.id)
    .order('created_at', { ascending: true })

  return <LeadConversacion lead={lead as Lead} mensajes={(mensajes ?? []) as MensajeCRM[]} />
}
