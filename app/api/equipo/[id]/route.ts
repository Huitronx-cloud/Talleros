export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const admin    = createServiceClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { data: solicitante } = await supabase
    .from('usuarios').select('taller_id, rol').eq('id', user.id).single()

  if (!solicitante || solicitante.rol !== 'propietario') {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }

  const { rol } = await req.json()

  await admin.from('usuarios').update({ rol }).eq('id', params.id).eq('taller_id', solicitante.taller_id)

  return NextResponse.json({ success: true })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const admin    = createServiceClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { data: solicitante } = await supabase
    .from('usuarios').select('taller_id, rol').eq('id', user.id).single()

  if (!solicitante || solicitante.rol !== 'propietario') {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }

  await admin.from('usuarios').delete().eq('id', params.id).eq('taller_id', solicitante.taller_id)
  await admin.auth.admin.deleteUser(params.id)

  return NextResponse.json({ success: true })
}