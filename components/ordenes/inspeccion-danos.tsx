'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle2, Loader2, Trash2, X, ChevronDown, ChevronUp } from 'lucide-react'

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

// Zonas calibradas para el SVG viewBox="0 0 300 160"
// x e y son porcentajes del viewBox
const ZONAS: { x: number; y: number; label: string }[] = [
  // Frente
  { x: 150, y: 15,  label: 'Defensa delantera' },
  { x: 90,  y: 22,  label: 'Salpicadera delantera izq.' },
  { x: 210, y: 22,  label: 'Salpicadera delantera der.' },
  { x: 150, y: 28,  label: 'Cofre' },
  // Centro
  { x: 150, y: 50,  label: 'Techo' },
  { x: 150, y: 45,  label: 'Parabrisas delantero' },
  { x: 150, y: 60,  label: 'Vidrio trasero' },
  { x: 68,  y: 50,  label: 'Puerta delantera izq.' },
  { x: 232, y: 50,  label: 'Puerta delantera der.' },
  { x: 68,  y: 70,  label: 'Puerta trasera izq.' },
  { x: 232, y: 70,  label: 'Puerta trasera der.' },
  // Trasera
  { x: 90,  y: 105, label: 'Salpicadera trasera izq.' },
  { x: 210, y: 105, label: 'Salpicadera trasera der.' },
  { x: 150, y: 115, label: 'Cajuela' },
  { x: 150, y: 140, label: 'Defensa trasera' },
]

function zonasMasCercana(x: number, y: number): string {
  let zonaMasCercana = 'Carrocería'
  let distanciaMin = Infinity
  ZONAS.forEach(z => {
    const dist = Math.sqrt(Math.pow(z.x - x, 2) + Math.pow(z.y - y, 2))
    if (dist < distanciaMin) {
      distanciaMin = dist
      zonaMasCercana = z.label
    }
  })
  return zonaMasCercana
}

