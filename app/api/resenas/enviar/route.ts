export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { enviarResenaOrden } from '@/lib/resenas'

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const { data: usuario } = await supabase.from('usuarios').select('taller_id').eq('id', user.id).single()
    if (!usuario?.taller_id) return NextResponse.json({ error: 'Usuario sin taller' }, { status: 400 })

    const { orden_id } = await req.json()
    if (!orden_id) return NextResponse.json({ error: 'Falta orden_id' }, { status: 400 })

    const { data: orden } = await supabase.from('ordenes').select('id, taller_id').eq('id', orden_id).single()
    if (!orden || orden.taller_id !== usuario.taller_id) {
      return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 })
    }

    const resultado = await enviarResenaOrden(orden_id, usuario.taller_id)
    return NextResponse.json(resultado)
  } catch (error: any) {
    console.error('Error enviando reseña:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
