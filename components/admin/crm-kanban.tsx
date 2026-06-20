'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Sparkles, MessageCircle, Star, Handshake, CheckCircle2, XCircle,
  Phone, MapPin, Globe,
} from 'lucide-react'
import { Lead, EtapaLead } from '@/types'
import { cambiarEtapa } from '@/app/admin/leads/actions'

const COLUMNAS: { id: EtapaLead; label: string; color: string; bg: string; border: string; icono: any }[] = [
  { id: 'nuevo',       label: 'Nuevo',          color: 'text-gray-300',   bg: 'bg-gray-800/60',    border: 'border-gray-700',     icono: Sparkles      },
  { id: 'contactado',  label: 'Contactado',     color: 'text-blue-400',  bg: 'bg-blue-500/10',    border: 'border-blue-500/30',  icono: MessageCircle },
  { id: 'interesado',  label: 'Interesado',     color: 'text-amber-400', bg: 'bg-amber-500/10',   border: 'border-amber-500/30', icono: Star          },
  { id: 'negociacion', label: 'En negociación', color: 'text-purple-400', bg: 'bg-purple-500/10',  border: 'border-purple-500/30', icono: Handshake     },
  { id: 'cliente',     label: 'Cliente',        color: 'text-green-400', bg: 'bg-green-500/10',   border: 'border-green-500/30', icono: CheckCircle2  },
  { id: 'descartado',  label: 'Descartado',     color: 'text-red-400',   bg: 'bg-red-500/10',     border: 'border-red-500/30',   icono: XCircle       },
]

function TarjetaLead({
  lead,
  onDragStart,
}: {
  lead: Lead
  onDragStart?: (e: React.DragEvent, leadId: string) => void
}) {
  return (
    <Link href={`/admin/leads/${lead.id}`}>
      <div
        draggable={!!onDragStart}
        onDragStart={onDragStart ? e => onDragStart(e, lead.id) : undefined}
        className="bg-gray-900 rounded-xl border border-gray-800 p-3 cursor-pointer hover:border-gray-700 transition-all select-none"
      >
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <p className="text-sm font-semibold text-white truncate">{lead.nombre ?? 'Sin nombre'}</p>
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-gray-800 text-gray-400 flex-shrink-0">
            {lead.origen === 'prospeccion' ? 'Prospección' : 'WhatsApp'}
          </span>
        </div>

        {lead.telefono && (
          <div className="flex items-center gap-1.5 mb-1">
            <Phone className="w-3 h-3 text-gray-500 flex-shrink-0" />
            <span className="text-xs text-gray-400">{lead.telefono}</span>
          </div>
        )}
        {lead.ciudad && (
          <div className="flex items-center gap-1.5 mb-1">
            <MapPin className="w-3 h-3 text-gray-500 flex-shrink-0" />
            <span className="text-xs text-gray-400 truncate">{lead.ciudad}</span>
          </div>
        )}
        {lead.website && (
          <div className="flex items-center gap-1.5">
            <Globe className="w-3 h-3 text-gray-500 flex-shrink-0" />
            <span className="text-xs text-gray-400 truncate">{lead.website}</span>
          </div>
        )}
      </div>
    </Link>
  )
}

