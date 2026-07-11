import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 60
export const dynamic = 'force-dynamic'

// ── Orquestador de crons ──────────────────────────────────────────────────────
// Vercel Hobby solo permite 2 crons, así que este endpoint encadena todas las
// tareas diarias en dos grupos (?group=content | notify). Cada tarea se llama
// por HTTP con el mismo Bearer CRON_SECRET que ya validan todos los handlers
// (verificado handler por handler), con timeout de 12 s y try/catch individual:
// un fallo no detiene la cadena.
// prospecting NO está incluido: sigue pausado detrás de PROSPECTING_AGENT_ENABLED.

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://tallerosapp.com'

function tareasDelGrupo(group: string): string[] {
  if (group === 'notify') {
    return [
      '/api/cron/recordatorios',        // campañas de mantenimiento (config por taller)
      '/api/cron/recordatorios-ordenes', // recordatorios programados por orden
      '/api/cron/trial-reminder',       // emails de trial a dueños (Resend)
      '/api/cron/resenas',              // red de seguridad de reseñas
      '/api/cron/recordatorios-citas',  // citas de mañana
    ]
  }
  // content (default)
  const tareas = [
    '/api/cron/blog',
    '/api/cron/videos',
    '/api/cron/script-email',
    '/api/cron/onboarding',
  ]
  // contenido es semanal: solo los domingos
  if (new Date().getDay() === 0) tareas.push('/api/cron/contenido')
  return tareas
}

interface ResultadoTarea {
  path:   string
  ok:     boolean
  status: number | null
  ms:     number
  error?: string
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const group = req.nextUrl.searchParams.get('group') === 'notify' ? 'notify' : 'content'
  const tareas = tareasDelGrupo(group)
  const results: ResultadoTarea[] = []

  for (const path of tareas) {
    const inicio = Date.now()
    try {
      const res = await fetch(`${BASE_URL}${path}`, {
        headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` },
        signal: AbortSignal.timeout(12_000),
        cache: 'no-store',
      })
      results.push({
        path,
        ok:     res.ok,
        status: res.status,
        ms:     Date.now() - inicio,
        ...(res.ok ? {} : { error: (await res.text().catch(() => '')).slice(0, 200) }),
      })
    } catch (e: any) {
      results.push({
        path,
        ok:     false,
        status: null,
        ms:     Date.now() - inicio,
        error:  e?.name === 'TimeoutError' ? 'timeout 12s' : (e?.message ?? 'error desconocido'),
      })
    }
  }

  const ran    = results.filter(r => r.ok).length
  const failed = results.filter(r => !r.ok).length

  console.log(
    `[cron daily] group=${group} ran=${ran} failed=${failed} :: ` +
    results.map(r => `${r.path}=${r.ok ? 'ok' : `FAIL(${r.status ?? r.error})`} ${r.ms}ms`).join(' | ')
  )

  return NextResponse.json({ group, ran, failed, results })
}
