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
console.log('[RESEND KEY]', process.env.RESEND_API_KEY ? 'existe' : 'NO EXISTE')
  // Enviar email con Resend directamente
const resendRes = await fetch('https://api.resend.com/emails', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    from: 'TallerOS <notificaciones@tallerosapp.com>',
    to: [email],
    subject: `Te invitaron a unirte a ${(taller as any)?.nombre ?? 'un taller'} en TallerOS`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
        <h1 style="font-size:22px;color:#111827;margin-bottom:8px">🔧 TallerOS</h1>
        <p style="color:#6B7280;font-size:14px;margin-bottom:24px">
          Has sido invitado a unirte a <strong>${(taller as any)?.nombre ?? 'un taller'}</strong> 
          como <strong>${rol}</strong>.
        </p>
        <a href="${link}" 
           style="display:inline-block;background:#2563EB;color:#fff;text-decoration:none;
                  padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600">
          Aceptar invitación
        </a>
        <p style="color:#9CA3AF;font-size:12px;margin-top:24px">
          Este link expira en 7 días. Si no esperabas esta invitación, ignora este email.
        </p>
      </div>
    `,
  }),
})

const resendData = await resendRes.json()
console.log('[RESEND]', resendData)

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