export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import PreciosClient from './precios-client'

export default async function PreciosPage() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('taller_id, talleres(pais)')
    .eq('id', user.id)
    .single()

  if (!usuario?.taller_id) redirect('/login')

  const pais = (usuario.talleres as unknown as { pais: string | null } | null)?.pais ?? null

  return <PreciosClient tallerId={usuario.taller_id} pais={pais} />
}