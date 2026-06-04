'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Tag, MessageCircle, Mail, Send, ChevronRight, Lock,
  Users, CheckSquare, Square, Eye, Loader2, CheckCircle2, AlertCircle,
  Megaphone, Percent, DollarSign, Sparkles,
} from 'lucide-react'

// ── Pretextos de marketing ────────────────────────────────────────────────────
const PRETEXTOS = [
  { id: 'dia_madres',  emoji: '💐', label: 'Día de las Madres',   descuento_sugerido: '20%' },
  { id: 'navidad',     emoji: '🎄', label: 'Navidad',             descuento_sugerido: '15%' },
  { id: 'año_nuevo',   emoji: '🎉', label: 'Año Nuevo',           descuento_sugerido: '10%' },
  { id: 'vacaciones',  emoji: '☀️', label: 'Vacaciones de verano', descuento_sugerido: '15%' },
  { id: 'regreso',     emoji: '📚', label: 'Regreso a clases',    descuento_sugerido: '10%' },
  { id: 'semana_santa',emoji: '✝️', label: 'Semana Santa',        descuento_sugerido: '15%' },
  { id: 'black_friday',emoji: '🖤', label: 'Black Friday',        descuento_sugerido: '25%' },
  { id: 'aniversario', emoji: '🥳', label: 'Aniversario del taller', descuento_sugerido: '20%' },
  { id: 'temporada',   emoji: '🔧', label: 'Cambio de temporada', descuento_sugerido: '10%' },
  { id: 'personalizado', emoji: '✨', label: 'Personalizado',     descuento_sugerido: '' },
]

function generarMensaje({
  nombreTaller,
  motivo,
  descripcion,
  tipoDescuento,
  valorDescuento,
  nombreCliente,
}: {
  nombreTaller: string
  motivo: typeof PRETEXTOS[0] | null
  descripcion: string
  tipoDescuento: 'porcentaje' | 'monto'
  valorDescuento: string
  nombreCliente: string
}) {
  const descStr = valorDescuento
    ? tipoDescuento === 'porcentaje'
      ? `${valorDescuento}% de descuento`
      : `$${valorDescuento} de descuento`
    : 'una promoción especial'

  const ocasion = motivo && motivo.id !== 'personalizado'
    ? ` por ${motivo.label}`
    : ''

  return `¡Hola ${nombreCliente}! 👋 En *${nombreTaller}* queremos consentirte${ocasion}. ${
    descripcion ? `${descripcion} ` : ''
  }🎁 Tenemos *${descStr}* especialmente para ti. ¡Agenda tu cita hoy y aprovecha! Responde este mensaje para reservar. 🔧`
}

interface Cliente {
  id: string
  nombre: string
  telefono: string | null
  email: string | null
  vehiculo_marca: string | null
  vehiculo_modelo: string | null
}

type Canal = 'whatsapp' | 'email' | 'ambos'

