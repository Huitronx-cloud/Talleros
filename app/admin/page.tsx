export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase/service'
import { Tarjeta, SerieDiaria, Embudo, type Punto } from '@/components/admin/panel-graficas'
import { buildWhatsAppLink } from '@/lib/whatsapp-link'

const DIAS = 30

/** Serie continua de DIAS días: los días sin filas quedan en cero, no ausentes. */
function porDia(fechas: string[], dias = DIAS): Punto[] {
  const cubo = new Map<string, number>()
  const hoy = new Date()
  for (let i = dias - 1; i >= 0; i--) {
    const d = new Date(hoy.getTime() - i * 86400000)
    cubo.set(d.toISOString().slice(0, 10), 0)
  }
  for (const f of fechas) {
    const clave = f.slice(0, 10)
    if (cubo.has(clave)) cubo.set(clave, (cubo.get(clave) ?? 0) + 1)
  }
  // Array.from y no [...cubo.entries()]: este tsconfig apunta por debajo de
  // es2015 y desestructurar un iterador de Map ahí es un error de tipos.
  return Array.from(cubo.entries()).map(([fecha, valor]) => ({ fecha, valor }))
}

function diasDesde(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
}

export default async function AdminPanelPage() {
  const supabase = createServiceClient()
  const desde = new Date(Date.now() - DIAS * 86400000).toISOString()

  const [talleresRes, suscripcionesRes, ordenesRealesRes, ordenesPeriodoRes,
         clientesRealesRes, leadsRes, articulosRes, prospectosRes, usuariosRes] = await Promise.all([
    supabase.from('talleres').select('id, nombre, ciudad, pais, telefono, created_at').order('created_at', { ascending: false }),
    supabase.from('suscripciones').select('taller_id, plan, estado, trial_fin, stripe_customer_id'),
    supabase.from('ordenes').select('taller_id').eq('es_ejemplo', false),
    supabase.from('ordenes').select('created_at').eq('es_ejemplo', false).gte('created_at', desde),
    supabase.from('clientes').select('*', { count: 'exact', head: true }).eq('es_ejemplo', false),
    supabase.from('crm_leads').select('etapa, created_at'),
    supabase.from('articulos_blog').select('*', { count: 'exact', head: true }).eq('publicado', true),
    supabase.from('prospectos_enviados').select('created_at').gte('created_at', desde),
    supabase.from('usuarios').select('taller_id'),
  ])

  const talleres      = talleresRes.data ?? []
  const suscripciones = suscripcionesRes.data ?? []
  const leads         = leadsRes.data ?? []

  // Activación: un taller cuenta cuando creó al menos una orden REAL. Las de
  // ejemplo se excluyen — nacen con la cuenta y marcarían a todos como activos.
  const activados = new Set((ordenesRealesRes.data ?? []).map(o => o.taller_id))

  const porTaller = new Map(suscripciones.map(s => [s.taller_id, s]))

  // Una suscripción sin ningún usuario detrás no es un cliente: son las filas
  // huérfanas de las pruebas viejas (Rodriguez, zasz, El Campeón). Contarlas
  // hacía que el panel dijera "Pagando 4" cuando el cliente real era uno, y ese
  // es justo el número que se mira con prisa para decidir algo.
  const conUsuarios = new Set((usuariosRes.data ?? []).map(u => u.taller_id))

  const pagandoTodas = suscripciones.filter(s => ['esencial', 'pro'].includes(s.plan) && s.estado === 'activa')
  const pagando      = pagandoTodas.filter(s => conUsuarios.has(s.taller_id))
  const huerfanas    = pagandoTodas.length - pagando.length

  const trials = suscripciones.filter(s => s.plan === 'trial' && s.estado === 'activa')

  const registros7  = talleres.filter(t => diasDesde(t.created_at) < 7).length
  const registros30 = talleres.filter(t => diasDesde(t.created_at) < 30).length

  // Trials que vencen pronto — es la lista de llamadas del correo del orquestador.
  //
  // El filtro es `<= en3dias`, así que arrastra también todos los que vencieron
  // hace semanas. Decir "80 vencen en ≤3 días" cuando 79 ya vencieron convierte
  // una lista de llamadas urgentes en ruido: hay que separarlos.
  const en3dias = Date.now() + 3 * 86400000
  const trialsCalientes = trials
    .filter(s => s.trial_fin && new Date(s.trial_fin).getTime() <= en3dias)
    .sort((a, b) => new Date(a.trial_fin!).getTime() - new Date(b.trial_fin!).getTime())
    .map(s => ({
      ...s,
      taller: talleres.find(t => t.id === s.taller_id),
      dias:   Math.ceil((new Date(s.trial_fin!).getTime() - Date.now()) / 86400000),
      activo: activados.has(s.taller_id),
    }))

  const porVencer  = trialsCalientes.filter(s => s.dias >= 0)
  const yaVencidos = trialsCalientes.length - porVencer.length

  // Riesgo: se registraron hace 2-14 días y siguen sin crear una orden real.
  const enRiesgo = talleres
    .filter(t => !activados.has(t.id) && diasDesde(t.created_at) >= 2 && diasDesde(t.created_at) <= 14)

  // ── Carritos abandonados ───────────────────────────────────────────────────
  //
  // No hace falta ni tabla nueva ni escuchar un evento de Stripe: el dato ya
  // está. `stripe_customer_id` se escribe en el instante en que alguien pulsa
  // pagar (api/stripe/checkout crea el cliente ANTES de abrir la pantalla de
  // pago), y si no completa, su plan se queda en trial o gratis.
  //
  //     tiene stripe_customer_id  +  sigue sin pagar  =  llegó y no terminó
  //
  // Son las personas más calientes que hay: no "se registraron y no
  // volvieron", sino que decidieron pagar y se cayeron en el último paso.
  //
  // El WhatsApp NO se envía solo, y no es un descuido: WhatsApp no entrega
  // mensajes automáticos a quien no te escribió antes — es lo que dejó seco el
  // presupuesto de Twilio con la prospección. El link wa.me abre el chat con el
  // texto puesto y el envío lo hace una persona, igual que los mensajes que los
  // talleres mandan a sus propios clientes.
  //
  // Un caso que conviene tener presente: quien pagó y luego canceló vuelve a
  // `trial` conservando su `stripe_customer_id`, así que también aparece aquí.
  // Hoy no hay ninguna cancelación y además es gente a la que igualmente se le
  // quiere escribir, pero si algún día la lista crece sin explicación, es por
  // esto — se separan mirando `estado = 'cancelada'`.
  const carritos = suscripciones
    .filter(s => s.stripe_customer_id && !['esencial', 'pro'].includes(s.plan))
    .map(s => {
      const taller = talleres.find(t => t.id === s.taller_id)
      return { suscripcion: s, taller }
    })
    // Sin taller detrás son las filas huérfanas de las pruebas viejas, las
    // mismas que inflaban el "Pagando 4". No son nadie a quien escribir.
    .filter(c => c.taller)
    .sort((a, b) => new Date(b.taller!.created_at).getTime() - new Date(a.taller!.created_at).getTime())
    .map(({ suscripcion, taller }) => {
      const primerNombre = (taller!.nombre ?? '').trim().split(' ')[0]
      const mensaje =
        `Hola, soy Iván de TallerOS. Vi que entraste a activar tu plan en ${taller!.nombre} y no llegaste a terminar.\n\n` +
        `¿Hubo algo que te frenó? Te lo pregunto en serio: si fue el precio, la moneda del cobro o algo de esa pantalla, ` +
        `quiero saberlo para arreglarlo.\n\n` +
        `Y si lo que necesitas es más tiempo para probarlo con calma, te amplío los días sin problema. Nada más dime.`
      return {
        tallerId: taller!.id,
        nombre:   taller!.nombre,
        ciudad:   taller!.ciudad,
        telefono: taller!.telefono,
        dias:     diasDesde(taller!.created_at),
        activo:   activados.has(taller!.id),
        // Sin teléfono no hay WhatsApp posible: se enseña igual, pero marcado,
        // para que se note que a ese hay que escribirle por correo.
        wa: taller!.telefono
          ? buildWhatsAppLink(taller!.telefono, mensaje, taller!.pais)
          : null,
      }
    })

  const etapas = ['nuevo', 'contactado', 'interesado', 'negociacion', 'cliente', 'descartado'] as const
  const pctActivacion = talleres.length ? (activados.size / talleres.length) * 100 : 0

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-white">Panel</h1>
          <p className="text-gray-500 text-sm mt-1">
            Cómo va TallerOS. Todo sale de la base de datos en vivo, ningún número está escrito a mano.
          </p>
        </div>
        <Link href="/admin/leads" className="text-sm text-blue-400 hover:text-blue-300 font-medium">
          Ir a Leads →
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Tarjeta etiqueta="Talleres registrados" valor={talleres.length} pie={`${registros7} en los últimos 7 días`} />
        <Tarjeta etiqueta="Pagando" valor={pagando.length} tono={pagando.length > 0 ? 'bueno' : 'alerta'}
                 pie={[
                   talleres.length ? `${((pagando.length / talleres.length) * 100).toFixed(1)}% de los registros` : '',
                   huerfanas ? `${huerfanas} ${huerfanas === 1 ? 'suscripción sin usuarios, no contada' : 'suscripciones sin usuarios, no contadas'}` : '',
                 ].filter(Boolean).join(' · ')} />
        <Tarjeta etiqueta="Trials activos" valor={trials.length} tono="acento"
                 pie={
                   porVencer.length
                     ? `${porVencer.length} ${porVencer.length === 1 ? 'vence' : 'vencen'} en ≤3 días${yaVencidos ? ` · ${yaVencidos} ya vencidos` : ''}`
                     : yaVencidos
                     ? `${yaVencidos} ya vencidos, ninguno por vencer`
                     : 'ninguno vence pronto'
                 } />
        <Tarjeta etiqueta="Activados" valor={activados.size} tono={pctActivacion >= 50 ? 'bueno' : 'alerta'}
                 pie={`${pctActivacion.toFixed(0)}% creó una orden real`} />
      </div>

      {carritos.length > 0 && (
        <div className="bg-gray-900 border border-amber-500/30 rounded-xl p-4">
          <div className="flex items-start justify-between gap-4 flex-wrap mb-1">
            <h3 className="text-sm font-semibold text-white">
              Carritos abandonados
              <span className="ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 align-middle">
                {carritos.length}
              </span>
            </h3>
          </div>
          <p className="text-xs text-gray-500 mb-3">
            Pulsaron pagar y no completaron. Es la gente más caliente que hay: ya
            decidió, se cayó en el último paso. El mensaje va escrito — se abre tu
            WhatsApp con el texto puesto y lo mandas tú.
          </p>
          <div className="space-y-2">
            {carritos.map(c => (
              <div
                key={c.tallerId}
                className="flex items-center justify-between gap-3 bg-gray-950/60 border border-gray-800 rounded-lg px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="text-sm text-white font-medium truncate">{c.nombre}</p>
                  <p className="text-xs text-gray-500">
                    hace {c.dias} d
                    {c.ciudad ? ` · ${c.ciudad}` : ''}
                    {c.activo ? ' · usó el producto' : ' · sin actividad'}
                  </p>
                </div>
                {c.wa ? (
                  <a
                    href={c.wa}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0 text-[11px] font-bold px-3 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 transition-colors"
                  >
                    WhatsApp
                  </a>
                ) : (
                  <span className="flex-shrink-0 text-[10px] font-bold px-2 py-1 rounded-full bg-gray-700/40 text-gray-500">
                    SIN TELÉFONO
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-4">
        <Embudo
          titulo="De registro a cliente"
          pasos={[
            { etiqueta: 'Se registraron',        valor: talleres.length },
            { etiqueta: 'Crearon una orden real', valor: activados.size, detalle: 'excluye las órdenes de ejemplo' },
            { etiqueta: 'Están pagando',          valor: pagando.length, detalle: 'solo suscripciones con un usuario detrás' },
          ]}
          pie="Cada paso se mide contra el total de registros, no contra el paso anterior."
        />
        <SerieDiaria
          titulo="Registros por día"
          datos={porDia(talleres.map(t => t.created_at))}
          pie={`${registros30} talleres nuevos en los últimos ${DIAS} días.`}
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <SerieDiaria
          titulo="Órdenes reales por día"
          datos={porDia((ordenesPeriodoRes.data ?? []).map(o => o.created_at))}
          color="#10b981"
          pie="Sin las órdenes de ejemplo que se crean al darse de alta."
        />
        <SerieDiaria
          titulo="Prospección enviada por día"
          datos={porDia((prospectosRes.data ?? []).map(p => p.created_at))}
          color="#a855f7"
          pie="Mensajes de prospección saliente."
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-white mb-3">Leads en el CRM</h3>
          <div className="space-y-2">
            {etapas.map(e => {
              const n = leads.filter(l => l.etapa === e).length
              const pct = leads.length ? (n / leads.length) * 100 : 0
              return (
                <div key={e} className="flex items-center gap-3">
                  <span className="text-xs text-gray-400 w-24 capitalize flex-shrink-0">{e}</span>
                  <div className="flex-1 h-2 rounded-full bg-gray-800 overflow-hidden">
                    <div className="h-full bg-blue-500/70 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs text-white tabular-nums w-8 text-right">{n}</span>
                </div>
              )
            })}
          </div>
          <p className="text-xs text-gray-500 mt-3">{leads.length} leads en total.</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 lg:col-span-2">
          <h3 className="text-sm font-semibold text-white mb-1">Llamadas de hoy</h3>
          <p className="text-xs text-gray-500 mb-3">Trials que vencen en tres días o menos.</p>
          {trialsCalientes.length === 0 ? (
            <p className="text-sm text-gray-500 py-6 text-center">Ningún trial vence pronto.</p>
          ) : (
            <div className="space-y-2">
              {trialsCalientes.map(t => (
                <div key={t.taller_id} className="flex items-center justify-between gap-3 bg-gray-950/60 border border-gray-800 rounded-lg px-3 py-2">
                  <div className="min-w-0">
                    <p className="text-sm text-white font-medium truncate">{t.taller?.nombre ?? 'Taller sin nombre'}</p>
                    <p className="text-xs text-gray-500">
                      {t.dias <= 0 ? 'vence hoy' : `vence en ${t.dias} día${t.dias === 1 ? '' : 's'}`}
                      {t.taller?.ciudad ? ` · ${t.taller.ciudad}` : ''}
                    </p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full flex-shrink-0 ${
                    t.activo ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'
                  }`}>
                    {t.activo ? 'ACTIVO' : 'SIN ACTIVIDAD'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-white mb-1">Se están enfriando</h3>
          <p className="text-xs text-gray-500 mb-3">
            Registrados hace entre 2 y 14 días y todavía sin una orden real.
          </p>
          {enRiesgo.length === 0 ? (
            <p className="text-sm text-gray-500 py-6 text-center">Ninguno. Todos los registros recientes activaron.</p>
          ) : (
            <div className="space-y-1.5 max-h-72 overflow-y-auto">
              {enRiesgo.map(t => (
                <div key={t.id} className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-gray-950/60 border border-gray-800">
                  <span className="text-sm text-white truncate">{t.nombre}</span>
                  <span className="text-xs text-gray-500 flex-shrink-0">hace {diasDesde(t.created_at)} d</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-white mb-1">Últimos registros</h3>
          <p className="text-xs text-gray-500 mb-3">Los diez talleres más recientes.</p>
          <div className="space-y-1.5">
            {talleres.slice(0, 10).map(t => {
              const s = porTaller.get(t.id)
              return (
                <div key={t.id} className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-gray-950/60 border border-gray-800">
                  <div className="min-w-0">
                    <p className="text-sm text-white truncate">{t.nombre}</p>
                    <p className="text-xs text-gray-500">
                      hace {diasDesde(t.created_at)} d{t.ciudad ? ` · ${t.ciudad}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {activados.has(t.id) && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400">ACTIVO</span>
                    )}
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-800 text-gray-400 uppercase">
                      {s?.plan ?? 'sin plan'}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Tarjeta etiqueta="Clientes reales" valor={clientesRealesRes.count ?? 0} pie="Sin los de ejemplo." />
        <Tarjeta etiqueta="Órdenes reales" valor={activados.size > 0 ? (ordenesRealesRes.data ?? []).length : 0} pie="Histórico completo." />
        <Tarjeta etiqueta="Artículos publicados" valor={articulosRes.count ?? 0} pie="En el blog." />
        <Tarjeta etiqueta="Leads en el CRM" valor={leads.length} pie="Prospección y WhatsApp." />
      </div>
    </div>
  )
}
