import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const admin    = createServiceClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('taller_id, rol, nombre')
    .eq('id', user.id)
    .single()

  if (!usuario || !['propietario', 'admin'].includes(usuario.rol)) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }

  const { email, rol } = await req.json()

  if (!email || !rol) return NextResponse.json({ error: 'Email y rol son requeridos' }, { status: 400 })
  if (!['admin', 'tecnico', 'recepcion'].includes(rol)) {
    return NextResponse.json({ error: 'Rol inválido' }, { status: 400 })
  }

  // Verificar que no exista ya un usuario con ese email en el taller
  const { data: existente } = await admin
    .from('usuarios')
    .select('id')
    .eq('email', email)
    .eq('taller_id', usuario.taller_id)
    .single()

  if (existente) return NextResponse.json({ error: 'Este email ya pertenece al taller' }, { status: 400 })

  // Crear invitación
  const { data: invitacion, error } = await admin
    .from('invitaciones')
    .insert({ taller_id: usuario.taller_id, email, rol })
    .select('token')
    .single()

  if (error || !invitacion) return NextResponse.json({ error: 'Error creando invitación' }, { status: 500 })

  const { data: taller } = await admin
    .from('talleres')
    .select('nombre')
    .eq('id', usuario.taller_id)
    .single()

  // Enviar email de invitación vía Supabase Auth
  const linkBase = process.env.NEXT_PUBLIC_APP_URL ?? 'https://talleros-omega.vercel.app'
  const link     = `${linkBase}/unirse?token=${invitacion.token}`

  await admin.auth.admin.inviteUserByEmail(email, {
    data: { invitacion_token: invitacion.token },
    redirectTo: link,
  })

  return NextResponse.json({ success: true, link })
}

export async function GET(req: NextRequest) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('taller_id, rol')
    .eq('id', user.id)
    .single()

  if (!usuario || !['propietario', 'admin'].includes(usuario.rol)) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }

  const { data: invitaciones } = await supabase
    .from('invitaciones')
    .select('*')
    .eq('taller_id', usuario.taller_id)
    .order('created_at', { ascending: false })

  return NextResponse.json({ invitaciones: invitaciones ?? [] })
}