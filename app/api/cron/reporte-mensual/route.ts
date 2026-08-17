import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const maxDuration = 60
import { createClient } from '@supabase/supabase-js'

// Reporte mensual a los talleres: sus propios números del mes que acaba de
// cerrar. No es marketing, son sus datos — por eso convence.
//
// Va a TODOS los talleres con actividad real, no solo a los que pagan. Para
// quien paga es refuerzo de su decisión; para quien está en el plan gratis es
// el argumento de venta más honesto que hay, porque son sus propias cifras.
//
// El piso existe para no hacerse daño: un reporte que dice "2 órdenes, $8.000"
// le está gritando al dueño que el producto no le sirve. Mejor no mandarlo.
const MINIMO_ORDENES_ENTREGADAS = 3

const MONEDA: Record<string, string> = {
  'México':   'MXN',
  'Colombia': 'COP',
  'Perú':     'PEN',
}

function dinero(valor: number, pais: string | null): string {
  const moneda = MONEDA[pais ?? 'México'] ?? 'MXN'
  return new Intl.NumberFormat('es-MX', {
    style: 'currency', currency: moneda, maximumFractionDigits: 0,
  }).format(valor)
}

/** Primer y último día del mes anterior, en fechas ISO (la columna es `date`). */
function mesPasado(): { desde: string; hasta: string; etiqueta: string; desdeAnterior: string } {
  const hoy    = new Date()
  const inicio = new Date(Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth() - 1, 1))
  const fin    = new Date(Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth(), 1))
  const previo = new Date(Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth() - 2, 1))
  return {
    desde:         inicio.toISOString().slice(0, 10),
    hasta:         fin.toISOString().slice(0, 10),
    desdeAnterior: previo.toISOString().slice(0, 10),
    // Solo la primera letra: text-transform:capitalize pondría también "De".
    etiqueta:      (m => m.charAt(0).toUpperCase() + m.slice(1))(
                     inicio.toLocaleDateString('es-MX', { month: 'long', year: 'numeric', timeZone: 'UTC' })),
  }
}

function variacion(actual: number, previo: number): string {
  if (previo <= 0) return ''
  const pct = Math.round(((actual - previo) / previo) * 100)
  if (pct === 0) return '<span style="color:#64748b;">igual que el mes pasado</span>'
  const arriba = pct > 0
  return `<span style="color:${arriba ? '#059669' : '#dc2626'};font-weight:700;">${arriba ? '▲' : '▼'} ${Math.abs(pct)}%</span> <span style="color:#64748b;">vs. el mes pasado</span>`
}

type Resumen = {
  facturado: number
  entregadas: number
  nuevas: number
  clientesNuevos: number
  ticket: number
  sinImporte: number
  facturadoPrevio: number
}

function emailReporte(nombre: string, taller: string, pais: string | null, mes: string, r: Resumen): string {
  const tarjeta = (etiqueta: string, valor: string, pie = '') => `
    <td style="padding:0 6px;" width="50%">
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:16px;">
        <p style="margin:0 0 4px;color:#64748b;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;">${etiqueta}</p>
        <p style="margin:0;color:#0f172a;font-size:24px;font-weight:800;">${valor}</p>
        ${pie ? `<p style="margin:4px 0 0;font-size:12px;">${pie}</p>` : ''}
      </div>
    </td>`

  // El aviso de las órdenes sin importe convierte un hueco de datos en algo
  // accionable: explica por qué la cifra podría parecerle baja, le da una tarea
  // concreta, y de paso mejora el dato del mes que viene.
  const avisoSinImporte = r.sinImporte > 0 ? `
      <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:14px 18px;margin-top:20px;">
        <p style="margin:0;color:#92400e;font-size:14px;line-height:1.6;">
          Entregaste <strong>${r.sinImporte} ${r.sinImporte === 1 ? 'orden' : 'órdenes'} sin importe capturado</strong>, así que no ${r.sinImporte === 1 ? 'está contada' : 'están contadas'} aquí arriba. Si las capturas, el reporte del próximo mes va a reflejar lo que de verdad entró.
        </p>
      </div>` : ''

  return `
  <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(135deg,#1e3a5f,#1d4ed8);padding:28px 32px;">
      <p style="margin:0 0 6px;color:#93c5fd;font-size:12px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;">Tu mes en TallerOS</p>
      <p style="margin:0;color:#fff;font-size:22px;font-weight:800;">${mes}</p>
    </div>
    <div style="padding:32px;">
      <p style="color:#334155;font-size:15px;line-height:1.7;margin:0 0 24px;">
        Hola ${nombre}, esto es lo que pasó en <strong>${taller}</strong> el mes pasado.
      </p>

      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate;border-spacing:0 12px;">
        <tr>
          ${tarjeta('Facturado', dinero(r.facturado, pais), variacion(r.facturado, r.facturadoPrevio))}
          ${tarjeta('Órdenes entregadas', String(r.entregadas))}
        </tr>
        <tr>
          ${tarjeta('Ticket promedio', dinero(r.ticket, pais))}
          ${tarjeta('Clientes nuevos', String(r.clientesNuevos))}
        </tr>
      </table>

      ${avisoSinImporte}

      <p style="color:#334155;font-size:15px;line-height:1.7;margin:24px 0 20px;">
        Todo esto quedó registrado sin que tuvieras que llevar la cuenta a mano. El historial de cada vehículo, cuánto se cobró y quién lo atendió está ahí cuando lo necesites.
      </p>

      <a href="https://www.tallerosapp.com/reportes" style="display:inline-block;background:#2563eb;color:#fff;padding:13px 28px;border-radius:10px;text-decoration:none;font-size:15px;font-weight:700;">
        Ver el detalle en TallerOS →
      </a>

      <p style="color:#64748b;font-size:13px;margin-top:24px;line-height:1.6;">
        ¿Un número no cuadra? Responde este correo y lo revisamos juntos.
      </p>
    </div>
  </div>`
}

