import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { FileText } from 'lucide-react'
import ListaCotizaciones from '@/components/cotizaciones/lista-cotizaciones'

export default async function CotizacionesPage() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('taller_id')
    .eq('id', user.id)
    .single()

  const { data: cotizaciones } = await supabase
    .from('cotizaciones')
    .select('*, clientes(nombre)')
    .eq('taller_id', usuario?.taller_id ?? '')
    .order('created_at', { ascending: false })

  if (!cotizaciones || cotizaciones.length === 0) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <FileText className="w-14 h-14 text-gray-300 mb-4" />
          <p className="text-gray-500 text-base font-medium mb-1">No hay cotizaciones aún</p>
          <p className="text-gray-400 text-sm mb-6">Crea tu primera cotización para un cliente.</p>
          <Link
            href="/cotizaciones/nueva"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors"
          >
            <FileText className="w-4 h-4" />
            Nueva cotización
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <ListaCotizaciones cotizaciones={cotizaciones} />
    </div>
  )
}
