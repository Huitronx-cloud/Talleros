export const dynamic = 'force-dynamic'
import { createServiceClient } from '@/lib/supabase/service'
import { Lead } from '@/types'
import CrmKanban from '@/components/admin/crm-kanban'

export default async function AdminLeadsPage() {
  const supabase = createServiceClient()

  // Descendente: el lead recién capturado es el que hay que llamar, y en
  // ascendente caía al fondo de la columna, debajo de los más fríos.
  const { data: leads } = await supabase
    .from('crm_leads')
    .select('*')
    .order('created_at', { ascending: false })

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
