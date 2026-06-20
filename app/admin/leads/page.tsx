export const dynamic = 'force-dynamic'
import { createServiceClient } from '@/lib/supabase/service'
import { Lead } from '@/types'
import CrmKanban from '@/components/admin/crm-kanban'

export default async function AdminLeadsPage() {
  const supabase = createServiceClient()

  const { data: leads } = await supabase
    .from('crm_leads')
    .select('*')
    .order('created_at', { ascending: true })

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Leads</h1>
        <p className="text-gray-500 text-sm mt-1">
          Prospección saliente y dudas entrantes de WhatsApp, en un solo lugar.
        </p>
      </div>
      <CrmKanban leads={(leads ?? []) as Lead[]} />
    </div>
  )
}
