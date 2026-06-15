'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Bell, MessageCircle, Mail, Clock, Send, ChevronRight, Lock } from 'lucide-react'
import { RecordatorioConfig, RecordatorioEnviado } from '@/types/recordatorios'

const MENSAJE_WA_DEFAULT = `¡Hola {{nombre}}! 👋 En *{{taller}}* queremos recordarte que ya pasaron {{meses}} meses desde tu última visita. Tu {{vehiculo}} podría necesitar mantenimiento. ¿Agendamos una cita? Responde este mensaje o llámanos. 🔧`

const ASUNTO_EMAIL_DEFAULT = `Tu {{vehiculo}} necesita mantenimiento - {{taller}}`

const CUERPO_EMAIL_DEFAULT = `Hola {{nombre}},

Han pasado {{meses}} meses desde tu última visita a {{taller}} y queremos asegurarnos de que tu {{vehiculo}} esté en perfectas condiciones.

El mantenimiento preventivo regular puede ahorrarte costos mayores y mantener tu vehículo seguro y eficiente.

¿Te gustaría agendar una cita? Estamos listos para atenderte.

Saludos,
El equipo de {{taller}}`

export default function RecordatoriosPage() {
  const supabase = createClient()
  const [config, setConfig] = useState<Partial<RecordatorioConfig>>({
    activo: true,
    meses_intervalo: 6,
    canal: 'whatsapp',
    mensaje_whatsapp: MENSAJE_WA_DEFAULT,
    mensaje_email_asunto: ASUNTO_EMAIL_DEFAULT,
    mensaje_email_cuerpo: CUERPO_EMAIL_DEFAULT,
  })
  const [historial, setHistorial] = useState<RecordatorioEnviado[]>([])
  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [plan, setPlan] = useState<string>('')
  const [tallerId, setTallerId] = useState<string>('')
  const [guardado, setGuardado] = useState(false)
  const [stats, setStats] = useState({ total: 0, enviados: 0, fallidos: 0 })

  useEffect(() => {
    cargarDatos()
  }, [])

  async function cargarDatos() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: usuario } = await supabase
      .from('usuarios')
      .select('taller_id')
      .eq('id', user.id)
      .single()

    if (!usuario) return

    const tid = usuario.taller_id
    setTallerId(tid)

    // Obtener plan desde suscripciones, igual que el dashboard
    const { data: suscripcion } = await supabase
      .from('suscripciones')
      .select('plan')
      .eq('taller_id', tid)
      .single()

    setPlan(suscripcion?.plan ?? 'trial')

    const { data: cfg } = await supabase
      .from('recordatorios_config')
      .select('*')
      .eq('taller_id', tid)
      .single()

    if (cfg) setConfig(cfg)

    const { data: hist } = await supabase
      .from('recordatorios_enviados')
      .select('*, clientes (nombre, telefono, email)')
      .eq('taller_id', tid)
      .order('fecha_envio', { ascending: false })
      .limit(50)

    if (hist) {
      setHistorial(hist)
      setStats({
        total: hist.length,
        enviados: hist.filter((h: RecordatorioEnviado) => h.estado === 'enviado').length,
        fallidos: hist.filter((h: RecordatorioEnviado) => h.estado === 'fallido').length,
      })
    }

    setLoading(false)
  }

  async function guardarConfig() {
    if (!tallerId) return
    setGuardando(true)

    const payload = {
      taller_id: tallerId,
      activo: config.activo,
      meses_intervalo: config.meses_intervalo,
      canal: config.canal,
      mensaje_whatsapp: config.mensaje_whatsapp,
      mensaje_email_asunto: config.mensaje_email_asunto,
      mensaje_email_cuerpo: config.mensaje_email_cuerpo,
      updated_at: new Date().toISOString(),
    }

    const { error } = await supabase
      .from('recordatorios_config')
      .upsert(payload, { onConflict: 'taller_id' })

    if (!error) {
      setGuardado(true)
      setTimeout(() => setGuardado(false), 3000)
    }
    setGuardando(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500" />
      </div>
    )
  }

  if (plan !== 'pro' && plan !== 'trial' && plan !== 'esencial' && plan !== '') {
    return (
      <div className="max-w-2xl mx-auto mt-16 text-center px-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10">
          <div className="w-16 h-16 bg-sky-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-sky-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Feature Pro</h2>
          <p className="text-slate-400 mb-6">
            Los recordatorios automáticos de mantenimiento están disponibles en el plan Pro.
            Recupera clientes inactivos automáticamente cada 3 a 6 meses.
          </p>
          <a
          
            href="/configuracion/plan"
            className="inline-flex items-center gap-2 bg-sky-500 hover:bg-sky-400 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            Upgrade a Pro <ChevronRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    )
  }

  const PREVIEW_DATOS = {
    nombre: 'Carlos',
    vehiculo: 'Toyota Corolla',
    taller: 'Tu Taller',
    meses: '6',
  }

  function generarVistaPreviaWA(plantilla: string) {
    return plantilla
      .replace(/\{\{nombre\}\}/g, PREVIEW_DATOS.nombre)
      .replace(/\{\{vehiculo\}\}/g, PREVIEW_DATOS.vehiculo)
      .replace(/\{\{taller\}\}/g, PREVIEW_DATOS.taller)
      .replace(/\{\{meses\}\}/g, PREVIEW_DATOS.meses)
  }

  const bloqueVariables = (
    <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 space-y-1">
      <p className="text-xs font-semibold text-blue-800">Puedes usar estas palabras clave en el mensaje — TallerOS las reemplaza automáticamente:</p>
      <ul className="text-xs text-blue-700 space-y-0.5">
        <li><code className="bg-blue-100 px-1 rounded font-mono">{'{{nombre}}'}</code> = nombre del cliente</li>
        <li><code className="bg-blue-100 px-1 rounded font-mono">{'{{vehiculo}}'}</code> = marca y modelo del auto</li>
        <li><code className="bg-blue-100 px-1 rounded font-mono">{'{{taller}}'}</code> = nombre de tu taller</li>
        <li><code className="bg-blue-100 px-1 rounded font-mono">{'{{meses}}'}</code> = meses desde la última visita</li>
      </ul>
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Bell className="w-6 h-6 text-sky-500" />
            Recordatorios de Mantenimiento
          </h1>
          <p className="text-gray-500 mt-1">
            Contacta automáticamente a clientes que no han visitado el taller en 3 a 6 meses.
          </p>
        </div>
        <span className="bg-sky-500/10 text-sky-600 text-xs font-semibold px-3 py-1 rounded-full border border-sky-500/20">
          PRO
        </span>
      </div>

      {/* Bloque explicativo */}
      <div className="bg-sky-50 border border-sky-200 rounded-2xl p-5 flex gap-4">
        <div className="shrink-0 w-10 h-10 bg-sky-100 rounded-xl flex items-center justify-center">
          <Bell className="w-5 h-5 text-sky-600" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-sky-900">¿Cómo funciona?</p>
          <p className="text-sm text-sky-800 leading-relaxed">
            TallerOS revisa cada día si algún cliente no ha visitado el taller en el tiempo que tú configures (3, 4, 5 o 6 meses). Cuando detecta uno, le manda automáticamente un mensaje por WhatsApp o email recordándole que su vehículo podría necesitar mantenimiento.
          </p>
          <p className="text-sm text-sky-800 leading-relaxed">
            Tú solo activas el switch, eliges el intervalo y personalizas el mensaje una vez. A partir de ahí, <strong>TallerOS trabaja solo</strong> — sin que tengas que hacer nada más.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total enviados', value: stats.total, color: 'text-white' },
          { label: 'Exitosos', value: stats.enviados, color: 'text-green-400' },
          { label: 'Fallidos', value: stats.fallidos, color: 'text-red-400' },
        ].map(stat => (
          <div key={stat.label} className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <p className="text-slate-500 text-sm">{stat.label}</p>
            <p className={`text-3xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
        <h2 className="text-lg font-semibold text-white">Configuración</h2>

        <div className="flex items-center justify-between py-3 border-b border-slate-800">
          <div>
            <p className="text-white font-medium">Recordatorios activos</p>
            <p className="text-slate-500 text-sm">Se ejecutan automáticamente cada día</p>
          </div>
          <button
            onClick={() => setConfig(c => ({ ...c, activo: !c.activo }))}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              config.activo ? 'bg-sky-500' : 'bg-slate-700'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                config.activo ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-500" /> Intervalo de recordatorio
          </label>
          <div className="flex gap-3">
            {[3, 4, 5, 6].map(m => (
              <button
                key={m}
                onClick={() => setConfig(c => ({ ...c, meses_intervalo: m as any }))}
                className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  config.meses_intervalo === m
                    ? 'bg-sky-500 border-sky-500 text-white'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                }`}
              >
                {m} meses
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300">Canal de envío</label>
          <div className="flex gap-3">
            {[
              { value: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
              { value: 'email', label: 'Email', icon: Mail },
              { value: 'ambos', label: 'Ambos', icon: Send },
            ].map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setConfig(c => ({ ...c, canal: value as any }))}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  config.canal === value
                    ? 'bg-sky-500 border-sky-500 text-white'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                }`}
              >
                <Icon className="w-4 h-4" /> {label}
              </button>
            ))}
          </div>
        </div>

        {(config.canal === 'whatsapp' || config.canal === 'ambos') && (
          <div className="space-y-3">
            <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-green-500" /> Mensaje de WhatsApp
            </label>
            {bloqueVariables}
            <textarea
              value={config.mensaje_whatsapp || ''}
              onChange={e => setConfig(c => ({ ...c, mensaje_whatsapp: e.target.value }))}
              rows={4}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 text-sm focus:outline-none focus:border-sky-500 resize-none"
            />
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-400">Vista previa — así verá el mensaje el cliente:</p>
              <div className="flex justify-end">
                <div className="bg-[#dcf8c6] text-gray-800 text-sm rounded-2xl rounded-tr-sm px-4 py-3 max-w-xs shadow-sm whitespace-pre-wrap leading-relaxed">
                  {generarVistaPreviaWA(config.mensaje_whatsapp || '')}
                </div>
              </div>
              <p className="text-xs text-slate-600 text-right">Datos de ejemplo: Carlos · Toyota Corolla · 6 meses</p>
            </div>
          </div>
        )}

        {(config.canal === 'email' || config.canal === 'ambos') && (
          <div className="space-y-4">
            {bloqueVariables}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <Mail className="w-4 h-4 text-sky-400" /> Asunto del email
              </label>
              <input
                type="text"
                value={config.mensaje_email_asunto || ''}
                onChange={e => setConfig(c => ({ ...c, mensaje_email_asunto: e.target.value }))}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 text-sm focus:outline-none focus:border-sky-500"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Cuerpo del email</label>
              <textarea
                value={config.mensaje_email_cuerpo || ''}
                onChange={e => setConfig(c => ({ ...c, mensaje_email_cuerpo: e.target.value }))}
                rows={6}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 text-sm focus:outline-none focus:border-sky-500 resize-none"
              />
            </div>
          </div>
        )}

        <button
          onClick={guardarConfig}
          disabled={guardando}
          className="w-full bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          {guardando ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
          ) : guardado ? (
            '✓ Guardado'
          ) : (
            'Guardar configuración'
          )}
        </button>
      </div>

      {historial.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Historial reciente</h2>
          <div className="space-y-3">
            {historial.slice(0, 20).map(r => {
              const cliente = r.clientes as any
              return (
                <div
                  key={r.id}
                  className="flex items-center justify-between py-3 border-b border-slate-800 last:border-0"
                >
                  <div>
                    <p className="text-white text-sm font-medium">
                      {cliente?.nombre || 'Cliente'}
                    </p>
                    <p className="text-slate-500 text-xs">
                      {r.canal} · {new Date(r.fecha_envio).toLocaleDateString('es-MX')}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded-full ${
                      r.estado === 'enviado'
                        ? 'bg-green-500/10 text-green-400'
                        : r.estado === 'fallido'
                        ? 'bg-red-500/10 text-red-400'
                        : 'bg-sky-500/10 text-sky-400'
                    }`}
                  >
                    {r.estado}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}