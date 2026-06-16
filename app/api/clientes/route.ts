export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('taller_id')
    .eq('id', user.id)
    .single()

  if (!usuario) return NextResponse.json({ error: 'Sin taller' }, { status: 400 })

  const body = await req.json()

  const { data, error } = await supabase
    .from('clientes')
    .insert({
      taller_id:       usuario.taller_id,
      nombre:          body.nombre,
      telefono:        body.telefono ?? null,
      vehiculo_marca:  body.vehiculo_marca ?? null,
      vehiculo_modelo: body.vehiculo_modelo ?? null,
      placas:          body.placas ?? null,
    })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ id: data.id })
}