'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Car, Clock, AlertTriangle, User, Wrench, Package, CheckCircle2 } from 'lucide-react'
import { Orden, EstadoOrden } from '@/types'
import { cambiarEstado } from '@/app/(dashboard)/ordenes/actions'

const COLUMNAS: { id: EstadoOrden; label: string; color: string; bg: string; border: string; icono: any }[] = [
  { id: 'recibido',   label: 'Recibido',   color: 'text-gray-600',   bg: 'bg-gray-50',    border: 'border-gray-200', icono: Package      },
  { id: 'en_proceso', label: 'En proceso', color: 'text-blue-600',   bg: 'bg-blue-50',    border: 'border-blue-200', icono: Wrench       },
  { id: 'listo',      label: 'Listo',      color: 'text-green-600',  bg: 'bg-green-50',   border: 'border-green-200',icono: CheckCircle2 },
]

function diasRetraso(fechaPrometida: string | null): number | null {
  if (!fechaPrometida) return null
  const hoy = new Date()
  const prometida = new Date(fechaPrometida + 'T12:00:00')
  const diff = Math.floor((hoy.getTime() - prometida.getTime()) / (1000 * 60 * 60 * 24))
  return diff > 0 ? diff : null
}

function TarjetaOrden({
  orden,
  onDragStart,
}: {
  orden: Orden
  onDragStart: (e: React.DragEvent, ordenId: string) => void
}) {
  const retraso = diasRetraso(orden.fecha_prometida)
  const cliente = orden.clientes as { nombre: string; telefono: string | null } | null

  return (
    <Link href={`/ordenes/${orden.id}`}>
      <div
        draggable
        onDragStart={e => onDragStart(e, orden.id)}
        className={`bg-white rounded-xl border p-4 cursor-grab active:cursor-grabbing hover:shadow-md transition-all select-none ${
          retraso ? 'border-red-200 bg-red-50/30' : 'border-gray-200'
        }`}
      >
        {/* Número de orden y alerta */}
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

        {/* Vehículo */}
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

        {/* Cliente */}
        {cliente && (
          <div className="flex items-center gap-1.5 mb-2">
            <User className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-xs text-gray-600 truncate">{cliente.nombre}</span>
          </div>
        )}

        {/* Descripción */}
        {orden.descripcion_problema && (
          <p className="text-xs text-gray-400 line-clamp-2 mb-3">{orden.descripcion_problema}</p>
        )}

        {/* Footer */}
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

export default function TableroKanban({ ordenes }: { ordenes: Orden[] }) {
  const router = useRouter()
  const [ordenesState, setOrdenesState] = useState<Orden[]>(ordenes)
  const [arrastrando, setArrastrando]   = useState<string | null>(null)
  const [sobreColumna, setSobreColumna] = useState<EstadoOrden | null>(null)
  const [moviendo, setMoviendo]         = useState<string | null>(null)

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
    const orden = ordenesState.find(o => o.id === ordenId)
    if (!orden || orden.estado === nuevoEstado) {
      setArrastrando(null)
      setSobreColumna(null)
      return
    }

    // Actualizar UI optimistamente
    setOrdenesState(prev =>
      prev.map(o => o.id === ordenId ? { ...o, estado: nuevoEstado } : o)
    )
    setArrastrando(null)
    setSobreColumna(null)
    setMoviendo(ordenId)

    // Persistir en Supabase
    await cambiarEstado(ordenId, nuevoEstado)
    setMoviendo(null)
    router.refresh()
  }

  const handleDragEnd = () => {
    setArrastrando(null)
    setSobreColumna(null)
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 md:mx-0 md:px-0">
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
            className={`flex-shrink-0 w-72 md:w-80 rounded-2xl border-2 transition-all ${
              esSobre
                ? `${col.border} ${col.bg} shadow-lg scale-[1.01]`
                : 'border-gray-200 bg-gray-50'
            }`}
          >
            {/* Header columna */}
            <div className={`px-4 py-3 rounded-t-xl flex items-center justify-between ${col.bg}`}>
              <div className="flex items-center gap-2">
                <Icono className={`w-4 h-4 ${col.color}`} />
                <span className={`text-sm font-bold ${col.color}`}>{col.label}</span>
              </div>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${col.bg} ${col.color} border ${col.border}`}>
                {tarjetas.length}
              </span>
            </div>

            {/* Tarjetas */}
            <div className="p-3 space-y-3 min-h-[200px]">
              {tarjetas.length === 0 ? (
                <div className={`flex items-center justify-center h-24 rounded-xl border-2 border-dashed transition-all ${
                  esSobre ? col.border : 'border-gray-200'
                }`}>
                  <p className="text-xs text-gray-400">
                    {esSobre ? 'Suelta aquí' : 'Sin órdenes'}
                  </p>
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

              {/* Zona de drop visible cuando arrastras */}
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