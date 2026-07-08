'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, Send, Loader2, MapPin, Globe, Mail, Phone, Save,
} from 'lucide-react'
import { Lead, MensajeCRM, EtapaLead } from '@/types'
import { cambiarEtapa, guardarNotas, enviarRespuesta } from '@/app/admin/leads/actions'

const ETAPAS: { id: EtapaLead; label: string }[] = [
  { id: 'nuevo',       label: 'Nuevo'          },
  { id: 'contactado',  label: 'Contactado'     },
  { id: 'interesado',  label: 'Interesado'     },
  { id: 'negociacion', label: 'En negociación' },
  { id: 'cliente',     label: 'Cliente'        },
  { id: 'descartado',  label: 'Descartado'     },
]

export default function LeadConversacion({ lead, mensajes }: { lead: Lead; mensajes: MensajeCRM[] }) {
  const router = useRouter()
  const [etapa, setEtapa]       = useState<EtapaLead>(lead.etapa)
  const [notas, setNotas]       = useState(lead.notas ?? '')
  const [mensaje, setMensaje]   = useState('')
  const [enviando, setEnviando] = useState(false)
  const [guardandoNotas, setGuardandoNotas] = useState(false)
  const [error, setError]       = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  async function handleCambiarEtapa(nuevaEtapa: EtapaLead) {
    setEtapa(nuevaEtapa)
    await cambiarEtapa(lead.id, nuevaEtapa)
    router.refresh()
  }

  async function handleGuardarNotas() {
    setGuardandoNotas(true)
    await guardarNotas(lead.id, notas)
    setGuardandoNotas(false)
  }

  async function handleEnviar() {
    if (!mensaje.trim() || !lead.telefono || enviando) return
    setEnviando(true)
    setError('')
    const texto = mensaje.trim()
    const { error } = await enviarRespuesta(lead.id, lead.telefono, texto)
    if (error) {
      setError(error)
    } else {
      setMensaje('')
      router.refresh()
    }
    setEnviando(false)
  }

  return (
    <div className="max-w-5xl mx-auto">
      <Link href="/admin/leads" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-6">
        <ArrowLeft className="w-4 h-4" />
        Volver a leads
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* ── Conversación ── */}
        <div className="md:col-span-2 bg-gray-900 border border-gray-800 rounded-2xl flex flex-col h-[600px]">
          <div className="px-5 py-4 border-b border-gray-800">
            <p className="text-white font-bold">{lead.nombre ?? 'Sin nombre'}</p>
            <p className="text-gray-500 text-xs mt-0.5">{lead.telefono ?? 'Sin teléfono'}</p>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {mensajes.length === 0 ? (
              <p className="text-center text-gray-500 text-sm py-8">Sin mensajes todavía</p>
            ) : (
              mensajes.map(m => (
                <div key={m.id} className={`flex ${m.sentido === 'saliente' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] px-3 py-2 rounded-xl text-sm leading-relaxed ${
                    m.sentido === 'saliente'
                      ? 'bg-blue-600 text-white rounded-tr-sm'
                      : 'bg-gray-800 text-gray-200 rounded-tl-sm'
                  }`}>
                    <p>{m.mensaje}</p>
                    <p className={`text-[10px] mt-1 ${m.sentido === 'saliente' ? 'text-blue-200' : 'text-gray-500'}`}>
                      {new Date(m.created_at).toLocaleString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))
            )}
            <div ref={bottomRef} />
          </div>

          {error && (
            <p className="text-xs text-red-400 bg-red-500/10 px-4 py-2 mx-4 mb-2 rounded-lg">{error}</p>
          )}

          <div className="p-3 border-t border-gray-800">
            <div className="flex items-center gap-2 bg-gray-800 rounded-xl px-3 py-2">
              <input
                type="text"
                value={mensaje}
                onChange={e => setMensaje(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleEnviar()}
                placeholder={lead.telefono ? 'Escribe una respuesta...' : 'Este lead no tiene teléfono'}
                disabled={!lead.telefono || enviando}
                className="input-on-dark flex-1 bg-transparent text-sm text-white outline-none placeholder:text-gray-500"
              />
              <button
                onClick={handleEnviar}
                disabled={!mensaje.trim() || !lead.telefono || enviando}
                className="w-8 h-8 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg flex items-center justify-center transition-colors flex-shrink-0"
              >
                {enviando ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Send size={14} className="text-white" />}
              </button>
            </div>
            <p className="text-center text-[11px] text-gray-500 mt-2">
              Solo se puede responder en texto libre dentro de 24h del último mensaje del lead.
            </p>
          </div>
        </div>

        {/* ── Panel lateral ── */}
        <div className="space-y-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Etapa</label>
              <select
                value={etapa}
                onChange={e => handleCambiarEtapa(e.target.value as EtapaLead)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {ETAPAS.map(e => (
                  <option key={e.id} value={e.id}>{e.label}</option>
                ))}
              </select>
            </div>

            <div className="pt-2 border-t border-gray-800 space-y-2">
              {lead.telefono && (
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{lead.telefono}</span>
                </div>
              )}
              {lead.email && (
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">{lead.email}</span>
                </div>
              )}
              {lead.direccion && (
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">{lead.direccion}</span>
                </div>
              )}
              {lead.website && (
                <a href={lead.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300">
                  <Globe className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">{lead.website}</span>
                </a>
              )}
              <p className="text-xs text-gray-500 pt-1">
                Origen: {lead.origen === 'prospeccion' ? 'Prospección saliente' : 'WhatsApp entrante'}
              </p>
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Notas internas</label>
            <textarea
              value={notas}
              onChange={e => setNotas(e.target.value)}
              rows={5}
              placeholder="Agrega notas sobre este lead..."
              className="input-on-dark w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <button
              onClick={handleGuardarNotas}
              disabled={guardandoNotas}
              className="mt-2 w-full flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-60 text-gray-300 text-sm font-medium py-2 rounded-lg transition-colors"
            >
              {guardandoNotas ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Guardar notas
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