async function enviarEmail(to: string, nombre: string, subject: string, html: string): Promise<boolean> {
  try {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': process.env.BREVO_API_KEY!, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sender: { name: 'TallerOS', email: 'hola@tallerosapp.com' },
        to: [{ email: to, name: nombre }],
        subject,
        htmlContent: html,
      }),
    })
    return res.ok
  } catch (e) {
    console.error('[reporte-mensual] email error:', e)
    return false
  }
}

export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ?prueba=1 manda TODO a hola@ en vez de a los talleres. Es la única forma
  // sensata de estrenar esto: el primer destinatario no puede ser el único
  // cliente de pago.
  const soloPrueba = req.nextUrl.searchParams.get('prueba') === '1'

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { desde, hasta, desdeAnterior, etiqueta } = mesPasado()

  // Tres consultas en bloque en vez de tres por taller: con 73 talleres eso
  // serían más de 200 viajes en una función de 60 segundos.
  const [entregadasRes, nuevasRes, clientesRes] = await Promise.all([
    supabase.from('ordenes')
      .select('taller_id, total, fecha_entrega')
      .eq('es_ejemplo', false).eq('estado', 'entregado')
      .gte('fecha_entrega', desdeAnterior).lt('fecha_entrega', hasta),
    supabase.from('ordenes')
      .select('taller_id')
      .eq('es_ejemplo', false)
      .gte('created_at', desde).lt('created_at', hasta),
    supabase.from('clientes')
      .select('taller_id')
      .eq('es_ejemplo', false)
      .gte('created_at', desde).lt('created_at', hasta),
  ])

  const porTaller = new Map<string, Resumen>()
  const vacio = (): Resumen => ({
    facturado: 0, entregadas: 0, nuevas: 0, clientesNuevos: 0,
    ticket: 0, sinImporte: 0, facturadoPrevio: 0,
  })
  const de = (id: string) => {
    if (!porTaller.has(id)) porTaller.set(id, vacio())
    return porTaller.get(id)!
  }

  for (const o of entregadasRes.data ?? []) {
    const r = de(o.taller_id)
    const total = Number(o.total ?? 0)
    // La consulta trae dos meses de una vez; aquí se separan.
    if (o.fecha_entrega >= desde) {
      r.entregadas++
      r.facturado += total
      if (total <= 0) r.sinImporte++
    } else {
      r.facturadoPrevio += total
    }
  }
  for (const o of nuevasRes.data  ?? []) de(o.taller_id).nuevas++
  for (const c of clientesRes.data ?? []) de(c.taller_id).clientesNuevos++

  const elegibles = Array.from(porTaller.entries())
    .filter(([, r]) => r.entregadas >= MINIMO_ORDENES_ENTREGADAS)

  if (elegibles.length === 0) {
    return NextResponse.json({ ok: true, mes: etiqueta, enviados: 0, mensaje: 'Ningún taller supera el piso de actividad.' })
  }

  const { data: talleres } = await supabase
    .from('talleres')
    .select('id, nombre, pais, usuarios!inner(nombre, email, rol)')
    .in('id', elegibles.map(([id]) => id))

  const resultados: any[] = []

  for (const [tallerId, r] of elegibles) {
    const taller = (talleres ?? []).find((t: any) => t.id === tallerId) as any
    if (!taller) continue
    const propietario = (taller.usuarios as any[]).find(u => u.rol === 'propietario')
    if (!propietario?.email) continue

    const conImporte = r.entregadas - r.sinImporte
    r.ticket = conImporte > 0 ? Math.round(r.facturado / conImporte) : 0

    const nombre = propietario.nombre?.split(' ')[0] ?? 'Hola'
    const ok = await enviarEmail(
      soloPrueba ? 'hola@tallerosapp.com' : propietario.email,
      nombre,
      `${taller.nombre}: tu mes en TallerOS`,
      emailReporte(nombre, taller.nombre, taller.pais, etiqueta, r)
    )
    resultados.push({ taller: taller.nombre, entregadas: r.entregadas, facturado: r.facturado, ok })
  }

  return NextResponse.json({
    ok: true,
    mes: etiqueta,
    prueba: soloPrueba,
    enviados: resultados.filter(x => x.ok).length,
    resultados,
  })
}