// ── VISTA MÓVIL (tabs) ──
function KanbanMovil({ leads }: { leads: Lead[] }) {
  const router = useRouter()
  const [tabActivo, setTabActivo] = useState<EtapaLead>('nuevo')
  const [moviendo, setMoviendo]   = useState<string | null>(null)

  const tarjetas = leads.filter(l => l.etapa === tabActivo)

  const moverLead = async (leadId: string, nuevaEtapa: EtapaLead) => {
    setMoviendo(leadId)
    await cambiarEtapa(leadId, nuevaEtapa)
    setMoviendo(null)
    router.refresh()
  }

  return (
    <div className="space-y-3">
      <div className="flex rounded-xl border border-gray-800 bg-gray-900 p-1 gap-1 overflow-x-auto">
        {COLUMNAS.map(col => {
          const count  = leads.filter(l => l.etapa === col.id).length
          const activo = tabActivo === col.id
          const Icono  = col.icono
          return (
            <button
              key={col.id}
              onClick={() => setTabActivo(col.id)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2 px-1 rounded-lg text-[10px] font-semibold transition-all whitespace-nowrap ${
                activo ? 'bg-gray-800 ' + col.color : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <Icono className="w-4 h-4" />
              <span>{col.label}</span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                activo ? col.bg + ' ' + col.color : 'bg-gray-800 text-gray-500'
              }`}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      <div className="space-y-3">
        {tarjetas.length === 0 ? (
          <div className="text-center py-12 text-gray-500 text-sm">
            Sin leads en esta columna
          </div>
        ) : (
          tarjetas.map(lead => {
            const colIdx    = COLUMNAS.findIndex(c => c.id === lead.etapa)
            const anterior  = colIdx > 0 ? COLUMNAS[colIdx - 1] : null
            const siguiente = colIdx < COLUMNAS.length - 1 ? COLUMNAS[colIdx + 1] : null

            return (
              <div key={lead.id} className="space-y-2">
                <TarjetaLead lead={lead} />
                <div className="flex gap-2 px-1">
                  {anterior && (
                    <button
                      onClick={() => moverLead(lead.id, anterior.id)}
                      disabled={moviendo === lead.id}
                      className={`flex-1 py-1.5 text-xs font-medium rounded-lg border transition-colors ${anterior.border} ${anterior.color} bg-gray-900`}
                    >
                      {moviendo === lead.id ? '...' : `← ${anterior.label}`}
                    </button>
                  )}
                  {siguiente && (
                    <button
                      onClick={() => moverLead(lead.id, siguiente.id)}
                      disabled={moviendo === lead.id}
                      className={`flex-1 py-1.5 text-xs font-medium rounded-lg border transition-colors ${siguiente.border} ${siguiente.color} bg-gray-900`}
                    >
                      {moviendo === lead.id ? '...' : `${siguiente.label} →`}
                    </button>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

// ── VISTA DESKTOP (drag & drop) ──
function KanbanDesktop({ leads }: { leads: Lead[] }) {
  const router = useRouter()
  const [leadsState, setLeadsState]     = useState<Lead[]>(leads)
  const [arrastrando, setArrastrando]   = useState<string | null>(null)
  const [sobreColumna, setSobreColumna] = useState<EtapaLead | null>(null)
  const [moviendo, setMoviendo]         = useState<string | null>(null)

  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    e.dataTransfer.setData('leadId', leadId)
    setArrastrando(leadId)
  }

  const handleDragOver = (e: React.DragEvent, columnaId: EtapaLead) => {
    e.preventDefault()
    setSobreColumna(columnaId)
  }

  const handleDrop = async (e: React.DragEvent, nuevaEtapa: EtapaLead) => {
    e.preventDefault()
    const leadId = e.dataTransfer.getData('leadId')
    const lead   = leadsState.find(l => l.id === leadId)
    if (!lead || lead.etapa === nuevaEtapa) {
      setArrastrando(null)
      setSobreColumna(null)
      return
    }

    setLeadsState(prev => prev.map(l => l.id === leadId ? { ...l, etapa: nuevaEtapa } : l))
    setArrastrando(null)
    setSobreColumna(null)
    setMoviendo(leadId)
    await cambiarEtapa(leadId, nuevaEtapa)
    setMoviendo(null)
    router.refresh()
  }

  const handleDragEnd = () => {
    setArrastrando(null)
    setSobreColumna(null)
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {COLUMNAS.map(col => {
        const tarjetas = leadsState.filter(l => l.etapa === col.id)
        const esSobre  = sobreColumna === col.id
        const Icono    = col.icono

        return (
          <div
            key={col.id}
            onDragOver={e => handleDragOver(e, col.id)}
            onDrop={e => handleDrop(e, col.id)}
            onDragLeave={() => setSobreColumna(null)}
            className={`flex-shrink-0 w-72 rounded-2xl border-2 transition-all ${
              esSobre ? `${col.border} ${col.bg} shadow-lg scale-[1.01]` : 'border-gray-800 bg-gray-900/50'
            }`}
          >
            <div className={`px-4 py-3 rounded-t-xl flex items-center justify-between ${col.bg}`}>
              <div className="flex items-center gap-2">
                <Icono className={`w-4 h-4 ${col.color}`} />
                <span className={`text-sm font-bold ${col.color}`}>{col.label}</span>
              </div>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${col.bg} ${col.color} border ${col.border}`}>
                {tarjetas.length}
              </span>
            </div>

            <div className="p-3 space-y-3 min-h-[200px]">
              {tarjetas.length === 0 ? (
                <div className={`flex items-center justify-center h-24 rounded-xl border-2 border-dashed transition-all ${
                  esSobre ? col.border : 'border-gray-800'
                }`}>
                  <p className="text-xs text-gray-500">{esSobre ? 'Suelta aquí' : 'Sin leads'}</p>
                </div>
              ) : (
                tarjetas.map(lead => (
                  <div
                    key={lead.id}
                    className={`transition-all ${
                      arrastrando === lead.id ? 'opacity-40 scale-95' : ''
                    } ${moviendo === lead.id ? 'animate-pulse' : ''}`}
                  >
                    <TarjetaLead lead={lead} onDragStart={handleDragStart} />
                  </div>
                ))
              )}
              {esSobre && tarjetas.length > 0 && (
                <div className={`h-16 rounded-xl border-2 border-dashed ${col.border} flex items-center justify-center`}>
                  <p className={`text-xs font-medium ${col.color}`}>Suelta aquí</p>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── COMPONENTE PRINCIPAL ──
export default function CrmKanban({ leads }: { leads: Lead[] }) {
  return (
    <>
      <div className="md:hidden">
        <KanbanMovil leads={leads} />
      </div>
      <div className="hidden md:block">
        <KanbanDesktop leads={leads} />
      </div>
    </>
  )
}
