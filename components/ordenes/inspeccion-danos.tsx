'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle2, Loader2, Trash2, X } from 'lucide-react'

interface Dano {
  id?: string
  x: number
  y: number
  zona: string
  nota: string
}

interface Props {
  ordenId: string
  tallerId: string
  danosIniciales?: Dano[]
  soloLectura?: boolean
}

const ZONAS: { x: number; y: number; label: string }[] = [
  { x: 50,  y: 12,  label: 'Techo' },
  { x: 50,  y: 25,  label: 'Cofre' },
  { x: 50,  y: 75,  label: 'Cajuela' },
  { x: 20,  y: 35,  label: 'Puerta delantera izq.' },
  { x: 80,  y: 35,  label: 'Puerta delantera der.' },
  { x: 20,  y: 55,  label: 'Puerta trasera izq.' },
  { x: 80,  y: 55,  label: 'Puerta trasera der.' },
  { x: 50,  y: 40,  label: 'Parabrisas' },
  { x: 15,  y: 25,  label: 'Salpicadera delantera izq.' },
  { x: 85,  y: 25,  label: 'Salpicadera delantera der.' },
  { x: 15,  y: 65,  label: 'Salpicadera trasera izq.' },
  { x: 85,  y: 65,  label: 'Salpicadera trasera der.' },
  { x: 50,  y: 88,  label: 'Defensa trasera' },
  { x: 50,  y: 18,  label: 'Defensa delantera' },
]