export default function PromocionesPage() {
  const supabase = createClient()

  const [plan, setPlan] = useState('')
  const [tallerId, setTallerId] = useState('')
  const [nombreTaller, setNombreTaller] = useState('')
  const [loading, setLoading] = useState(true)

  // Formulario
  const [motivoSel, setPretextoSel] = useState<typeof PRETEXTOS[0] | null>(null)
  const [descripcion, setDescripcion] = useState('')
  const [tipoDescuento, setTipoDescuento] = useState<'porcentaje' | 'monto'>('porcentaje')
  const [valorDescuento, setValorDescuento] = useState('')
  const [canal, setCanal] = useState<Canal>('whatsapp')

  // Clientes
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set())
  const [busqueda, setBusqueda] = useState('')

  // Preview y envío
  const [mostrarPreview, setMostrarPreview] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [resultado, setResultado] = useState<{ enviados: number; fallidos: number } | null>(null)

  useEffect(() => { cargarDatos() }, [])

  async function cargarDatos() {
    const user = await getAuthUser()
    if (!user) return

    const { data: usuario } = await supabase
      .from('usuarios').select('taller_id').eq('id', user.id).single()
    if (!usuario) return

    const tid = usuario.taller_id
    setTallerId(tid)

    const [{ data: suscripcion }, { data: taller }, { data: clientesData }] = await Promise.all([
      supabase.from('suscripciones').select('plan').eq('taller_id', tid).single(),
      supabase.from('talleres').select('nombre').eq('id', tid).single(),
      supabase.from('clientes').select('id, nombre, telefono, email, vehiculo_marca, vehiculo_modelo')
        .eq('taller_id', tid).order('nombre'),
    ])

    setPlan(suscripcion?.plan ?? 'trial')
    setNombreTaller(taller?.nombre ?? '')
    setClientes(clientesData ?? [])
    setLoading(false)
  }

  const toggleCliente = (id: string) => {
    setSeleccionados(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleTodos = () => {
    if (seleccionados.size === clientesFiltrados.length) {
      setSeleccionados(new Set())
    } else {
      setSeleccionados(new Set(clientesFiltrados.map(c => c.id)))
    }
  }

  const clientesFiltrados = clientes.filter(c =>
    c.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    (c.telefono ?? '').includes(busqueda)
  )

  const clientesSeleccionados = clientes.filter(c => seleccionados.has(c.id))

  const mensajePreview = generarMensaje({
    nombreTaller,
    motivo: motivoSel,
    descripcion,
    tipoDescuento,
    valorDescuento,
    nombreCliente: clientesSeleccionados[0]?.nombre?.split(' ')[0] ?? 'Cliente',
  })

  async function enviarPromociones() {
    if (!tallerId || seleccionados.size === 0) return
    setEnviando(true)
    setResultado(null)

    try {
      const res = await fetch('/api/promociones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tallerId,
          nombreTaller,
          clienteIds: Array.from(seleccionados),
          canal,
          mensaje: mensajePreview,
          descripcion,
          motivo: motivoSel?.label ?? '',
          tipoDescuento,
          valorDescuento,
        }),
      })

      const data = await res.json()
      setResultado(data)
      if (data.enviados > 0) {
        setSeleccionados(new Set())
        setMostrarPreview(false)
      }
    } catch {
      setResultado({ enviados: 0, fallidos: seleccionados.size })
    }

    setEnviando(false)
  }

  // ── Loading ──
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
      </div>
    )
  }

  // ── Gate Pro ──
  if (plan !== 'pro' && plan !== 'trial' && plan !== '') {
    return (
      <div className="max-w-2xl mx-auto mt-16 text-center px-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-10">
          <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Megaphone className="w-8 h-8 text-orange-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Feature Pro</h2>
          <p className="text-gray-500 mb-6">
            El módulo de Promociones está disponible en el plan Pro.
            Envía ofertas masivas a tus clientes por WhatsApp o email en segundos.
          </p>
          <a
            href="/precios"
            className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            Upgrade a Pro <ChevronRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    )
  }

  // ── UI Principal ──
  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Megaphone className="w-6 h-6 text-orange-500" />
            Promociones
          </h1>
          <p className="text-gray-500 mt-1">
            Envía ofertas personalizadas a tus clientes por WhatsApp o email.
          </p>
        </div>
        <span className="bg-orange-500/10 text-orange-600 text-xs font-semibold px-3 py-1 rounded-full border border-orange-500/20">
          PRO
        </span>
      </div>

      {/* Bloque explicativo */}
      <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5 flex gap-4">
        <div className="shrink-0 w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-orange-600" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-orange-900">¿Cómo funciona?</p>
          <p className="text-sm text-orange-800 leading-relaxed">
            Describe tu promoción, elige un motivo de marketing (Día de las Madres, Navidad, etc.), 
            selecciona los clientes a los que quieres enviársela y elige el canal. 
            TallerOS genera un mensaje personalizado para cada cliente y te lo muestra antes de enviarlo para que lo apruebes.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* ── Columna izquierda: configurar promoción ── */}
        <div className="space-y-6">

          {/* Pretextos */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
            <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <Tag className="w-4 h-4 text-orange-500" /> Ocasión (opcional)
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {PRETEXTOS.map(p => (
                <button
                  key={p.id}
                  onClick={() => {
                    setPretextoSel(prev => prev?.id === p.id ? null : p)
                    if (p.descuento_sugerido && !valorDescuento) setValorDescuento(p.descuento_sugerido.replace('%', ''))
                  }}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border transition-all text-left ${
                    motivoSel?.id === p.id
                      ? 'bg-orange-500 border-orange-500 text-white'
                      : 'bg-gray-50 border-gray-200 text-gray-700 hover:border-orange-300'
                  }`}
                >
                  <span>{p.emoji}</span>
                  <span className="truncate">{p.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Descripción y descuento */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
            <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <Tag className="w-4 h-4 text-orange-500" /> Detalle de la promoción
            </h2>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Descripción (opcional)</label>
              <input
                type="text"
                value={descripcion}
                onChange={e => setDescripcion(e.target.value)}
                placeholder="Ej: Cambio de aceite y revisión de frenos incluida"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:border-orange-400 placeholder:text-gray-400"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Tipo de descuento</label>
              <div className="flex gap-3">
                <button
                  onClick={() => setTipoDescuento('porcentaje')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                    tipoDescuento === 'porcentaje'
                      ? 'bg-orange-500 border-orange-500 text-white'
                      : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-orange-300'
                  }`}
                >
                  <Percent className="w-4 h-4" /> Porcentaje
                </button>
                <button
                  onClick={() => setTipoDescuento('monto')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                    tipoDescuento === 'monto'
                      ? 'bg-orange-500 border-orange-500 text-white'
                      : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-orange-300'
                  }`}
                >
                  <DollarSign className="w-4 h-4" /> Monto fijo
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Valor del descuento {tipoDescuento === 'porcentaje' ? '(%)' : '(en tu moneda)'}
              </label>
              <input
                type="number"
                min="0"
                value={valorDescuento}
                onChange={e => setValorDescuento(e.target.value)}
                placeholder={tipoDescuento === 'porcentaje' ? 'Ej: 20' : 'Ej: 200'}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:border-orange-400 placeholder:text-gray-400"
              />
            </div>

            {/* Canal */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Canal de envío</label>
              <div className="flex gap-3">
                {([
                  { value: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
                  { value: 'email',    label: 'Email',    icon: Mail },
                  { value: 'ambos',    label: 'Ambos',    icon: Send },
                ] as const).map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    onClick={() => setCanal(value)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                      canal === value
                        ? 'bg-orange-500 border-orange-500 text-white'
                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-orange-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" /> {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Columna derecha: selección de clientes ── */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-orange-500" /> Clientes
            </h2>
            <span className="text-xs text-gray-400">
              {seleccionados.size} seleccionados
            </span>
          </div>

          {/* Buscador */}
          <input
            type="text"
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre o teléfono..."
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-orange-400 placeholder:text-gray-400"
          />

          {/* Seleccionar todos */}
          <button
            onClick={toggleTodos}
            className="flex items-center gap-2 text-sm font-medium text-orange-600 hover:text-orange-500 transition-colors"
          >
            {seleccionados.size === clientesFiltrados.length && clientesFiltrados.length > 0
              ? <CheckSquare className="w-4 h-4" />
              : <Square className="w-4 h-4" />
            }
            {seleccionados.size === clientesFiltrados.length && clientesFiltrados.length > 0
              ? 'Deseleccionar todos'
              : `Seleccionar todos (${clientesFiltrados.length})`
            }
          </button>

          {/* Lista */}
          <div className="space-y-1 max-h-80 overflow-y-auto pr-1">
            {clientesFiltrados.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No hay clientes registrados</p>
            ) : (
              clientesFiltrados.map(c => (
                <button
                  key={c.id}
                  onClick={() => toggleCliente(c.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${
                    seleccionados.has(c.id)
                      ? 'bg-orange-50 border border-orange-200'
                      : 'hover:bg-gray-50 border border-transparent'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                    seleccionados.has(c.id)
                      ? 'bg-orange-500 border-orange-500'
                      : 'border-gray-300'
                  }`}>
                    {seleccionados.has(c.id) && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{c.nombre}</p>
                    <p className="text-xs text-gray-400 truncate">
                      {[c.vehiculo_marca, c.vehiculo_modelo].filter(Boolean).join(' ') || c.telefono || 'Sin datos'}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── Botón preview ── */}
      {seleccionados.size > 0 && (
        <button
          onClick={() => setMostrarPreview(true)}
          className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-400 text-white font-semibold py-3.5 rounded-2xl transition-colors text-base"
        >
          <Eye className="w-5 h-5" />
          Ver preview del mensaje ({seleccionados.size} cliente{seleccionados.size > 1 ? 's' : ''})
        </button>
      )}

      {/* ── Resultado ── */}
      {resultado && (
        <div className={`rounded-2xl p-5 flex items-start gap-4 ${
          resultado.fallidos === 0
            ? 'bg-green-50 border border-green-200'
            : resultado.enviados === 0
              ? 'bg-red-50 border border-red-200'
              : 'bg-yellow-50 border border-yellow-200'
        }`}>
          {resultado.fallidos === 0
            ? <CheckCircle2 className="w-6 h-6 text-green-600 shrink-0 mt-0.5" />
            : <AlertCircle className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
          }
          <div>
            <p className="font-semibold text-gray-900">
              {resultado.enviados > 0 ? `✅ ${resultado.enviados} mensaje${resultado.enviados > 1 ? 's' : ''} enviado${resultado.enviados > 1 ? 's' : ''}` : ''}
              {resultado.fallidos > 0 ? `  ⚠️ ${resultado.fallidos} fallido${resultado.fallidos > 1 ? 's' : ''}` : ''}
            </p>
            <p className="text-sm text-gray-500 mt-0.5">
              {resultado.fallidos > 0
                ? 'Los fallidos pueden deberse a clientes sin teléfono o email registrado.'
                : 'Tu promoción fue enviada exitosamente a todos los clientes seleccionados.'}
            </p>
          </div>
        </div>
      )}

      {/* ── Modal Preview ── */}
      {mostrarPreview && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Preview del mensaje</h3>
              <p className="text-sm text-gray-500 mt-1">
                Así recibirán el mensaje tus {seleccionados.size} cliente{seleccionados.size > 1 ? 's' : ''}.
                El nombre cambia para cada uno.
              </p>
            </div>

            <div className="p-6 space-y-4">
              {/* Burbuja WhatsApp */}
              {(canal === 'whatsapp' || canal === 'ambos') && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1">
                    <MessageCircle className="w-3.5 h-3.5 text-green-600" /> WhatsApp
                  </p>
                  <div className="bg-[#dcf8c6] rounded-2xl rounded-tl-sm p-4 text-sm text-gray-900 leading-relaxed shadow-sm max-w-sm">
                    {mensajePreview.split(/(\*[^*]+\*)/).map((part, i) =>
                      part.startsWith('*') && part.endsWith('*')
                        ? <strong key={i}>{part.slice(1, -1)}</strong>
                        : part
                    )}
                    <p className="text-[10px] text-gray-400 text-right mt-1">
                      {new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              )}

              {/* Preview email */}
              {(canal === 'email' || canal === 'ambos') && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-blue-500" /> Email
                  </p>
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm text-gray-700 leading-relaxed">
                    <p className="font-semibold text-gray-500 text-xs mb-2">
                      Asunto: 🎁 Oferta especial para ti de {nombreTaller}
                    </p>
                    {mensajePreview}
                  </div>
                </div>
              )}

              <p className="text-xs text-gray-400 bg-gray-50 rounded-xl p-3">
                💡 Solo se enviarán a los clientes que tengan el canal requerido registrado (teléfono para WhatsApp, email para correo).
              </p>
            </div>

            <div className="p-6 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => setMostrarPreview(false)}
                disabled={enviando}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Editar
              </button>
              <button
                onClick={enviarPromociones}
                disabled={enviando}
                className="flex-1 py-3 rounded-xl bg-orange-500 hover:bg-orange-400 text-white font-semibold text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {enviando ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Enviando...</>
                ) : (
                  <><Send className="w-4 h-4" /> Enviar ahora</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