export default function InspeccionDanos({ ordenId, tallerId, danosIniciales = [], soloLectura = false }: Props) {
  const supabase = createClient()
  const svgRef   = useRef<SVGSVGElement>(null)

  const [activo, setActivo]               = useState(danosIniciales.length > 0)
  const [danos, setDanos]                 = useState<Dano[]>(danosIniciales)
  const [danoPendiente, setDanoPendiente] = useState<Dano | null>(null)
  const [notaInput, setNotaInput]         = useState('')
  const [guardando, setGuardando]         = useState(false)
  const [guardado, setGuardado]           = useState(false)

  const handleClickSvg = (e: React.MouseEvent<SVGSVGElement>) => {
    if (soloLectura || !activo) return
    const svg = svgRef.current
    if (!svg) return
    const rect   = svg.getBoundingClientRect()
    const scaleX = 300 / rect.width
    const scaleY = 160 / rect.height
    const x = (e.clientX - rect.left) * scaleX
    const y = (e.clientY - rect.top)  * scaleY
    const zona = zonasMasCercana(x, y)
    setDanoPendiente({ x, y, zona, nota: '' })
    setNotaInput('')
  }

  const confirmarDano = () => {
    if (!danoPendiente) return
    setDanos(prev => [...prev, { ...danoPendiente, nota: notaInput }])
    setDanoPendiente(null)
    setNotaInput('')
  }

  const quitarDano = (i: number) =>
    setDanos(prev => prev.filter((_, idx) => idx !== i))

  const guardarInspeccion = async () => {
    setGuardando(true)
    try {
      await supabase.from('inspeccion_danos').delete().eq('orden_id', ordenId)
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

  // Vista de solo lectura sin daños
  if (soloLectura && danos.length === 0) return null

  return (
    <div className="space-y-4">

      {/* Toggle opcional — solo si no es soloLectura */}
      {!soloLectura && (
        <button
          onClick={() => setActivo(!activo)}
          className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl transition-colors"
        >
          <div className="flex items-center gap-2">
            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${
              activo ? 'bg-blue-600 border-blue-600' : 'border-gray-400'
            }`}>
              {activo && <div className="w-2 h-2 rounded-full bg-white" />}
            </div>
            <span className="text-sm font-medium text-gray-900">
              Registrar daños preexistentes del vehículo
            </span>
          </div>
          {activo ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </button>
      )}

      {/* Contenido — solo si está activo */}
      {(activo || soloLectura) && (
        <>
          {!soloLectura && (
            <p className="text-xs text-gray-500">
              Toca sobre la silueta del vehículo para marcar las zonas con daños preexistentes.
            </p>
          )}

          {/* SVG del vehículo — vista superior */}
          <div className="relative bg-slate-50 rounded-xl border border-gray-200 overflow-hidden">
            <svg
              ref={svgRef}
              viewBox="0 0 300 160"
              className={`w-full ${soloLectura ? '' : 'cursor-crosshair'}`}
              onClick={handleClickSvg}
            >
              {/* Etiquetas frente/trasera */}
              <text x="150" y="8" textAnchor="middle" fontSize="7" fill="#94a3b8" fontWeight="600">FRENTE</text>
              <text x="150" y="158" textAnchor="middle" fontSize="7" fill="#94a3b8" fontWeight="600">TRASERA</text>

              {/* Carrocería exterior */}
              <rect x="55" y="15" width="190" height="130" rx="20" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1.5"/>

              {/* Cofre */}
              <rect x="65" y="18" width="170" height="40" rx="12" fill="#dde3ed" stroke="#94a3b8" strokeWidth="1"/>

              {/* Cajuela */}
              <rect x="65" y="102" width="170" height="40" rx="12" fill="#dde3ed" stroke="#94a3b8" strokeWidth="1"/>

              {/* Techo/habitáculo */}
              <rect x="75" y="42" width="150" height="76" rx="8" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1"/>

              {/* Parabrisas delantero */}
              <rect x="90" y="45" width="120" height="28" rx="6" fill="#bfdbfe" stroke="#93c5fd" strokeWidth="0.8" opacity="0.8"/>

              {/* Vidrio trasero */}
              <rect x="90" y="87" width="120" height="28" rx="6" fill="#bfdbfe" stroke="#93c5fd" strokeWidth="0.8" opacity="0.8"/>

              {/* Línea divisoria puertas */}
              <line x1="75" y1="80" x2="225" y2="80" stroke="#94a3b8" strokeWidth="0.8" strokeDasharray="3,3"/>

              {/* Ruedas delanteras */}
              <rect x="32" y="18" width="28" height="42" rx="8" fill="#475569" stroke="#334155" strokeWidth="1"/>
              <rect x="240" y="18" width="28" height="42" rx="8" fill="#475569" stroke="#334155" strokeWidth="1"/>

              {/* Ruedas traseras */}
              <rect x="32" y="100" width="28" height="42" rx="8" fill="#475569" stroke="#334155" strokeWidth="1"/>
              <rect x="240" y="100" width="28" height="42" rx="8" fill="#475569" stroke="#334155" strokeWidth="1"/>

              {/* Rines */}
              <rect x="37" y="23" width="18" height="32" rx="5" fill="#94a3b8"/>
              <rect x="245" y="23" width="18" height="32" rx="5" fill="#94a3b8"/>
              <rect x="37" y="105" width="18" height="32" rx="5" fill="#94a3b8"/>
              <rect x="245" y="105" width="18" height="32" rx="5" fill="#94a3b8"/>

              {/* Marcadores de daños */}
              {danos.map((d, i) => (
                <g key={i}>
                  <circle cx={d.x} cy={d.y} r="6" fill="#ef4444" stroke="white" strokeWidth="2" opacity="0.9"/>
                  <text x={d.x} y={d.y + 4} textAnchor="middle" fontSize="6" fill="white" fontWeight="bold">{i + 1}</text>
                </g>
              ))}

              {/* Marcador pendiente */}
              {danoPendiente && (
                <circle cx={danoPendiente.x} cy={danoPendiente.y} r="6" fill="#f97316" stroke="white" strokeWidth="2" opacity="0.8"/>
              )}
            </svg>
          </div>

          {/* Modal nota del daño */}
          {danoPendiente && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-orange-800">📍 {danoPendiente.zona}</p>
                <button onClick={() => setDanoPendiente(null)}>
                  <X className="w-4 h-4 text-orange-400 hover:text-orange-600" />
                </button>
              </div>
              <input
                type="text"
                value={notaInput}
                onChange={e => setNotaInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && confirmarDano()}
                placeholder="Describe el daño (ej. Rayón, abollón, golpe...)"
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
                {danos.length} {danos.length === 1 ? 'daño registrado' : 'daños registrados'}
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
                    <button onClick={() => quitarDano(i)}>
                      <Trash2 className="w-3.5 h-3.5 text-red-400 hover:text-red-600" />
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
        </>
      )}
    </div>
  )
}