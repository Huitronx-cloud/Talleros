'use client'

import { useState, useEffect } from 'react'
import { MessageCircle, Send, X, Bell, Star, CalendarDays, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

// Cola de WhatsApp generada por los crons (recordatorios, reseñas, citas).
// Los links wa.me requieren un tap humano: cada botón abre el chat con el
// mensaje listo y marca el registro como enviado.
const ROLES_PERMITIDOS = ['propietario', 'admin', 'recepcion']

const TIPO_META: Record<string, { label: string; icon: typeof Bell; color: string; bg: string }> = {
  recordatorio: { label: 'Recordatorio', icon: Bell,         color: '#0284c7', bg: 'rgba(2,132,199,0.08)'  },
  resena:       { label: 'Reseña',       icon: Star,         color: '#d97706', bg: 'rgba(217,119,6,0.08)'  },
  cita:         { label: 'Cita',         icon: CalendarDays, color: '#7c3aed', bg: 'rgba(124,58,237,0.08)' },
}

interface MensajePendiente {
  id:            string
  tipo:          string
  telefono:      string
  mensaje_texto: string
  wa_link:       string
  created_at:    string
}

export default function MensajesPendientes() {
  const [mensajes, setMensajes]   = useState<MensajePendiente[]>([])
  const [visible, setVisible]     = useState(false)
  const [procesando, setProcesando] = useState<string | null>(null)
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

      const { data } = await supabase
        .from('mensajes_pendientes')
        .select('id, tipo, telefono, mensaje_texto, wa_link, created_at')
        .eq('taller_id', usuario.taller_id)
        .eq('estado', 'pendiente')
        .order('created_at', { ascending: true })
        .limit(50)

      if (data?.length) {
        setMensajes(data)
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
    if (!error) setMensajes(prev => prev.filter(m => m.id !== id))
  }

  function enviar(m: MensajePendiente) {
    // Abrir wa.me dentro del gesto del usuario (Safari/iOS bloquea popups post-await)
    window.open(m.wa_link, '_blank')
    marcar(m.id, 'enviado')
  }

  if (!visible || mensajes.length === 0) return null

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
      <div className="flex items-center gap-2 mb-1">
        <MessageCircle className="w-4 h-4" style={{ color: '#25D366' }} />
        <h3 className="text-sm font-semibold text-gray-900">Mensajes por enviar</h3>
        <span className="text-xs font-semibold text-white rounded-full px-2 py-0.5" style={{ background: '#25D366' }}>
          {mensajes.length}
        </span>
      </div>
      <p className="text-xs text-gray-400 mb-4">
        Recordatorios, reseñas y citas listos para mandar desde tu propio WhatsApp — un tap por mensaje.
      </p>

      <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
        {mensajes.map(m => {
          const meta = TIPO_META[m.tipo] ?? TIPO_META.recordatorio
          const Icono = meta.icon
          return (
            <div key={m.id} className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 bg-gray-50">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0" style={{ background: meta.bg }}>
                <Icono className="w-4 h-4" style={{ color: meta.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold" style={{ color: meta.color }}>{meta.label}</span>
                  <span className="text-xs text-gray-400">{m.telefono}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{m.mensaje_texto}</p>
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
                  onClick={() => marcar(m.id, 'descartado')}
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
