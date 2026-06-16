export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const BREVO_API_KEY = process.env.BREVO_API_KEY!

function emailBase(contenido: string): string {
  return `<!DOCTYPE html><html><body style="margin:0;padding:20px;background:#f8fafc;">
  <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;max-width:560px;margin:0 auto;background:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #e2e8f0;">
    <div style="padding:32px 36px;border-bottom:3px solid #2563eb;">
      <p style="margin:0;font-size:12px;font-weight:700;letter-spacing:1.5px;color:#2563eb;text-transform:uppercase;">TallerOS</p>
    </div>
    <div style="padding:36px;">${contenido}</div>
    <div style="padding:20px 36px;background:#f8fafc;border-top:1px solid #e2e8f0;">
      <p style="margin:0;font-size:12px;color:#94a3b8;">TallerOS · tallerosapp.com</p>
    </div>
  </div>
  </body></html>`
}

const FIRMA = `<p style="margin:32px 0 4px;font-size:15px;color:#334155;">Saludos,</p>
<p style="margin:0;font-size:15px;font-weight:600;color:#0f172a;">Ivan</p>
<p style="margin:2px 0 0;font-size:13px;color:#64748b;">Fundador, TallerOS</p>`

async function enviarEmail(to: string, nombre: string, subject: string, contenido: string): Promise<boolean> {
  try {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': BREVO_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sender:      { name: 'Ivan de TallerOS', email: 'hola@tallerosapp.com' },
        to:          [{ email: to, name: nombre }],
        subject,
        htmlContent: emailBase(contenido),
      }),
    })
    return res.ok
  } catch { return false }
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

  const acciones: string[] = []
  const llamadasHoy: string[] = []

  const { count: pagando } = await supabase
    .from('suscripciones').select('*', { count: 'exact', head: true })
    .in('plan', ['esencial', 'pro']).eq('estado', 'activa')

  const { count: trialsActivos } = await supabase
    .from('suscripciones').select('*', { count: 'exact', head: true })
    .eq('plan', 'trial').eq('estado', 'activa')

  const ayer = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const { count: registrosAyer } = await supabase
    .from('talleres').select('*', { count: 'exact', head: true })
    .gte('created_at', ayer)

  const en3dias = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
  const { data: trialsCalientes } = await supabase
    .from('suscripciones')
    .select('taller_id, trial_fin, talleres(nombre, telefono)')
    .eq('plan', 'trial').eq('estado', 'activa')
    .lte('trial_fin', en3dias)
    .order('trial_fin', { ascending: true })
    .limit(10)

  for (const trial of trialsCalientes ?? []) {
    const taller = trial.talleres as any
    if (!taller) continue
    const { count: ordenes } = await supabase
      .from('ordenes').select('*', { count: 'exact', head: true })
      .eq('taller_id', trial.taller_id)
    const diasRestantes = Math.ceil((new Date(trial.trial_fin).getTime() - Date.now()) / 86400000)
    const actividad = (ordenes ?? 0) > 0 ? `${ordenes} ordenes creadas - ACTIVO` : 'sin actividad'
    llamadasHoy.push(`<strong>${taller.nombre}</strong> — vence en ${diasRestantes} dia(s) — ${actividad}${taller.telefono ? ` — Tel: ${taller.telefono}` : ''}`)
  }

  const hace2dias = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  const hace7dias = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const { data: talleresRecientes } = await supabase
    .from('talleres')
    .select('id, nombre, created_at, nudge_inactividad_at')
    .gte('created_at', hace7dias)
    .lte('created_at', hace2dias)
    .is('nudge_inactividad_at', null)
    .limit(10)

  let nudgesEnviados = 0
  for (const taller of talleresRecientes ?? []) {
    const { count: ordenes } = await supabase
      .from('ordenes').select('*', { count: 'exact', head: true })
      .eq('taller_id', taller.id)
    if ((ordenes ?? 0) > 0) continue

    const { data: propietario } = await supabase
      .from('usuarios')
      .select('email, nombre')
      .eq('taller_id', taller.id)
      .eq('rol', 'propietario')
      .single()
    if (!propietario?.email) continue

    const ok = await enviarEmail(
      propietario.email,
      propietario.nombre ?? taller.nombre,
      `${propietario.nombre ?? 'Hola'}, ¿te ayudo a configurar ${taller.nombre}?`,
      `<p style="margin:0 0 20px;font-size:16px;color:#0f172a;">Hola ${propietario.nombre ?? ''},</p>
      <p style="margin:0 0 16px;font-size:15px;color:#334155;line-height:1.7;">Vi que registraste ${taller.nombre} en TallerOS hace unos dias pero todavia no has creado tu primera orden de trabajo.</p>
      <p style="margin:0 0 16px;font-size:15px;color:#334155;line-height:1.7;">¿Hubo algo que no quedo claro? El primer paso es registrar un cliente con su vehiculo — tarda 2 minutos. De ahi todo fluye solo.</p>
      <div style="text-align:center;margin:32px 0;">
        <a href="https://www.tallerosapp.com/clientes" style="background:#2563eb;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:15px;font-weight:600;display:inline-block;">Registrar mi primer cliente →</a>
      </div>
      <p style="margin:0 0 16px;font-size:15px;color:#334155;line-height:1.7;">Y si prefieres que te lo muestre yo directamente, responde este correo y agendamos 15 minutos.</p>
      ${FIRMA}`
    )

    if (ok) {
      await supabase.from('talleres')
        .update({ nudge_inactividad_at: new Date().toISOString() })
        .eq('id', taller.id)
      nudgesEnviados++
      acciones.push(`Nudge de inactividad enviado a ${taller.nombre}`)
    }
  }

  const { count: prospectadosAyer } = await supabase
    .from('prospectos_enviados').select('*', { count: 'exact', head: true })
    .gte('created_at', ayer)

  const { count: articulosTotal } = await supabase
    .from('articulos_blog').select('*', { count: 'exact', head: true })
    .eq('publicado', true)

  const reporteHtml = `
    <p style="margin:0 0 8px;font-size:18px;font-weight:700;color:#0f172a;">Reporte diario — ${new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'long' })}</p>
    <p style="margin:0 0 24px;font-size:13px;color:#64748b;">Generado automaticamente por el Orquestador</p>
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:20px;margin-bottom:20px;">
      <p style="margin:0 0 12px;font-size:12px;font-weight:700;color:#2563eb;text-transform:uppercase;letter-spacing:1px;">Metricas</p>
      <p style="margin:0 0 6px;font-size:14px;color:#334155;">Clientes pagando: <strong>${pagando ?? 0}</strong> / 500</p>
      <p style="margin:0 0 6px;font-size:14px;color:#334155;">Trials activos: <strong>${trialsActivos ?? 0}</strong></p>
      <p style="margin:0 0 6px;font-size:14px;color:#334155;">Registros ultimas 24h: <strong>${registrosAyer ?? 0}</strong></p>
      <p style="margin:0 0 6px;font-size:14px;color:#334155;">Prospectados ayer: <strong>${prospectadosAyer ?? 0}</strong></p>
      <p style="margin:0;font-size:14px;color:#334155;">Articulos publicados: <strong>${articulosTotal ?? 0}</strong></p>
    </div>
    ${llamadasHoy.length > 0 ? `
    <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:20px;margin-bottom:20px;">
      <p style="margin:0 0 12px;font-size:12px;font-weight:700;color:#dc2626;text-transform:uppercase;letter-spacing:1px;">Llamadas de hoy — trials por vencer</p>
      <p style="margin:0 0 12px;font-size:13px;color:#7f1d1d;">Estos talleres deciden en los proximos 3 dias. Un WhatsApp tuyo hoy puede cerrar la venta:</p>
      ${llamadasHoy.map(l => `<p style="margin:0 0 8px;font-size:14px;color:#334155;">${l}</p>`).join('')}
    </div>` : `
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;margin-bottom:20px;">
      <p style="margin:0;font-size:14px;color:#166534;">No hay trials venciendo en los proximos 3 dias</p>
    </div>`}
    ${acciones.length > 0 ? `
    <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:20px;margin-bottom:20px;">
      <p style="margin:0 0 12px;font-size:12px;font-weight:700;color:#1d4ed8;text-transform:uppercase;letter-spacing:1px;">Lo que hice hoy por ti</p>
      ${acciones.map(a => `<p style="margin:0 0 6px;font-size:14px;color:#334155;">${a}</p>`).join('')}
    </div>` : ''}
    <p style="margin:24px 0 0;font-size:13px;color:#94a3b8;">Meta: 1 venta/dia → 500 clientes. Faltan ${500 - (pagando ?? 0)}.</p>
  `

  await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': BREVO_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sender:      { name: 'TallerOS Orquestador', email: 'hola@tallerosapp.com' },
      to:          [{ email: 'hola@tallerosapp.com', name: 'Ivan' }],
      subject:     `[Orquestador] ${pagando ?? 0}/500 · ${llamadasHoy.length} llamadas hoy · ${nudgesEnviados} nudges`,
      htmlContent: emailBase(reporteHtml),
    }),
  })

  return NextResponse.json({
    ok: true,
    metricas: { pagando, trialsActivos, registrosAyer, prospectadosAyer },
    llamadasHoy: llamadasHoy.length,
    nudgesEnviados,
    acciones,
  })
}
