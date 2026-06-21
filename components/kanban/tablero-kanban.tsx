'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Car, Clock, AlertTriangle, User, Wrench, Package, CheckCircle2 } from 'lucide-react'
import { Orden, EstadoOrden } from '@/types'
import { cambiarEstado } from '@/app/(dashboard)/ordenes/actions'

const COLUMNAS: { id: EstadoOrden; label: string; color: string; bg: string; border: string; icono: any }[] = [
  { id: 'recibido',   label: 'Recibido',   color: 'text-gray-600',  bg: 'bg-gray-50',   border: 'border-gray-200',  icono: Package      },
  { id: 'en_proceso', label: 'En proceso', color: 'text-blue-600',  bg: 'bg-blue-50',   border: 'border-blue-200',  icono: Wrench       },
  { id: 'listo',      label: 'Listo',      color: 'text-green-600', bg: 'bg-green-50',  border: 'border-green-200', icono: CheckCircle2 },
]

function diasRetraso(fechaPrometida: string | null): number | null {
  if (!fechaPrometida) return null
  const hoy      = new Date()
  const prometida = new Date(fechaPrometida + 'T12:00:00')
  const diff     = Math.floor((hoy.getTime() - prometida.getTime()) / (1000 * 60 * 60 * 24))
  return diff > 0 ? diff : null
}

