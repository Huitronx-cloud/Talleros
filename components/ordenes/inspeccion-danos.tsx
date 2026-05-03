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

// Zonas calibradas para el SVG viewBox="0 0 680 420"
// Cada zona tiene coordenadas x,y en el espacio del viewBox y un label descriptivo
const ZONAS: { x: number; y: number; label: string }[] = [
  // Frente
  { x: 340, y: 32,  label: 'Defensa delantera' },
  { x: 270, y: 52,  label: 'Salpicadera delantera izq.' },
  { x: 410, y: 52,  label: 'Salpicadera delantera der.' },
  { x: 340, y: 85,  label: 'Cofre' },
  // Parabrisas y techo
  { x: 340, y: 140, label: 'Parabrisas delantero' },
  { x: 340, y: 185, label: 'Techo' },
  // Puertas delanteras
  { x: 215, y: 183, label: 'Puerta delantera izq.' },
  { x: 465, y: 183, label: 'Puerta delantera der.' },
  // Espejos
  { x: 148, y: 178, label: 'Espejo izq.' },
  { x: 532, y: 178, label: 'Espejo der.' },
  // Puertas traseras
  { x: 215, y: 230, label: 'Puerta trasera izq.' },
  { x: 465, y: 230, label: 'Puerta trasera der.' },
  // Vidrio y cajuela
  { x: 340, y: 270, label: 'Vidrio trasero' },
  { x: 340, y: 335, label: 'Cajuela' },
  // Salpicaderas traseras
  { x: 192, y: 330, label: 'Salpicadera trasera izq.' },
  { x: 488, y: 330, label: 'Salpicadera trasera der.' },
  // Defensa trasera
  { x: 340, y: 390, label: 'Defensa trasera' },
  // Ruedas
  { x: 138, y: 123, label: 'Llanta delantera izq.' },
  { x: 542, y: 123, label: 'Llanta delantera der.' },
  { x: 138, y: 299, label: 'Llanta trasera izq.' },
  { x: 542, y: 299, label: 'Llanta trasera der.' },
]

