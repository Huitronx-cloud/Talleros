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

  // Sanitización básica — limitar longitud y limpiar espacios
  const sanitize = (val: unknown, max = 100): string | null => {
    if (typeof val !== 'string') return null
    const clean = val.trim().slice(0, max)
    return clean || null
  }

  if (!sanitize(body.nombre)) {
    return NextResponse.json({ error: 'El nombre del cliente es obligatorio.' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('clientes')
    .insert({
      taller_id:       usuario.taller_id,
      nombre:          sanitize(body.nombre, 100)!,
      telefono:        sanitize(body.telefono, 20),
      vehiculo_marca:  sanitize(body.vehiculo_marca, 50),
      vehiculo_modelo: sanitize(body.vehiculo_modelo, 50),
      placas:          sanitize(body.placas, 20),
    })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ id: data.id })
}