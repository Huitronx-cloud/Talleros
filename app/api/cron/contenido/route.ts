import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const BREVO_API_KEY = process.env.BREVO_API_KEY!
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY!

// ── Obtener métricas reales de la semana ─────────────────────────────────────
async function obtenerMetricas() {
  const hace7dias = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const [
    { count: talleresNuevos },
    { count: ordenesCreadas },
    { count: clientesNuevos },
    { count: resenasEnviadas },
    { count: recordatoriosEnviados },
    { count: totalTalleres },
  ] = await Promise.all([
    supabase.from('talleres').select('*', { count: 'exact', head: true }).gte('created_at', hace7dias),
    supabase.from('ordenes').select('*', { count: 'exact', head: true }).gte('created_at', hace7dias),
    supabase.from('clientes').select('*', { count: 'exact', head: true }).gte('created_at', hace7dias),
    supabase.from('resenas_enviadas').select('*', { count: 'exact', head: true }).gte('created_at', hace7dias),
    supabase.from('recordatorios_enviados').select('*', { count: 'exact', head: true }).gte('created_at', hace7dias),
    supabase.from('talleres').select('*', { count: 'exact', head: true }),
  ])

  return {
    talleresNuevos:        talleresNuevos ?? 0,
    ordenesCreadas:        ordenesCreadas ?? 0,
    clientesNuevos:        clientesNuevos ?? 0,
    resenasEnviadas:       resenasEnviadas ?? 0,
    recordatoriosEnviados: recordatoriosEnviados ?? 0,
    totalTalleres:         totalTalleres ?? 0,
  }
}

// ── Generar posts con Claude ──────────────────────────────────────────────────
async function generarPosts(metricas: Record<string, number>): Promise<string> {
  const prompt = `Eres el community manager de TallerOS — un software de gestión para talleres mecánicos en LATAM (México, Colombia, Perú).

Esta semana TallerOS tuvo estas métricas reales:
- Talleres nuevos registrados: ${metricas.talleresNuevos}
- Órdenes de trabajo creadas: ${metricas.ordenesCreadas}
- Clientes nuevos agregados: ${metricas.clientesNuevos}
- Reseñas en Google enviadas automáticamente: ${metricas.resenasEnviadas}
- Recordatorios de mantenimiento enviados: ${metricas.recordatoriosEnviados}
- Total de talleres usando TallerOS: ${metricas.totalTalleres}

Genera 4 posts listos para publicar esta semana. Usa español de LATAM, tono directo y cercano. Incluye emojis relevantes. Cada post debe tener un CTA claro.

Contexto de TallerOS:
- Permite aprobaciones de reparaciones por WhatsApp
- Portal del cliente en tiempo real
- Reseñas automáticas en Google al entregar
- Recordatorios automáticos de mantenimiento
- Fotos del diagnóstico
- Garantía digital
- Plan Esencial $24 USD/mes, Pro $49 USD/mes
- 14 días gratis sin tarjeta

Genera exactamente en este formato:

---POST 1 — FACEBOOK (Lunes)---
[Tipo: Educativo con dato]
[Texto completo del post listo para copiar y pegar, máximo 300 palabras]
[Hashtags sugeridos]
[Imagen sugerida: descripción de qué imagen usar de las que tiene TallerOS]

---POST 2 — FACEBOOK (Miércoles)---
[Tipo: Social proof / caso de éxito]
[Texto completo del post listo para copiar y pegar, máximo 200 palabras]
[Hashtags sugeridos]
[Imagen sugerida: descripción de qué imagen usar]

---POST 3 — TIKTOK/REELS (Jueves)---
[Tipo: Script de video 30-45 segundos]
[Script completo con indicaciones de cámara, texto en pantalla y voz]
[Hook: primera línea que engancha en los primeros 2 segundos]
[CTA final]

---POST 4 — FACEBOOK (Viernes)---
[Tipo: Promocional directo]
[Texto completo listo para copiar y pegar, máximo 150 palabras]
[Hashtags sugeridos]
[Imagen sugerida: descripción de qué imagen usar]

---RESUMEN DE LA SEMANA---
[2-3 líneas resumiendo las métricas más destacadas para incluir en los posts si aplica]`

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type':      'application/json',
      'x-api-key':         ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model:      'claude-haiku-4-5-20251001',
      max_tokens: 2000,
      messages:   [{ role: 'user', content: prompt }],
    }),
  })

  const data = await res.json()
  return data.content?.[0]?.text ?? 'Error generando contenido'
}

