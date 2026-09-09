'use client'

import { useState, useEffect } from 'react'
import { MessageCircle, Send, X, Bell, Star, CalendarDays, Loader2, Megaphone, ShieldCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

// Cola de WhatsApp generada por los crons (recordatorios, reseñas, citas).
// Los links wa.me requieren un tap humano: cada botón abre el chat con el
// mensaje listo y marca el registro como enviado.
const ROLES_PERMITIDOS = ['propietario', 'admin', 'recepcion']

const TIPO_META: Record<string, { label: string; icon: typeof Bell; color: string; bg: string }> = {
  recordatorio: { label: 'Recordatorio', icon: Bell,          color: '#0284c7', bg: 'rgba(2,132,199,0.08)'  },
  resena:       { label: 'Reseña',       icon: Star,          color: '#d97706', bg: 'rgba(217,119,6,0.08)'  },
  cita:         { label: 'Cita',         icon: CalendarDays,  color: '#7c3aed', bg: 'rgba(124,58,237,0.08)' },
  promocion:    { label: 'Promoción',    icon: Megaphone,     color: '#ea580c', bg: 'rgba(234,88,12,0.08)'  },
  aviso:        { label: 'Aviso',        icon: MessageCircle, color: '#16a34a', bg: 'rgba(22,163,74,0.08)'  },
  garantia:     { label: 'Garantía',     icon: ShieldCheck,   color: '#2563eb', bg: 'rgba(37,99,235,0.08)'  },
  seguimiento:  { label: 'Seguimiento',  icon: MessageCircle, color: '#64748b', bg: 'rgba(100,116,139,0.08)' },
}

interface MensajePendiente {
  id:            string
  tipo:          string
  telefono:      string
  mensaje_texto: string
  wa_link:       string
  created_at:    string
  clientes:      { nombre: string } | { nombre: string }[] | null
}

/**
 * El nombre del cliente, o su teléfono si no lo tenemos.
 *
 * La cola enseñaba el número y ya está: "524611456622". Una recepcionista no
 * reconoce un número, reconoce a Rosa Elena. El dato llevaba guardado desde
 * siempre —`mensajes_pendientes` tiene `cliente_id`— y no se usaba.
 *
 * De los 93 mensajes en cola de toda la plataforma, 88 traen cliente. Los
 * cinco que no, siguen enseñando el teléfono, que es exactamente lo de antes:
 * nadie pierde nada y casi todos ganan un nombre.
 */
function quienEs(m: MensajePendiente): string {
  const c = Array.isArray(m.clientes) ? m.clientes[0] : m.clientes
  return c?.nombre?.trim() || m.telefono
}

/** Días enteros que lleva esperando un mensaje. */
function diasEsperando(fecha: string): number {
  const ms = Date.now() - new Date(fecha).getTime()
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)))
}

/**
 * La antigüedad de un mensaje, en corto.
 *
 * Va en cada fila y no solo arriba, porque es el dato que permite decidir uno
 * por uno. Lo dijo el dueño de un taller: un aviso viejo puede ser un coche
 * que sigue en el taller porque el trabajo se alargó, y a ese cliente sí hay
 * que avisarle. El sistema no puede saberlo; el dueño sí, pero necesita ver
 * de cuándo es.
 */
function edadTexto(fecha: string): string {
  const dias = diasEsperando(fecha)
  if (dias === 0) return 'hoy'
  if (dias === 1) return 'ayer'
  return `hace ${dias} días`
}

