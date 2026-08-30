export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getLimites, puedeCrear } from '@/lib/plan-limits'
import { puedeGestionarTaller } from '@/lib/permisos'

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

  if (!usuario || !puedeGestionarTaller(usuario.rol)) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }

  const { data: suscripcion } = await admin
    .from('suscripciones')
    .select('plan, trial_fin')
    .eq('taller_id', usuario.taller_id)
    .single()

  const { nombre, email, telefono, rol } = await req.json()

  // El nombre lo pone quien invita, no el invitado: es el texto que después
  // aparece en el desplegable de "Mecánico asignado", y con el que se le busca
  // para avisarle. Si cada uno escribe el suyo, "Juan Pérez" y "juan" acaban
  // siendo dos mecánicos distintos en los reportes.
  if (!nombre?.trim()) return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 })
  if (!email?.trim())  return NextResponse.json({ error: 'El email es requerido' }, { status: 400 })
  // El WhatsApp es por donde llega de verdad la invitación; el correo es el
  // respaldo, no al revés.
  if (!telefono?.trim()) return NextResponse.json({ error: 'El WhatsApp es requerido' }, { status: 400 })
  if (!rol) return NextResponse.json({ error: 'El rol es requerido' }, { status: 400 })
  if (!['admin', 'tecnico', 'recepcion'].includes(rol)) {
    return NextResponse.json({ error: 'Rol inválido' }, { status: 400 })
  }

  // Un espacio de más al teclear el correo hacía que las comprobaciones de
  // duplicado de abajo miraran un texto distinto del que se acaba de guardar.
  const correo = email.trim()

  // Verificar que no exista ya un usuario con ese email en el taller
  const { data: existente } = await admin
    .from('usuarios')
    .select('id')
    .eq('email', correo)
    .eq('taller_id', usuario.taller_id)
    .single()

  if (existente) return NextResponse.json({ error: 'Este email ya pertenece al taller' }, { status: 400 })

  // Invitar dos veces al mismo correo creaba dos invitaciones válidas para la
  // misma persona, y con el cupo contando invitaciones eso gastaría dos plazas
  // por un solo miembro.
  const { data: yaInvitado } = await admin
    .from('invitaciones')
    .select('id')
    .eq('taller_id', usuario.taller_id)
    .eq('email', correo)
    .eq('usado', false)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle()

  if (yaInvitado) {
    return NextResponse.json({ error: 'Ya hay una invitación pendiente para este correo. Pídele que revise su bandeja, o espera a que expire para mandar otra.' }, { status: 400 })
  }

  const limites = getLimites(suscripcion?.plan ?? 'trial', suscripcion?.trial_fin)

  // El cupo cuenta miembros MÁS invitaciones pendientes. Contando solo los
  // miembros ya registrados, un taller de 4 en Esencial podía mandar tres
  // invitaciones seguidas —cada una pasaba, porque seguían siendo 4— y acabar
  // con 7 miembros si todas se aceptaban. La plaza se reserva al invitar y se
  // libera sola si la invitación caduca.
  const [{ count: totalUsuarios }, { count: invitacionesPendientes }] = await Promise.all([
    admin.from('usuarios')
      .select('*', { count: 'exact', head: true })
      .eq('taller_id', usuario.taller_id),
    admin.from('invitaciones')
      .select('*', { count: 'exact', head: true })
      .eq('taller_id', usuario.taller_id)
      .eq('usado', false)
      .gt('expires_at', new Date().toISOString()),
  ])

  const ocupadas = (totalUsuarios ?? 0) + (invitacionesPendientes ?? 0)

  if (!puedeCrear(ocupadas, limites.usuarios)) {
    return NextResponse.json({
      error: (invitacionesPendientes ?? 0) > 0
        ? `Alcanzaste el límite de tu plan contando las ${invitacionesPendientes} invitaciones que están sin aceptar. Espera a que las acepten, o actualiza tu plan.`
        : 'Alcanzaste el límite de usuarios de tu plan. Actualiza tu plan para invitar a más miembros.',
    }, { status: 403 })
  }

  // Crear invitación
  const { data: invitacion, error } = await admin
    .from('invitaciones')
    .insert({
      taller_id: usuario.taller_id,
      email:     correo,
      nombre:    nombre.trim(),
      telefono:  telefono.trim(),
      rol,
    })
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
const ROL_LABEL: Record<string, string> = {
  tecnico:   'Mecánico',
  recepcion: 'Recepcionista',
  admin:     'Administrador',
}

const rolLabel = ROL_LABEL[rol] ?? rol
  // Enviar email con Resend directamente
const resendRes = await fetch('https://api.resend.com/emails', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    from: 'TallerOS <notificaciones@tallerosapp.com>',
    to: [correo],
    subject: `Te invitaron a unirte a ${(taller as any)?.nombre ?? 'un taller'} en TallerOS`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
        <h1 style="font-size:22px;color:#111827;margin-bottom:8px">🔧 TallerOS</h1>
        <p style="color:#6B7280;font-size:14px;margin-bottom:24px">
          Has sido invitado a unirte a <strong>${(taller as any)?.nombre ?? 'un taller'}</strong> 
          como <strong>${rolLabel}</strong>.
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

// El correo se manda igual, pero ya no es el único camino: la pantalla de
// equipo enseña este link para pasarlo por WhatsApp. Por eso se devuelve si
// salió de verdad — antes se decía "invitación enviada" aunque Resend hubiera
// fallado, y el dueño se quedaba esperando a alguien que nunca recibió nada.
return NextResponse.json({ success: true, link, correoEnviado: resendRes.ok })
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

  if (!usuario || !puedeGestionarTaller(usuario.rol)) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }

  const { data: invitaciones } = await supabase
    .from('invitaciones')
    .select('*')
    .eq('taller_id', usuario.taller_id)
    .order('created_at', { ascending: false })

  return NextResponse.json({ invitaciones: invitaciones ?? [] })
}