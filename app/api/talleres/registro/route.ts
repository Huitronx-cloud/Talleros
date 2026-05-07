import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const resend = new Resend(process.env.RESEND_API_KEY!)

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { nombre_taller, nombre_propietario, email, pais = 'MX' } = body

    // ── Validaciones ────────────────────────────────────────────────────────
    if (!nombre_taller?.trim() || !email?.trim() || !nombre_propietario?.trim()) {
      return NextResponse.json(
        { error: 'Nombre del taller, propietario y email son obligatorios.' },
        { status: 400 }
      )
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Email inválido.' }, { status: 400 })
    }

    // ── Verificar email duplicado ────────────────────────────────────────────
    const { data: existente } = await supabaseAdmin
      .from('usuarios')
      .select('id')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle()

    if (existente) {
      return NextResponse.json(
        { error: 'Este email ya tiene una cuenta. Intenta iniciar sesión.' },
        { status: 409 }
      )
    }

    // ── 1. Crear usuario en Auth ─────────────────────────────────────────────
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email.toLowerCase().trim(),
      email_confirm: true,
      user_metadata: { nombre: nombre_propietario.trim() },
    })

    if (authError || !authData.user) {
      console.error('Auth error:', authError)
      return NextResponse.json(
        { error: 'No se pudo crear la cuenta. Intenta de nuevo.' },
        { status: 500 }
      )
    }

    const userId = authData.user.id
    

    // ── 2. Crear el taller ───────────────────────────────────────────────────
   const { data: taller, error: tallerError } = await supabaseAdmin
      .from('talleres')
      .insert({
        nombre: nombre_taller.trim(),
        pais,
        onboarding_completo: false,
      })
      .select('id')
      .single()

    if (tallerError || !taller) {
      await supabaseAdmin.auth.admin.deleteUser(userId)
      console.error('Taller error:', tallerError)
      return NextResponse.json({ error: 'Error al crear el taller.' }, { status: 500 })
    }

    // ── 3. Crear usuario en tabla pública ────────────────────────────────────
    const { error: usuarioError } = await supabaseAdmin
      .from('usuarios')
      .insert({
        id: userId,
        taller_id: taller.id,
        nombre: nombre_propietario.trim(),
        email: email.toLowerCase().trim(),
        rol: 'propietario',
      })

    if (usuarioError) {
      await supabaseAdmin.from('talleres').delete().eq('id', taller.id)
      await supabaseAdmin.auth.admin.deleteUser(userId)
      console.error('Usuario error:', usuarioError)
      return NextResponse.json({ error: 'Error al registrar el usuario.' }, { status: 500 })
    }

    // ── 4. Generar magic link ────────────────────────────────────────────────
    const appUrl = process.env.NEXT_PUBLIC_APP_URL!
    const { data: linkData } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: email.toLowerCase().trim(),
      options: { redirectTo: `${appUrl}/onboarding` },
    })

    const magicLink = linkData?.properties?.action_link ?? `${appUrl}/login`

    // ── 5. Email de bienvenida ───────────────────────────────────────────────
    try {
      await resend.emails.send({
        from: 'TallerOS <onboarding@resend.dev>', // ← cambia por tu dominio verificado en Resend
        to: email.toLowerCase().trim(),
        subject: `¡Bienvenido a TallerOS, ${nombre_propietario.trim().split(' ')[0]}!`,
        html: buildEmailHtml({
          nombre: nombre_propietario.trim(),
          nombreTaller: nombre_taller.trim(),
          magicLink,
        }),
      })
    } catch (emailErr) {
      console.error('Email error (no crítico):', emailErr)
    }

    return NextResponse.json({
      ok: true,
      mensaje: `Cuenta creada. Revisa tu correo en ${email} para acceder.`,
      taller_id: taller.id,
    })

  } catch (err) {
    console.error('Error inesperado en registro:', err)
    return NextResponse.json({ error: 'Error inesperado. Intenta de nuevo.' }, { status: 500 })
  }
}

function buildEmailHtml({
  nombre,
  nombreTaller,
  magicLink,
}: {
  nombre: string
  nombreTaller: string
  magicLink: string
}) {
  const primerNombre = nombre.split(' ')[0]
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;">
        <tr>
          <td style="background:#1d4ed8;padding:32px 40px;text-align:center;">
            <div style="font-size:28px;font-weight:700;color:#fff;">
              Taller<span style="color:#93c5fd;">OS</span>
            </div>
            <div style="color:#bfdbfe;font-size:13px;margin-top:4px;">
              Gestión inteligente para tu taller
            </div>
          </td>
        </tr>
        <tr>
          <td style="padding:40px;">
            <p style="font-size:20px;font-weight:600;color:#111827;margin:0 0 8px;">
              ¡Hola, ${primerNombre}! 👋
            </p>
            <p style="color:#6b7280;font-size:15px;line-height:1.6;margin:0 0 24px;">
              Tu taller <strong style="color:#111827;">${nombreTaller}</strong> ya está listo en TallerOS.
              Haz clic en el botón para configurar tu perfil y empezar a operar.
            </p>
            <table cellpadding="0" cellspacing="0" style="margin:0 0 32px;">
              <tr>
                <td style="background:#1d4ed8;border-radius:8px;">
                  <a href="${magicLink}"
                     style="display:inline-block;padding:14px 32px;color:#fff;font-size:15px;font-weight:600;text-decoration:none;">
                    Acceder a mi taller →
                  </a>
                </td>
              </tr>
            </table>
            <p style="color:#9ca3af;font-size:12px;margin:0 0 4px;">
              ¿No funciona el botón? Copia este link:
            </p>
            <p style="color:#2563eb;font-size:12px;word-break:break-all;margin:0 0 32px;">
              ${magicLink}
            </p>
            <div style="background:#f0f9ff;border-radius:8px;padding:20px;margin-bottom:24px;">
              <p style="font-size:13px;font-weight:600;color:#0369a1;margin:0 0 12px;">
                Lo que puedes hacer desde el primer día:
              </p>
              <ul style="margin:0;padding-left:20px;color:#374151;font-size:13px;line-height:1.8;">
                <li>Registrar órdenes de servicio</li>
                <li>Compartir un portal de seguimiento con tus clientes</li>
                <li>Enviar reportes de servicio por WhatsApp</li>
                <li>Gestionar citas con calendario en tiempo real</li>
              </ul>
            </div>
          </td>
        </tr>
        <tr>
          <td style="background:#f9fafb;padding:20px 40px;text-align:center;border-top:1px solid #f3f4f6;">
            <p style="color:#9ca3af;font-size:11px;margin:0;">
              Este enlace expira en 24 horas por seguridad.<br>
              Si no creaste esta cuenta, puedes ignorar este mensaje.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}