function TarjetaOrden({
  orden,
  onDragStart,
}: {
  orden: Orden
  onDragStart?: (e: React.DragEvent, ordenId: string) => void
}) {
  const retraso = diasRetraso(orden.fecha_prometida)
  const cliente = orden.clientes as { nombre: string; telefono: string | null; foto_vehiculo_url?: string | null } | null

  return (
    <Link href={`/ordenes/${orden.id}`}>
      <div
        draggable={!!onDragStart}
        onDragStart={onDragStart ? e => onDragStart(e, orden.id) : undefined}
        className={`bg-white rounded-xl border p-4 cursor-pointer hover:shadow-md transition-all select-none ${
          retraso ? 'border-red-200 bg-red-50/30' : 'border-gray-200'
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-mono font-bold text-gray-400">
            #{String(orden.numero_orden).padStart(4, '0')}
          </span>
          {retraso && (
            <span className="flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
              <AlertTriangle className="w-3 h-3" />
              {retraso}d retraso
            </span>
          )}
        </div>

        {cliente?.foto_vehiculo_url && (
          <div className="mb-2 rounded-lg overflow-hidden border border-gray-100" style={{ height: 80 }}>
            <img
              src={cliente.foto_vehiculo_url}
              alt="Vehículo"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
        )}

        <div className="flex items-start gap-2 mb-2">
          <Car className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 leading-tight">
              {[orden.vehiculo_marca, orden.vehiculo_modelo].filter(Boolean).join(' ') || 'Sin vehículo'}
            </p>
            {orden.placas && (
              <span className="font-mono text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded mt-0.5 inline-block">
                {orden.placas}
              </span>
            )}
          </div>
        </div>

        {cliente && (
          <div className="flex items-center gap-1.5 mb-2">
            <User className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-xs text-gray-600 truncate">{cliente.nombre}</span>
          </div>
        )}

        {orden.descripcion_problema && (
          <p className="text-xs text-gray-400 line-clamp-2 mb-3">{orden.descripcion_problema}</p>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          {orden.mecanico_asignado ? (
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-blue-600 text-xs font-bold">
                  {orden.mecanico_asignado.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="text-xs text-gray-500 truncate max-w-[80px]">{orden.mecanico_asignado}</span>
            </div>
          ) : (
            <span className="text-xs text-gray-300">Sin mecánico</span>
          )}

          {orden.fecha_prometida && (
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-gray-400" />
              <span className={`text-xs ${retraso ? 'text-red-600 font-semibold' : 'text-gray-400'}`}>
                {new Date(orden.fecha_prometida + 'T12:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
              </span>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}

// ── VISTA MÓVIL (tabs) ──
function KanbanMovil({ ordenes }: { ordenes: Orden[] }) {
  const router = useRouter()
  const [tabActivo, setTabActivo]   = useState<EstadoOrden>('recibido')
  const [moviendo, setMoviendo]     = useState<string | null>(null)
  const [error, setError]           = useState('')

  const tarjetas = ordenes.filter(o => o.estado === tabActivo)

  const moverOrden = async (ordenId: string, nuevoEstado: EstadoOrden) => {
    setMoviendo(ordenId)
    setError('')
    const resultado = await cambiarEstado(ordenId, nuevoEstado)
    setMoviendo(null)
    if (resultado.error) {
      setError(resultado.error)
      return
    }
    router.refresh()
  }

  return (
    <div className="space-y-3">
      {error && (
        <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
      )}
      {/* Tabs */}
      <div className="flex rounded-xl border border-gray-200 bg-gray-50 p-1 gap-1">
        {COLUMNAS.map(col => {
          const count  = ordenes.filter(o => o.estado === col.id).length
          const activo = tabActivo === col.id
          const Icono  = col.icono
          return (
            <button
              key={col.id}
              onClick={() => setTabActivo(col.id)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                activo
                  ? 'bg-white shadow-sm ' + col.color
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Icono className="w-4 h-4" />
              <span>{col.label}</span>
              <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                activo ? col.bg + ' ' + col.color : 'bg-gray-100 text-gray-400'
              }`}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Tarjetas */}
      <div className="space-y-3">
        {tarjetas.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">
            Sin órdenes en esta columna
          </div>
        ) : (
          tarjetas.map(orden => {
            const estadoActual = orden.estado as EstadoOrden
            const colIdx       = COLUMNAS.findIndex(c => c.id === estadoActual)
            const anterior     = colIdx > 0 ? COLUMNAS[colIdx - 1] : null
            const siguiente    = colIdx < COLUMNAS.length - 1 ? COLUMNAS[colIdx + 1] : null

            return (
              <div key={orden.id} className="space-y-2">
                <TarjetaOrden orden={orden} />
                {/* Botones de mover */}
                <div className="flex gap-2 px-1">
                  {anterior && (
                    <button
                      onClick={() => moverOrden(orden.id, anterior.id)}
                      disabled={moviendo === orden.id}
                      className={`flex-1 py-1.5 text-xs font-medium rounded-lg border transition-colors ${anterior.border} ${anterior.color} bg-white hover:${anterior.bg}`}
                    >
                      {moviendo === orden.id ? '...' : `← ${anterior.label}`}
                    </button>
                  )}
                  {siguiente && (
                    <button
                      onClick={() => moverOrden(orden.id, siguiente.id)}
                      disabled={moviendo === orden.id}
                      className={`flex-1 py-1.5 text-xs font-medium rounded-lg border transition-colors ${siguiente.border} ${siguiente.color} bg-white hover:${siguiente.bg}`}
                    >
                      {moviendo === orden.id ? '...' : `${siguiente.label} →`}
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
function KanbanDesktop({ ordenes }: { ordenes: Orden[] }) {
  const router = useRouter()
  const [ordenesState, setOrdenesState] = useState<Orden[]>(ordenes)
  const [arrastrando, setArrastrando]   = useState<string | null>(null)
  const [sobreColumna, setSobreColumna] = useState<EstadoOrden | null>(null)
  const [moviendo, setMoviendo]         = useState<string | null>(null)
  const [error, setError]               = useState('')

  const handleDragStart = (e: React.DragEvent, ordenId: string) => {
    e.dataTransfer.setData('ordenId', ordenId)
    setArrastrando(ordenId)
  }

  const handleDragOver = (e: React.DragEvent, columnaId: EstadoOrden) => {
    e.preventDefault()
    setSobreColumna(columnaId)
  }

  const handleDrop = async (e: React.DragEvent, nuevoEstado: EstadoOrden) => {
    e.preventDefault()
    const ordenId = e.dataTransfer.getData('ordenId')
    const orden   = ordenesState.find(o => o.id === ordenId)
    if (!orden || orden.estado === nuevoEstado) {
      setArrastrando(null)
      setSobreColumna(null)
      return
    }

    const estadoAnterior = orden.estado
    setError('')
    setOrdenesState(prev => prev.map(o => o.id === ordenId ? { ...o, estado: nuevoEstado } : o))
    setArrastrando(null)
    setSobreColumna(null)
    setMoviendo(ordenId)
    const resultado = await cambiarEstado(ordenId, nuevoEstado)
    setMoviendo(null)

    if (resultado.error) {
      // Revertimos el cambio óptimista si la actualización falló de verdad
      setOrdenesState(prev => prev.map(o => o.id === ordenId ? { ...o, estado: estadoAnterior } : o))
      setError(resultado.error)
      return
    }
    router.refresh()
  }

  const handleDragEnd = () => {
    setArrastrando(null)
    setSobreColumna(null)
  }

  return (
    <div className="space-y-3">
      {error && (
        <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
      )}
      <div className="flex gap-4 overflow-x-auto pb-4">
      {COLUMNAS.map(col => {
        const tarjetas = ordenesState.filter(o => o.estado === col.id)
        const esSobre  = sobreColumna === col.id
        const Icono    = col.icono

        return (
          <div
            key={col.id}
            onDragOver={e => handleDragOver(e, col.id)}
            onDrop={e => handleDrop(e, col.id)}
            onDragLeave={() => setSobreColumna(null)}
            className={`flex-shrink-0 w-80 rounded-2xl border-2 transition-all ${
              esSobre ? `${col.border} ${col.bg} shadow-lg scale-[1.01]` : 'border-gray-200 bg-gray-50'
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
                  esSobre ? col.border : 'border-gray-200'
                }`}>
                  <p className="text-xs text-gray-400">{esSobre ? 'Suelta aquí' : 'Sin órdenes'}</p>
                </div>
              ) : (
                tarjetas.map(orden => (
                  <div
                    key={orden.id}
                    className={`transition-all ${
                      arrastrando === orden.id ? 'opacity-40 scale-95' : ''
                    } ${moviendo === orden.id ? 'animate-pulse' : ''}`}
                  >
                    <TarjetaOrden orden={orden} onDragStart={handleDragStart} />
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
    </div>
  )
}

// ── COMPONENTE PRINCIPAL ──
export default function TableroKanban({ ordenes }: { ordenes: Orden[] }) {
  return (
    <>
      {/* Móvil */}
      <div className="md:hidden">
        <KanbanMovil ordenes={ordenes} />
      </div>
      {/* Desktop */}
      <div className="hidden md:block">
        <KanbanDesktop ordenes={ordenes} />
      </div>
    </>
  )
}