function zonaMasCercana(x: number, y: number): string {
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
    const scaleX = 680 / rect.width
    const scaleY = 420 / rect.height
    const x = (e.clientX - rect.left) * scaleX
    const y = (e.clientY - rect.top)  * scaleY
    const zona = zonaMasCercana(x, y)
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

      {/* Toggle — solo si no es soloLectura */}
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

      {/* Contenido */}
      {(activo || soloLectura) && (
        <>
          {!soloLectura && (
            <p className="text-xs text-gray-500">
              Toca sobre la silueta del vehículo para marcar zonas con daños preexistentes.
            </p>
          )}

          {/* SVG del vehículo — vista superior con silueta real */}
          <div className="relative bg-slate-50 rounded-xl border border-gray-200 overflow-hidden">
            <svg
              ref={svgRef}
              viewBox="0 0 680 420"
              className={`w-full ${soloLectura ? '' : 'cursor-crosshair'}`}
              onClick={handleClickSvg}
            >
              {/* Etiquetas frente/trasera */}
              <text x="340" y="14" textAnchor="middle" fontSize="9" fill="#94a3b8" fontWeight="600">FRENTE</text>
              <text x="340" y="417" textAnchor="middle" fontSize="9" fill="#94a3b8" fontWeight="600">TRASERA</text>

              {/* ===== CARROCERÍA PRINCIPAL ===== */}
              <path d="
                M 340 32
                C 290 32, 245 38, 225 50
                C 210 58, 198 68, 192 80
                L 185 105
                C 175 108, 165 112, 160 120
                L 158 175
                C 156 182, 155 190, 155 198
                L 155 280
                C 155 288, 156 296, 158 303
                L 162 340
                C 165 355, 172 365, 182 372
                C 200 382, 240 388, 290 390
                L 340 392
                L 390 390
                C 440 388, 480 382, 498 372
                C 508 365, 515 355, 518 340
                L 522 303
                C 524 296, 525 288, 525 280
                L 525 198
                C 525 190, 524 182, 522 175
                L 520 120
                C 515 112, 505 108, 495 105
                L 488 80
                C 482 68, 470 58, 455 50
                C 435 38, 390 32, 340 32
                Z
              " fill="#dde3ed" stroke="#94a3b8" strokeWidth="1.5"/>

              {/* ===== COFRE ===== */}
              <path d="
                M 268 50
                C 258 52, 242 58, 230 68
                C 220 76, 210 88, 206 102
                L 202 118
                L 478 118
                L 474 102
                C 470 88, 460 76, 450 68
                C 438 58, 422 52, 412 50
                C 390 44, 360 40, 340 40
                C 320 40, 295 44, 268 50
                Z
              " fill="#e8edf5" stroke="#94a3b8" strokeWidth="1"/>

              {/* ===== PARABRISAS DELANTERO ===== */}
              <path d="
                M 222 121
                C 226 117, 232 115, 240 114
                L 440 114
                C 448 115, 454 117, 458 121
                L 464 155
                C 450 158, 430 161, 408 162
                L 340 163
                L 272 162
                C 250 161, 230 158, 216 155
                Z
              " fill="#bfdbfe" stroke="#93c5fd" strokeWidth="0.8" opacity="0.85"/>

              {/* ===== TECHO / HABITÁCULO ===== */}
              <path d="
                M 210 163
                L 216 155
                C 230 158, 250 161, 272 162
                L 340 163
                L 408 162
                C 430 161, 450 158, 464 155
                L 470 163
                L 472 242
                C 472 249, 470 253, 464 255
                L 216 255
                C 210 253, 208 249, 208 242
                Z
              " fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1"/>

              {/* División puertas delantera/trasera */}
              <line x1="208" y1="208" x2="472" y2="208" stroke="#94a3b8" strokeWidth="0.8" strokeDasharray="4,3"/>

              {/* Columna B (pilar central) */}
              <rect x="330" y="163" width="20" height="92" fill="#b8c4d4" stroke="#94a3b8" strokeWidth="0.5"/>

              {/* ===== VIDRIO TRASERO ===== */}
              <path d="
                M 215 256
                C 230 259, 250 261, 272 262
                L 340 263
                L 408 262
                C 430 261, 450 259, 465 256
                L 470 255
                L 472 263
                L 469 294
                C 453 297, 431 299, 408 300
                L 340 301
                L 272 300
                C 249 299, 227 297, 211 294
                L 208 263
                L 210 255
                Z
              " fill="#bfdbfe" stroke="#93c5fd" strokeWidth="0.8" opacity="0.85"/>

              {/* ===== CAJUELA ===== */}
              <path d="
                M 211 297
                C 227 299, 249 301, 272 302
                L 340 303
                L 408 302
                C 431 301, 453 299, 469 297
                L 472 310
                C 476 325, 479 342, 480 357
                C 474 364, 461 370, 444 374
                C 418 380, 380 384, 340 385
                C 300 384, 262 380, 236 374
                C 219 370, 206 364, 200 357
                C 201 342, 204 325, 208 310
                Z
              " fill="#e8edf5" stroke="#94a3b8" strokeWidth="1"/>

              {/* ===== DEFENSA DELANTERA ===== */}
              <path d="
                M 255 32
                C 282 27, 312 24, 340 24
                C 368 24, 398 27, 425 32
                L 412 50
                C 390 44, 360 40, 340 40
                C 320 40, 290 44, 268 50
                Z
              " fill="#c8d4e3" stroke="#94a3b8" strokeWidth="1.2"/>

              {/* ===== DEFENSA TRASERA ===== */}
              <path d="
                M 200 358
                C 215 372, 265 390, 340 392
                C 415 390, 465 372, 480 358
                L 478 376
                C 461 389, 408 400, 340 400
                C 272 400, 219 389, 202 376
                Z
              " fill="#c8d4e3" stroke="#94a3b8" strokeWidth="1.2"/>

              {/* ===== SALPICADERA DELANTERA IZQ ===== */}
              <path d="
                M 158 118
                C 160 108, 168 95, 178 85
                C 186 76, 200 66, 215 60
                C 228 54, 248 49, 268 48
                L 268 115
                C 248 116, 228 118, 215 121
                Z
              " fill="#d4dce8" stroke="#94a3b8" strokeWidth="0.8"/>

              {/* ===== SALPICADERA DELANTERA DER ===== */}
              <path d="
                M 522 118
                C 520 108, 512 95, 502 85
                C 494 76, 480 66, 465 60
                C 452 54, 432 49, 412 48
                L 412 115
                C 432 116, 452 118, 465 121
                Z
              " fill="#d4dce8" stroke="#94a3b8" strokeWidth="0.8"/>

              {/* ===== SALPICADERA TRASERA IZQ ===== */}
              <path d="
                M 158 300
                C 160 318, 162 336, 166 350
                C 170 362, 180 374, 195 380
                C 204 363, 207 332, 210 298
                Z
              " fill="#d4dce8" stroke="#94a3b8" strokeWidth="0.8"/>

              {/* ===== SALPICADERA TRASERA DER ===== */}
              <path d="
                M 522 300
                C 520 318, 518 336, 514 350
                C 510 362, 500 374, 485 380
                C 476 363, 473 332, 470 298
                Z
              " fill="#d4dce8" stroke="#94a3b8" strokeWidth="0.8"/>

              {/* ===== ESPEJO IZQ ===== */}
              <path d="M 158 168 C 144 165, 136 173, 138 182 C 140 191, 152 195, 163 192 L 163 168 Z"
                fill="#d4dce8" stroke="#94a3b8" strokeWidth="0.8"/>

              {/* ===== ESPEJO DER ===== */}
              <path d="M 522 168 C 536 165, 544 173, 542 182 C 540 191, 528 195, 517 192 L 517 168 Z"
                fill="#d4dce8" stroke="#94a3b8" strokeWidth="0.8"/>

              {/* ===== RUEDA DELANTERA IZQ ===== */}
              <rect x="110" y="82" width="52" height="82" rx="10" fill="#475569" stroke="#334155" strokeWidth="1.2"/>
              <rect x="118" y="90" width="36" height="66" rx="7" fill="#64748b"/>
              <circle cx="136" cy="123" r="11" fill="#94a3b8"/>
              <circle cx="136" cy="123" r="5" fill="#64748b"/>

              {/* ===== RUEDA DELANTERA DER ===== */}
              <rect x="518" y="82" width="52" height="82" rx="10" fill="#475569" stroke="#334155" strokeWidth="1.2"/>
              <rect x="526" y="90" width="36" height="66" rx="7" fill="#64748b"/>
              <circle cx="544" cy="123" r="11" fill="#94a3b8"/>
              <circle cx="544" cy="123" r="5" fill="#64748b"/>

              {/* ===== RUEDA TRASERA IZQ ===== */}
              <rect x="110" y="258" width="52" height="82" rx="10" fill="#475569" stroke="#334155" strokeWidth="1.2"/>
              <rect x="118" y="266" width="36" height="66" rx="7" fill="#64748b"/>
              <circle cx="136" cy="299" r="11" fill="#94a3b8"/>
              <circle cx="136" cy="299" r="5" fill="#64748b"/>

              {/* ===== RUEDA TRASERA DER ===== */}
              <rect x="518" y="258" width="52" height="82" rx="10" fill="#475569" stroke="#334155" strokeWidth="1.2"/>
              <rect x="526" y="266" width="36" height="66" rx="7" fill="#64748b"/>
              <circle cx="544" cy="299" r="11" fill="#94a3b8"/>
              <circle cx="544" cy="299" r="5" fill="#64748b"/>

              {/* ===== MARCADORES DE DAÑOS ===== */}
              {danos.map((d, i) => (
                <g key={i}>
                  <circle cx={d.x} cy={d.y} r="9" fill="#ef4444" stroke="white" strokeWidth="2" opacity="0.92"/>
                  <text x={d.x} y={d.y + 4} textAnchor="middle" fontSize="8" fill="white" fontWeight="bold">{i + 1}</text>
                </g>
              ))}

              {/* Marcador pendiente */}
              {danoPendiente && (
                <circle cx={danoPendiente.x} cy={danoPendiente.y} r="9" fill="#f97316" stroke="white" strokeWidth="2" opacity="0.85"/>
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