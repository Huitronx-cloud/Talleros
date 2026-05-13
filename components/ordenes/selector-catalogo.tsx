'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BookOpen, Search, X, Plus } from 'lucide-react'
import { ServicioItem } from '@/types'
import { formatMoney } from '@/lib/utils'

interface Servicio {
  id: string
  nombre: string
  descripcion: string | null
  precio: number
  categoria: string | null
  tiempo_estimado: number | null
}

interface Props {
  tallerId: string
  onSeleccionar: (servicio: ServicioItem) => void
  moneda?: string | null
}

export default function SelectorCatalogo({ tallerId, onSeleccionar, moneda }: Props) {
  const supabase  = createClient()
  const [abierto, setAbierto]     = useState(false)
  const [servicios, setServicios] = useState<Servicio[]>([])
  const [busqueda, setBusqueda]   = useState('')
  const [cargando, setCargando]   = useState(false)

  useEffect(() => {
    if (!abierto || servicios.length > 0) return
    const cargar = async () => {
      setCargando(true)
      const { data } = await supabase
        .from('catalogo_servicios')
        .select('*')
        .eq('taller_id', tallerId)
        .eq('activo', true)
        .order('categoria')
        .order('nombre')
      setServicios(data ?? [])
      setCargando(false)
    }
    cargar()
  }, [abierto])

  const filtrados = servicios.filter(s =>
    !busqueda ||
    s.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    (s.categoria ?? '').toLowerCase().includes(busqueda.toLowerCase())
  )

  const handleSeleccionar = (s: Servicio) => {
    onSeleccionar({
      descripcion:     s.nombre,
      cantidad:        1,
      precio_unitario: s.precio,
      total:           s.precio,
    })
    setAbierto(false)
    setBusqueda('')
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setAbierto(!abierto)}
        className="flex items-center gap-1.5 text-sm text-purple-600 font-medium hover:text-purple-700"
      >
        <BookOpen className="w-4 h-4" /> Del catálogo
      </button>

      {abierto && (
        <div className="absolute left-0 top-8 z-20 w-80 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          <div className="p-3 border-b border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold text-gray-700">Seleccionar del catálogo</p>
              <button onClick={() => setAbierto(false)}>
                <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
              </button>
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                placeholder="Buscar servicio..."
                className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                autoFocus
              />
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto">
            {cargando ? (
              <p className="text-xs text-gray-400 text-center py-6">Cargando...</p>
            ) : filtrados.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-6">
                {busqueda ? 'Sin resultados' : 'No hay servicios en el catálogo'}
              </p>
            ) : (
              filtrados.map(s => (
                <button
                  key={s.id}
                  onClick={() => handleSeleccionar(s)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-purple-50 text-left border-b border-gray-50 last:border-0 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{s.nombre}</p>
                    {s.categoria && (
                      <p className="text-xs text-gray-400 mt-0.5">{s.categoria}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                    <span className="text-sm font-bold text-gray-900">
                      {formatMoney(s.precio, moneda)}
                    </span>
                    <Plus className="w-4 h-4 text-purple-500" />
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}