export default function InspeccionDanos({ ordenId, tallerId, danosIniciales = [], soloLectura = false }: Props) {
  const supabase = createClient()
  const svgRef   = useRef<SVGSVGElement>(null)

  const [danos, setDanos]           = useState<Dano[]>(danosIniciales)
  const [danoPendiente, setDanoPendiente] = useState<Dano | null>(null)
  const [notaInput, setNotaInput]   = useState('')
  const [guardando, setGuardando]   = useState(false)
  const [guardado, setGuardado]     = useState(false)

  const handleClickSvg = (e: React.MouseEvent<SVGSVGElement>) => {
    if (soloLectura) return
    const svg = svgRef.current
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100

    // Encontrar zona más cercana
    let zonaMasCercana = 'Carrocería'
    let distanciaMin = Infinity
    ZONAS.forEach(z => {
      const dist = Math.sqrt(Math.pow(z.x - x, 2) + Math.pow(z.y - y, 2))
      if (dist < distanciaMin) {
        distanciaMin = dist
        zonaMasCercana = z.label
      }
    })

    setDanoPendiente({ x, y, zona: zonaMasCercana, nota: '' })
    setNotaInput('')
  }

  const confirmarDano = () => {
    if (!danoPendiente) return
    setDanos(prev => [...prev, { ...danoPendiente, nota: notaInput }])
    setDanoPendiente(null)
    setNotaInput('')
  }

  const quitarDano = (i: number) => {
    setDanos(prev => prev.filter((_, idx) => idx !== i))
  }

  const guardarInspeccion = async () => {
    setGuardando(true)
    try {
      // Borrar daños anteriores
      await supabase.from('inspeccion_danos').delete().eq('orden_id', ordenId)

      // Insertar nuevos
      if (danos.length > 0) {
        await supabase.from('inspeccion_danos').insert(
          danos.map(d => ({
            orden_id:  ordenId,
            taller_id: tallerId,
            x:         d.x,
            y:         d.y,
            zona:      d.zona,
            nota:      d.nota || null,
          }))
        )
      }
      setGuardado(true)
      setTimeout(() => setGuardado(false), 2000)
    } catch (err) {
      console.error('Error guardando inspección:', err)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="space-y-4">
      {!soloLectura && (
        <p className="text-xs text-gray-500">
          Toca sobre la silueta del vehículo para marcar zonas con daños.
        </p>
      )}

      {/* SVG del vehículo */}
      <div className="relative bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 overflow-hidden">
        <svg
          ref={svgRef}
          viewBox="0 0 200 100"
          className={`w-full ${soloLectura ? '' : 'cursor-crosshair'}`}
          onClick={handleClickSvg}
        >
          {/* Silueta del carro — vista superior */}
          {/* Carrocería principal */}
          <rect x="30" y="20" width="140" height="60" rx="15" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1"/>
          {/* Techo/cabina */}
          <rect x="55" y="28" width="90" height="35" rx="8" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="0.8"/>
          {/* Cofre */}
          <rect x="30" y="20" width="35" height="60" rx="8" fill="#dde3ed" stroke="#94a3b8" strokeWidth="0.8"/>
          {/* Cajuela */}
          <rect x="135" y="20" width="35" height="60" rx="8" fill="#dde3ed" stroke="#94a3b8" strokeWidth="0.8"/>
          {/* Ruedas */}
          <ellipse cx="55"  cy="18" rx="10" ry="5" fill="#64748b"/>
          <ellipse cx="145" cy="18" rx="10" ry="5" fill="#64748b"/>
          <ellipse cx="55"  cy="82" rx="10" ry="5" fill="#64748b"/>
          <ellipse cx="145" cy="82" rx="10" ry="5" fill="#64748b"/>
          {/* Parabrisas */}
          <rect x="63" y="30" width="35" height="20" rx="4" fill="#bfdbfe" stroke="#93c5fd" strokeWidth="0.8" opacity="0.7"/>
          {/* Vidrio trasero */}
          <rect x="102" y="30" width="35" height="20" rx="4" fill="#bfdbfe" stroke="#93c5fd" strokeWidth="0.8" opacity="0.7"/>

          {/* Marcadores de daños */}
          {danos.map((d, i) => (
            <g key={i}>
              <circle
                cx={d.x * 2}
                cy={d.y}
                r="4"
                fill="#ef4444"
                stroke="white"
                strokeWidth="1.5"
                opacity="0.9"
              />
              <text
                x={d.x * 2}
                y={d.y - 6}
                textAnchor="middle"
                fontSize="5"
                fill="#ef4444"
                fontWeight="bold"
              >
                {i + 1}
              </text>
            </g>
          ))}

          {/* Marcador pendiente */}
          {danoPendiente && (
            <circle
              cx={danoPendiente.x * 2}
              cy={danoPendiente.y}
              r="4"
              fill="#f97316"
              stroke="white"
              strokeWidth="1.5"
              opacity="0.8"
            />
          )}
        </svg>

        {danos.length === 0 && !danoPendiente && !soloLectura && (
          <p className="absolute inset-0 flex items-center justify-center text-xs text-gray-400 pointer-events-none">
            Toca para marcar daños
          </p>
        )}
      </div>

      {/* Modal nota del daño */}
      {danoPendiente && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-orange-800">
              📍 {danoPendiente.zona}
            </p>
            <button onClick={() => setDanoPendiente(null)} className="text-orange-400 hover:text-orange-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          <input
            type="text"
            value={notaInput}
            onChange={e => setNotaInput(e.target.value)}
            placeholder="Describe el daño (ej. Rayón profundo, abollón...)"
            className="w-full px-3 py-2 border border-orange-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            autoFocus
          />
          <button
            onClick={confirmarDano}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium py-2 rounded-lg transition-colors"
          >
            Confirmar daño
          </button>
        </div>
      )}

      {/* Lista de daños */}
      {danos.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            {danos.length} {danos.length === 1 ? 'daño marcado' : 'daños marcados'}
          </p>
          {danos.map((d, i) => (
            <div key={i} className="flex items-start gap-3 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              <span className="w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-900">{d.zona}</p>
                {d.nota && <p className="text-xs text-gray-500 mt-0.5">{d.nota}</p>}
              </div>
              {!soloLectura && (
                <button onClick={() => quitarDano(i)} className="text-red-400 hover:text-red-600 flex-shrink-0">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Botón guardar */}
      {!soloLectura && (
        <button
          onClick={guardarInspeccion}
          disabled={guardando}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
        >
          {guardando ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</>
          ) : guardado ? (
            <><CheckCircle2 className="w-4 h-4" /> ¡Guardado!</>
          ) : (
            'Guardar inspección'
          )}
        </button>
      )}
    </div>
  )
}