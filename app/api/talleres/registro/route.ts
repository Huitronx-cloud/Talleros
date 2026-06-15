import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { Resend } from 'resend'

export async function POST(req: Request) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const resend = new Resend(process.env.RESEND_API_KEY!)

  try {
    const body = await req.json()
    const { nombre_taller, nombre_propietario, email, password, pais = 'MX', telefono = '' } = body

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
    if (!password || password.length < 8) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 8 caracteres.' },
        { status: 400 }
      )
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

    // ── 1. Crear usuario en Auth con contraseña ──────────────────────────────
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email.toLowerCase().trim(),
      password,
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

    // ── 2. Esperar trigger ───────────────────────────────────────────────────
    await new Promise(resolve => setTimeout(resolve, 500))

    // ── 3. Obtener taller_id que creó el trigger ─────────────────────────────
    const { data: usuario } = await supabaseAdmin
      .from('usuarios')
      .select('taller_id')
      .eq('id', userId)
      .single()

    if (!usuario?.taller_id) {
      console.error('No se encontró taller_id después del trigger')
      return NextResponse.json(
        { error: 'Error al configurar el taller. Intenta de nuevo.' },
        { status: 500 }
      )
    }

    // ── 4. Actualizar taller con datos reales ────────────────────────────────
    await supabaseAdmin
      .from('talleres')
      .update({ nombre: nombre_taller.trim(), pais })
      .eq('id', usuario.taller_id)

    // ── 4b. Guardar teléfono del propietario (para WhatsApp) ─────────────────
    if (telefono?.trim()) {
      await supabaseAdmin
        .from('usuarios')
        .update({ telefono: telefono.trim() })
        .eq('id', userId)
    }

    // ── 5. Generar magic link para acceso directo al onboarding ──────────────
    const appUrl = process.env.NEXT_PUBLIC_APP_URL!
    const { data: linkData } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: email.toLowerCase().trim(),
      options: { redirectTo: `${appUrl}/auth/callback?next=/onboarding` },
    })
    const magicLink = linkData?.properties?.action_link ?? `${appUrl}/login`

    // ── 6. Email de bienvenida ───────────────────────────────────────────────
    try {
      await resend.emails.send({
        from: 'TallerOS <hola@tallerosapp.com>',
        to: email.toLowerCase().trim(),
        subject: `¡Bienvenido a TallerOS, ${nombre_propietario.trim().split(' ')[0]}! 🎉`,
        html: buildEmailHtml({
          nombre: nombre_propietario.trim(),
          nombreTaller: nombre_taller.trim(),
          magicLink,
        }),
      })
    } catch (emailErr) {
      console.error('Email error (no crítico):', emailErr)
    }

    return NextResponse.json({ ok: true })

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
          <td style="background:linear-gradient(135deg,#1d4ed8 0%,#1e40af 100%);padding:40px;text-align:center;">
            <div style="font-size:32px;font-weight:800;color:#fff;letter-spacing:-1px;">
              Taller<span style="color:#93c5fd;">OS</span>
            </div>
            <div style="color:#bfdbfe;font-size:13px;margin-top:6px;">
              Gestión inteligente para tu taller
            </div>
          </td>
        </tr>
        <tr>
          <td style="padding:40px;">
            <p style="font-size:24px;font-weight:700;color:#111827;margin:0 0 8px;">
              ¡Bienvenido, ${primerNombre}! 🎉
            </p>
            <p style="color:#6b7280;font-size:15px;line-height:1.7;margin:0 0 16px;">
              Tomaste una decisión increíble. <strong style="color:#111827;">${nombreTaller}</strong> ahora tiene 
              todo lo que necesita para operar de manera profesional, eficiente y moderna.
            </p>
            <p style="color:#6b7280;font-size:15px;line-height:1.7;margin:0 0 32px;">
              Miles de talleres en LATAM ya confían en TallerOS para gestionar sus órdenes, 
              clientes y cobros. Hoy te unes a esa familia. 💪
            </p>

            <table cellpadding="0" cellspacing="0" style="margin:0 auto 32px;">
              <tr>
                <td style="background:#1d4ed8;border-radius:10px;box-shadow:0 4px 14px rgba(29,78,216,0.4);">
                  <a href="${magicLink}"
                     style="display:inline-block;padding:16px 40px;color:#fff;font-size:16px;font-weight:700;text-decoration:none;letter-spacing:0.2px;">
                    Configurar mi taller →
                  </a>
                </td>
              </tr>
            </table>

            <div style="background:#f0f9ff;border-radius:10px;padding:24px;margin-bottom:24px;">
              <p style="font-size:14px;font-weight:700;color:#0369a1;margin:0 0 16px;">
                ¿Qué puedes hacer desde hoy?
              </p>
              <table width="100%" cellpadding="0" cellspacing="0">
                ${[
                  ['🔧', 'Registrar órdenes de servicio en segundos'],
                  ['📱', 'Enviar reportes PDF por WhatsApp automáticamente'],
                  ['📅', 'Gestionar citas con calendario en tiempo real'],
                  ['⭐', 'Recibir reseñas de Google automáticas al entregar'],
                  ['👥', 'Dar acceso a tu equipo con roles personalizados'],
                ].map(([emoji, texto]) => `
                <tr>
                  <td style="padding:6px 0;vertical-align:top;width:28px;">
                    <span style="font-size:16px;">${emoji}</span>
                  </td>
                  <td style="padding:6px 0;color:#374151;font-size:14px;line-height:1.5;">
                    ${texto}
                  </td>
                </tr>`).join('')}
              </table>
            </div>

            <p style="color:#9ca3af;font-size:12px;margin:0 0 4px;">
              ¿El botón no funciona? Copia este link:
            </p>
            <p style="color:#2563eb;font-size:12px;word-break:break-all;margin:0;">
              ${magicLink}
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:#f9fafb;padding:20px 40px;text-align:center;border-top:1px solid #f3f4f6;">
            <p style="color:#9ca3af;font-size:11px;margin:0 0 4px;">
              Este enlace de acceso expira en 24 horas.
            </p>
            <p style="color:#9ca3af;font-size:11px;margin:0;">
              ¿Necesitas ayuda? Escríbenos a <a href="mailto:hola@tallerosapp.com" style="color:#2563eb;">hola@tallerosapp.com</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}