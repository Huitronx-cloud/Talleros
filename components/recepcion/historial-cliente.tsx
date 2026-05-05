'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Cliente } from '@/types'
import { Car, Clock, DollarSign, ClipboardList, AlertCircle, Loader2 } from 'lucide-react'
import BadgeEstado from '@/components/ordenes/badge-estado'

interface OrdenResumen {
  id: string
  numero_orden: number
  estado: string
  total: number
  descripcion_problema: string | null
  created_at: string
  cobrado: boolean
}

interface Props {
  cliente: Cliente
}

export default function HistorialCliente({ cliente }: Props) {
  const supabase = createClient()
  const [ordenes, setOrdenes]   = useState<OrdenResumen[]>([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    const cargar = async () => {
      setCargando(true)
      const { data } = await supabase
        .from('ordenes')
        .select('id, numero_orden, estado, total, descripcion_problema, created_at, cobrado')
        .eq('cliente_id', cliente.id)
        .order('created_at', { ascending: false })
        .limit(5)
      setOrdenes((data ?? []) as OrdenResumen[])
      setCargando(false)
    }
    cargar()
  }, [cliente.id])

  const totalGastado  = ordenes.filter(o => o.estado === 'entregado').reduce((a, o) => a + o.total, 0)
  const ordenActiva   = ordenes.find(o => o.estado !== 'entregado')
  const ultimaVisita  = ordenes[0]?.created_at

  if (cargando) {
    return (
      <div className="flex justify-center py-6">
        <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="space-y-4">

      {/* Orden activa — alerta */}
      {ordenActiva && (
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
          <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-amber-800">Tiene una orden activa</p>
            <p className="text-xs text-amber-600">
              #{String(ordenActiva.numero_orden).padStart(4, '0')} —{' '}
              <span className="capitalize">{ordenActiva.estado.replace('_', ' ')}</span>
            </p>
          </div>
        </div>
      )}

      {/* Stats rápidos */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-gray-50 rounded-lg p-2.5 text-center">
          <p className="text-lg font-bold text-gray-900">{ordenes.length}</p>
          <p className="text-xs text-gray-500">Visitas</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-2.5 text-center">
          <p className="text-lg font-bold text-gray-900">
            ${totalGastado.toLocaleString('es-MX', { maximumFractionDigits: 0 })}
          </p>
          <p className="text-xs text-gray-500">Total gastado</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-2.5 text-center">
          <p className="text-lg font-bold text-gray-900">
            {ultimaVisita
              ? new Date(ultimaVisita).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })
              : '—'
            }
          </p>
          <p className="text-xs text-gray-500">Última visita</p>
        </div>
      </div>

      {/* Órdenes recientes */}
      {ordenes.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Últimas visitas</p>
          {ordenes.map(o => (
            <div key={o.id} className="flex items-center gap-3 bg-gray-50 rounded-lg px-3 py-2.5">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-gray-400">
                    #{String(o.numero_orden).padStart(4, '0')}
                  </span>
                  <BadgeEstado estado={o.estado as any} />
                  {!o.cobrado && o.estado === 'entregado' && (
                    <span className="text-xs bg-red-100 text-red-600 font-semibold px-1.5 py-0.5 rounded">
                      Sin cobrar
                    </span>
                  )}
                </div>
                {o.descripcion_problema && (
                  <p className="text-xs text-gray-500 mt-0.5 truncate">{o.descripcion_problema}</p>
                )}
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xs font-bold text-gray-900">
                  ${o.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-gray-400">
                  {new Date(o.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-4">
          <ClipboardList className="w-6 h-6 text-gray-200 mx-auto mb-1" />
          <p className="text-xs text-gray-400">Primera visita de este cliente</p>
        </div>
      )}
    </div>
  )
}