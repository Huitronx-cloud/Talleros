import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY!)

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { nombreUsuario, nombreTaller } = await req.json()

  try {
    await resend.emails.send({
      from:    'TallerOS <hola@tallerosapp.com>',
      to:      user.email!,
      subject: `¡Bienvenido a TallerOS, ${nombreUsuario}! Tu taller ya está activo 🚀`,
      html:    buildEmailBienvenida({ nombreUsuario, nombreTaller }),
    })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Email bienvenida error:', err)
    return NextResponse.json({ error: 'Error enviando email' }, { status: 500 })
  }
}

function buildEmailBienvenida({ nombreUsuario, nombreTaller }: { nombreUsuario: string; nombreTaller: string }) {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

        <tr>
          <td style="background:linear-gradient(135deg,#1d4ed8 0%,#0891b2 100%);padding:40px;text-align:center;">
            <div style="font-size:32px;font-weight:800;color:#fff;letter-spacing:-1px;">
              Taller<span style="opacity:0.7;">OS</span>
            </div>
            <div style="display:inline-block;background:rgba(255,255,255,0.2);color:#fff;font-size:13px;font-weight:700;padding:4px 16px;border-radius:999px;margin-top:10px;">
              ¡Tu taller está activo! 🎉
            </div>
          </td>
        </tr>

        <tr>
          <td style="padding:40px;">
            <p style="font-size:24px;font-weight:700;color:#111827;margin:0 0 12px;">
              Hola ${nombreUsuario}, ¡bienvenido! 👋
            </p>
            <p style="color:#6b7280;font-size:15px;line-height:1.7;margin:0 0 24px;">
              <strong style="color:#111827;">${nombreTaller}</strong> ya está configurado en TallerOS.
              Tienes 14 días gratis para explorar todo lo que la plataforma puede hacer por tu negocio.
            </p>

            <div style="background:#eff6ff;border-radius:10px;padding:24px;margin-bottom:32px;">
              <p style="font-size:14px;font-weight:700;color:#1e40af;margin:0 0 16px;">
                3 cosas que puedes hacer ahora mismo:
              </p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:6px 0;vertical-align:top;width:28px;"><span style="font-size:16px;">🔧</span></td>
                  <td style="padding:6px 0;color:#374151;font-size:14px;line-height:1.5;">
                    <strong>Crea tu primera orden de trabajo</strong> — registra un vehículo y empieza a operar.
                  </td>
                </tr>
                <tr>
                  <td style="padding:6px 0;vertical-align:top;width:28px;"><span style="font-size:16px;">📱</span></td>
                  <td style="padding:6px 0;color:#374151;font-size:14px;line-height:1.5;">
                    <strong>Instala TallerOS en tu celular</strong> — funciona como app nativa en iOS y Android.
                  </td>
                </tr>
                <tr>
                  <td style="padding:6px 0;vertical-align:top;width:28px;"><span style="font-size:16px;">👥</span></td>
                  <td style="padding:6px 0;color:#374151;font-size:14px;line-height:1.5;">
                    <strong>Invita a tu equipo</strong> — mecánicos y recepcionistas en segundos.
                  </td>
                </tr>
              </table>
            </div>

            <table cellpadding="0" cellspacing="0" style="margin:0 auto 32px;">
              <tr>
                <td style="background:#1d4ed8;border-radius:10px;box-shadow:0 4px 14px rgba(0,0,0,0.2);">
                  <a href="https://www.tallerosapp.com/dashboard"
                     style="display:inline-block;padding:16px 40px;color:#fff;font-size:16px;font-weight:700;text-decoration:none;">
                    Ir a mi taller →
                  </a>
                </td>
              </tr>
            </table>

            <p style="color:#6b7280;font-size:14px;line-height:1.7;margin:0;text-align:center;">
              ¿Tienes dudas? Escríbenos a <a href="mailto:hola@tallerosapp.com" style="color:#1d4ed8;">hola@tallerosapp.com</a>
            </p>
          </td>
        </tr>

        <tr>
          <td style="background:#f9fafb;padding:20px 40px;text-align:center;border-top:1px solid #f3f4f6;">
            <p style="color:#9ca3af;font-size:11px;margin:0;">
              TallerOS — Gestión inteligente para talleres mecánicos
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}