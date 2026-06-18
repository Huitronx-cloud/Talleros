import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { createClient } from '@supabase/supabase-js'

const BREVO_API_KEY = process.env.BREVO_API_KEY!

function emailScript(titulo: string, script: string): string {
  const lineas = script.split('\n').filter(l => l.trim()).map(l => 
    `<p style="color:#0f172a;font-size:15px;line-height:1.7;margin-bottom:12px;">${l}</p>`
  ).join('')

  return `
    <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
      <div style="background:#1e3a5f;padding:28px 32px;">
        <p style="color:#93c5fd;font-size:12px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;margin:0 0 8px;">TallerOS · Script del día</p>
        <h1 style="color:#ffffff;font-size:20px;font-weight:700;margin:0;line-height:1.3;">${titulo}</h1>
      </div>
      <div style="padding:32px;">
        <div style="background:#f8fafc;border-left:4px solid #2563eb;border-radius:0 8px 8px 0;padding:20px 24px;margin-bottom:24px;">
          <p style="color:#64748b;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 12px;">📹 Script para HeyGen — ~60 segundos</p>
          ${lineas}
        </div>
        <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px 20px;margin-bottom:24px;">
          <p style="color:#166534;font-size:13px;font-weight:600;margin:0 0 6px;">✅ Checklist antes de grabar</p>
          <ul style="color:#166534;font-size:13px;margin:0;padding-left:20px;line-height:1.8;">
            <li>Avatar: Kaleb con chamarra azul</li>
            <li>Fondo: uno de los 24 fondos de taller</li>
            <li>Voz: español mexicano</li>
            <li>Subtítulos: activados</li>
            <li>Formato: 9:16 · 1080x1920</li>
          </ul>
        </div>
        <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:16px 20px;">
          <p style="color:#1e40af;font-size:13px;font-weight:600;margin:0 0 6px;">📤 Después de generar</p>
          <ul style="color:#1e40af;font-size:13px;margin:0;padding-left:20px;line-height:1.8;">
            <li>Subir a TikTok con música de fondo</li>
            <li>Subir a YouTube Shorts</li>
          </ul>
        </div>
      </div>
      <div style="background:#f8fafc;padding:16px 32px;border-top:1px solid #e2e8f0;">
        <p style="color:#94a3b8;font-size:12px;margin:0;text-align:center;">TallerOS · Agente de Contenido · ${new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>
    </div>
  `
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Tomar el script más reciente no enviado
  const { data: scripts, error } = await supabase
    .from('scripts_video')
    .select('*')
    .eq('email_enviado', false)
    .order('created_at', { ascending: false })
    .limit(1)

  if (error || !scripts || scripts.length === 0) {
    return NextResponse.json({ ok: true, mensaje: 'No hay scripts pendientes de enviar' })
  }

  const scriptRow = scripts[0]

  try {
    await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': BREVO_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sender:      { name: 'TallerOS Agente', email: 'hola@tallerosapp.com' },
        to:          [{ email: 'hola@tallerosapp.com', name: 'Ivan' }],
        subject:     `📹 Script del día — ${scriptRow.titulo}`,
        htmlContent: emailScript(scriptRow.titulo, scriptRow.script),
      }),
    })

    await supabase
      .from('scripts_video')
      .update({ email_enviado: true })
      .eq('id', scriptRow.id)

    return NextResponse.json({ ok: true, titulo: scriptRow.titulo })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}