import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const maxDuration = 60
import { createPublicReadClient } from '@/lib/supabase-public'

const BREVO_API_KEY = process.env.BREVO_API_KEY!

function emailScript(titulo: string, script: string, scriptLargo?: string): string {
  const lineas = script.split('\n').filter(l => l.trim()).map(l =>
    `<p style="color:#0f172a;font-size:15px;line-height:1.7;margin-bottom:12px;">${l}</p>`
  ).join('')

  const lineasLargo = scriptLargo
    ? scriptLargo.split('\n').filter(l => l.trim()).map(l =>
        `<p style="color:#0f172a;font-size:15px;line-height:1.7;margin-bottom:12px;">${l}</p>`
      ).join('')
    : ''

  const seccionLargo = scriptLargo ? `
    <div style="margin-top:32px;">
      <div style="background:#1e3a5f;padding:16px 24px;border-radius:8px 8px 0 0;">
        <p style="color:#93c5fd;font-size:12px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;margin:0 0 4px;">Script largo · YouTube</p>
        <p style="color:#ffffff;font-size:16px;font-weight:700;margin:0;">Video de 5 minutos — Estilo Hormozi</p>
      </div>
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:0 0 8px 8px;padding:24px;">
        ${lineasLargo}
      </div>
      <div style="background:#fefce8;border:1px solid #fde68a;border-radius:8px;padding:16px 20px;margin-top:16px;">
        <p style="color:#92400e;font-size:13px;font-weight:600;margin:0 0 6px;">📹 Checklist video largo</p>
        <ul style="color:#92400e;font-size:13px;margin:0;padding-left:20px;line-height:1.8;">
          <li>Mismo avatar Kaleb con chamarra azul</li>
          <li>Fondo de taller rotativo</li>
          <li>Formato: 16:9 · 1920x1080</li>
          <li>Subtítulos activados</li>
          <li>Subir solo a YouTube (no Shorts)</li>
        </ul>
      </div>
    </div>
  ` : ''

  return `
    <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
      <div style="background:#1e3a5f;padding:28px 32px;">
        <p style="color:#93c5fd;font-size:12px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;margin:0 0 8px;">TallerOS · Script del día</p>
        <h1 style="color:#ffffff;font-size:20px;font-weight:700;margin:0;line-height:1.3;">${titulo}</h1>
      </div>
      <div style="padding:32px;">
        <div style="background:#f8fafc;border-left:4px solid #2563eb;border-radius:0 8px 8px 0;padding:20px 24px;margin-bottom:24px;">
          <p style="color:#64748b;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 12px;">📱 Script corto — TikTok + YouTube Shorts · 60 segundos</p>
          ${lineas}
        </div>
        <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px 20px;margin-bottom:24px;">
          <p style="color:#166534;font-size:13px;font-weight:600;margin:0 0 6px;">✅ Checklist video corto</p>
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
        ${seccionLargo}
      </div>
      <div style="background:#f8fafc;padding:16px 32px;border-top:1px solid #e2e8f0;">
        <p style="color:#94a3b8;font-size:12px;margin:0;text-align:center;">TallerOS · Agente de Contenido · ${new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>
    </div>
  `
}

async function enviarAlertaError(detalle: string): Promise<void> {
  try {
    await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': BREVO_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sender:      { name: 'TallerOS Alertas', email: 'hola@tallerosapp.com' },
        to:          [{ email: 'hola@tallerosapp.com', name: 'Ivan' }],
        subject:     '⚠️ El envío del script del día falló — TallerOS',
        htmlContent: `<p>El cron de envío de scripts (<code>/api/cron/script-email</code>) tuvo un problema hoy:</p><p style="color:#dc2626;">${detalle}</p>`,
      }),
    })
  } catch {
    // Si la alerta misma falla no hay más que hacer — ya se perdió la visibilidad de este error
  }
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Cliente sin caché: si Next cachea el SELECT de pendientes (lo hace con los
  // fetch de supabase-js, igual que congelaba el blog), el cron reenvía a diario
  // el mismo lote viejo y nunca ve los scripts nuevos. no-store lo evita.
  const supabase = createPublicReadClient()

  const { data: scripts, error } = await supabase
    .from('scripts_video')
    .select('*')
    .eq('email_enviado', false)
    .order('created_at', { ascending: true })
    .limit(5)

  if (error) {
    await enviarAlertaError(`No se pudo consultar scripts_video: ${error.message}`)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!scripts || scripts.length === 0) {
    return NextResponse.json({ ok: true, mensaje: 'No hay scripts pendientes de enviar' })
  }

  const resultados = []

  for (const scriptRow of scripts) {
    // Buscar script largo del mismo slug si existe
    const { data: scriptLargoRow } = await supabase
      .from('scripts_video_largo')
      .select('*')
      .eq('slug', scriptRow.slug)
      .eq('email_enviado', false)
      .maybeSingle()

    // Marcar ANTES de enviar (entrega a-lo-más-una-vez): si el proceso muere
    // entre el envío y el marcado, el mismo script se reenviaba cada día.
    // Si el envío falla, se revierte la marca y se reintenta mañana.
    const { error: marcaError } = await supabase
      .from('scripts_video')
      .update({ email_enviado: true })
      .eq('id', scriptRow.id)

    if (marcaError) {
      resultados.push({ id: scriptRow.id, titulo: scriptRow.titulo, ok: false, error: `No se pudo marcar como enviado: ${marcaError.message}` })
      continue
    }

    if (scriptLargoRow) {
      await supabase
        .from('scripts_video_largo')
        .update({ email_enviado: true })
        .eq('id', scriptLargoRow.id)
    }

    const revertirMarca = async () => {
      await supabase.from('scripts_video').update({ email_enviado: false }).eq('id', scriptRow.id)
      if (scriptLargoRow) {
        await supabase.from('scripts_video_largo').update({ email_enviado: false }).eq('id', scriptLargoRow.id)
      }
    }

    try {
      const respuesta = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: { 'api-key': BREVO_API_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender:      { name: 'TallerOS Agente', email: 'hola@tallerosapp.com' },
          to:          [{ email: 'hola@tallerosapp.com', name: 'Ivan' }],
          subject:     `📹 Script del día — ${scriptRow.titulo}`,
          htmlContent: emailScript(
            scriptRow.titulo,
            scriptRow.script,
            scriptLargoRow?.script
          ),
        }),
      })

      if (!respuesta.ok) {
        const detalle = await respuesta.text()
        await revertirMarca()
        resultados.push({ id: scriptRow.id, titulo: scriptRow.titulo, ok: false, error: detalle })
        continue
      }

      resultados.push({ id: scriptRow.id, titulo: scriptRow.titulo, ok: true, script_largo: !!scriptLargoRow })

    } catch (error: any) {
      await revertirMarca()
      resultados.push({ id: scriptRow.id, titulo: scriptRow.titulo, ok: false, error: error.message })
    }
  }

  const fallidos = resultados.filter(r => !r.ok)
  if (fallidos.length > 0) {
    await enviarAlertaError(
      fallidos.map(f => `"${f.titulo}": ${f.error}`).join(' | ')
    )
  }

  return NextResponse.json({ ok: fallidos.length === 0, resultados })
}