export default function MensajesPendientes() {
  const [mensajes, setMensajes]   = useState<MensajePendiente[]>([])
  // El total real, que puede ser mayor que los que se listan: la consulta trae
  // 50 y había talleres con más de 50 esperando. Antes el contador enseñaba la
  // longitud de la lista, así que con 52 pendientes decía 50 — y los dos que
  // faltaban no aparecían por ningún lado.
  const [total, setTotal]         = useState(0)
  const [visible, setVisible]     = useState(false)
  const [procesando, setProcesando] = useState<string | null>(null)
  // Cuál está abierto. Solo uno: la lista se lee de arriba abajo y dos
  // mensajes largos abiertos a la vez la vuelven ilegible.
  const [abierto, setAbierto]     = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    async function cargar() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) return

      const { data: usuario } = await supabase
        .from('usuarios')
        .select('taller_id, rol')
        .eq('id', session.user.id)
        .single()

      if (!usuario?.taller_id || !ROLES_PERMITIDOS.includes(usuario.rol)) return

      const { data, count } = await supabase
        .from('mensajes_pendientes')
        .select('id, tipo, telefono, mensaje_texto, wa_link, created_at, clientes(nombre)', { count: 'exact' })
        .eq('taller_id', usuario.taller_id)
        .eq('estado', 'pendiente')
        .order('created_at', { ascending: true })
        .limit(50)

      if (data?.length) {
        setMensajes(data)
        setTotal(count ?? data.length)
        setVisible(true)
      }
    }
    cargar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function marcar(id: string, estado: 'enviado' | 'descartado') {
    setProcesando(id)
    const { error } = await supabase
      .from('mensajes_pendientes')
      .update({ estado, ...(estado === 'enviado' ? { enviado_at: new Date().toISOString() } : {}) })
      .eq('id', id)
    setProcesando(null)
    if (!error) {
      setMensajes(prev => prev.filter(m => m.id !== id))
      setTotal(prev => Math.max(0, prev - 1))
    }
  }

  /**
   * Descartar pide confirmación con el nombre delante.
   *
   * Es irreversible desde la pantalla y la X está a un dedo del botón de
   * enviar. Perder por un roce el aviso de un cliente que lleva tres semanas
   * esperando es justo lo que no puede pasar en una lista que se revisa una
   * por una.
   */
  function descartar(m: MensajePendiente) {
    const ok = confirm(
      `¿Descartar el mensaje de ${quienEs(m)}?\n\n` +
      'No se envía y desaparece de la lista. Si el vehículo sigue en el taller ' +
      'y aún hay que avisarle, mejor déjalo aquí.'
    )
    if (ok) marcar(m.id, 'descartado')
  }

  function enviar(m: MensajePendiente) {
    // Abrir wa.me dentro del gesto del usuario (Safari/iOS bloquea popups post-await)
    window.open(m.wa_link, '_blank')
    marcar(m.id, 'enviado')
  }

  if (!visible || mensajes.length === 0) return null

  // La lista viene de la más vieja a la más nueva.
  const diasDelMasViejo = diasEsperando(mensajes[0].created_at)

  return (
    <div className="bg-white rounded-xl border-2 p-5" style={{ borderColor: '#25D366' }}>
      <div className="flex items-center gap-3 mb-1">
        <div
          className="flex items-center justify-center w-11 h-11 rounded-xl flex-shrink-0"
          style={{ background: '#25D366' }}
        >
          <MessageCircle className="w-5 h-5 text-white" />
        </div>
        <div className="min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900 leading-none">{total}</span>
            <h3 className="text-sm font-semibold text-gray-900">
              {total === 1 ? 'mensaje por enviar' : 'mensajes por enviar'}
            </h3>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Listos para mandar desde tu WhatsApp — un tap por mensaje.
          </p>
        </div>
      </div>

      {/* La antigüedad del más viejo es lo que convierte esto en una tarea.
          Un número a secas se ignora; "lleva 24 días esperando" no. */}
      {diasDelMasViejo >= 3 && (
        <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg mt-3">
          El más antiguo lleva <strong>{diasDelMasViejo} días</strong> esperando.
          Son clientes tuyos que aún no han tenido noticias.
        </p>
      )}

      {total > mensajes.length && (
        <p className="text-xs text-gray-400 mt-3">
          Se muestran los {mensajes.length} más antiguos de {total}.
        </p>
      )}

      <div className="h-4" />

      <div className="space-y-3">
        {mensajes.map(m => {
          const meta = TIPO_META[m.tipo] ?? TIPO_META.recordatorio
          const Icono = meta.icon
          return (
            <div key={m.id} className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 bg-gray-50">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0" style={{ background: meta.bg }}>
                <Icono className="w-4 h-4" style={{ color: meta.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-gray-900 truncate">{quienEs(m)}</span>
                  <span className="text-xs font-semibold" style={{ color: meta.color }}>{meta.label}</span>
                  {/* La antigüedad, por mensaje. Sin esto no se puede decidir:
                      un aviso de hace tres semanas puede ser un coche que
                      sigue en el taller porque el trabajo se alargó, y ese
                      mensaje SÍ hay que mandarlo. Solo el dueño lo sabe. */}
                  <span className="text-xs text-gray-400">{edadTexto(m.created_at)}</span>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">{m.telefono}</p>

                {/* El texto entero, no cortado a dos líneas: es lo que se le va
                    a mandar al cliente y nadie decide sobre lo que no ha leído. */}
                <p className={`text-xs text-gray-500 mt-1 whitespace-pre-line ${abierto === m.id ? '' : 'line-clamp-2'}`}>
                  {m.mensaje_texto}
                </p>
                {m.mensaje_texto.length > 110 && (
                  <button
                    onClick={() => setAbierto(abierto === m.id ? null : m.id)}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 mt-1"
                  >
                    {abierto === m.id ? 'Ver menos' : 'Ver el mensaje completo'}
                  </button>
                )}
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button
                  onClick={() => enviar(m)}
                  disabled={procesando === m.id}
                  title="Enviar por WhatsApp"
                  className="flex items-center gap-1.5 text-white text-xs font-semibold px-3 py-2 rounded-lg disabled:opacity-60 transition-colors"
                  style={{ background: '#25D366' }}
                >
                  {procesando === m.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  Enviar
                </button>
                <button
                  onClick={() => descartar(m)}
                  disabled={procesando === m.id}
                  title="Descartar"
                  className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-60 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