// ── Enviar por email ──────────────────────────────────────────────────────────
async function enviarReporte(posts: string, metricas: Record<string, number>): Promise<void> {
  const semana = new Date().toLocaleDateString('es-MX', { 
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
  })

  const html = `
<div style="font-family:'Segoe UI',Arial,sans-serif;max-width:680px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
  <div style="background:linear-gradient(135deg,#1e3a5f,#1d4ed8);padding:32px;text-align:center;">
    <p style="margin:0;color:#fff;font-size:24px;font-weight:900;">TallerOS</p>
    <p style="margin:8px 0 0;color:#93c5fd;font-size:14px;">📱 Contenido semanal para redes sociales</p>
    <p style="margin:4px 0 0;color:#bfdbfe;font-size:12px;">${semana}</p>
  </div>

  <div style="padding:32px;">
    <h2 style="color:#0f172a;font-size:18px;font-weight:800;margin-bottom:16px;">📊 Métricas de la semana</h2>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
      ${[
        ['🏪 Talleres nuevos', metricas.talleresNuevos],
        ['📋 Órdenes creadas', metricas.ordenesCreadas],
        ['👥 Clientes nuevos', metricas.clientesNuevos],
        ['⭐ Reseñas enviadas', metricas.resenasEnviadas],
        ['🔔 Recordatorios enviados', metricas.recordatoriosEnviados],
        ['🏆 Total talleres en TallerOS', metricas.totalTalleres],
      ].map(([label, value]) => `
        <tr style="border-bottom:1px solid #f1f5f9;">
          <td style="padding:10px 0;font-size:14px;color:#334155;">${label}</td>
          <td style="padding:10px 0;font-size:16px;font-weight:800;color:#2563eb;text-align:right;">${value}</td>
        </tr>
      `).join('')}
    </table>

    <h2 style="color:#0f172a;font-size:18px;font-weight:800;margin-bottom:16px;">✍️ Posts de esta semana</h2>
    <div style="background:#f8fafc;border-radius:12px;padding:24px;border:1px solid #e2e8f0;">
      <pre style="font-family:'Segoe UI',Arial,sans-serif;font-size:14px;color:#334155;line-height:1.8;white-space:pre-wrap;margin:0;">${posts}</pre>
    </div>

    <div style="margin-top:24px;background:#f0fdf4;border-radius:12px;padding:16px;border:1px solid #bbf7d0;">
      <p style="margin:0;font-size:13px;color:#166534;line-height:1.6;">
        💡 <strong>Instrucciones:</strong> Copia cada post directamente y pégalo en Facebook o TikTok. 
        Publica el Lunes, Miércoles, Jueves y Viernes para máximo alcance.
        Los posts del Jueves son scripts de video — grába un video rápido desde tu celular siguiendo el script.
      </p>
    </div>
  </div>

  <div style="background:#f8fafc;padding:16px 32px;border-top:1px solid #e2e8f0;">
    <p style="margin:0;color:#94a3b8;font-size:12px;text-align:center;">
      © 2026 TallerOS · Reporte generado automáticamente cada domingo
    </p>
  </div>
</div>`

  await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': BREVO_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sender:      { name: 'TallerOS Agente', email: 'hola@tallerosapp.com' },
      to:          [{ email: 'hola@tallerosapp.com', name: 'Ivan' }],
      subject:     `📱 Posts de la semana — TallerOS (${metricas.totalTalleres} talleres activos)`,
      htmlContent: html,
    }),
  })
}

// ── Handler ───────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    console.log('🎨 Agente de contenido iniciado...')

    const metricas = await obtenerMetricas()
    console.log('📊 Métricas obtenidas:', metricas)

    const posts = await generarPosts(metricas)
    console.log('✍️ Posts generados')

    await enviarReporte(posts, metricas)
    console.log('📧 Reporte enviado a hola@tallerosapp.com')

    return NextResponse.json({ 
      ok:      true, 
      metricas,
      message: 'Posts generados y enviados a hola@tallerosapp.com'
    })
  } catch (error: any) {
    console.error('Content agent error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
