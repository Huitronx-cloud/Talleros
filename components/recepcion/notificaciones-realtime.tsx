'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Bell, X, ChevronRight } from 'lucide-react'
import Link from 'next/link'

interface OrdenLista {
  id: string
  numero_orden: number
  clientes: { nombre: string } | null
  vehiculo_marca: string | null
  vehiculo_modelo: string | null
}

interface Props {
  tallerId: string
}

export default function NotificacionesRealtime({ tallerId }: Props) {
  const supabase = createClient()
  const [alertas, setAlertas] = useState<OrdenLista[]>([])
  const [vistas, setVistas]   = useState<Set<string>>(new Set())

  useEffect(() => {
    // Escuchar cambios en órdenes del taller
    const channel = supabase
      .channel(`ordenes-listas-${tallerId}`)
      .on(
        'postgres_changes',
        {
          event:  'UPDATE',
          schema: 'public',
          table:  'ordenes',
          filter: `taller_id=eq.${tallerId}`,
        },
        async (payload) => {
          const nueva = payload.new as any
          const vieja = payload.old as any

          // Solo cuando cambia a estado "listo"
          if (nueva.estado === 'listo' && vieja.estado !== 'listo') {
            // Obtener nombre del cliente
            const { data: orden } = await supabase
              .from('ordenes')
              .select('id, numero_orden, clientes(nombre), vehiculo_marca, vehiculo_modelo')
              .eq('id', nueva.id)
              .single()

            if (orden) {
              setAlertas(prev => [orden as unknown as OrdenLista, ...prev])
            }
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [tallerId])

  const alertasVisibles = alertas.filter(a => !vistas.has(a.id))

  if (alertasVisibles.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full">
      {alertasVisibles.map(orden => (
        <div
          key={orden.id}
          className="bg-white border-2 border-green-500 rounded-xl shadow-lg p-4 flex items-start gap-3 animate-in slide-in-from-right"
        >
          {/* Ícono */}
          <div className="w-9 h-9 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
            <Bell className="w-4 h-4 text-green-600" />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-900">
              ¡Orden lista para entregar!
            </p>
            <p className="text-xs text-gray-600 mt-0.5">
              #{String(orden.numero_orden).padStart(4, '0')} —{' '}
              {(orden.clientes as any)?.nombre ?? 'Sin cliente'}
            </p>
            {(orden.vehiculo_marca || orden.vehiculo_modelo) && (
              <p className="text-xs text-gray-400 mt-0.5">
                {[orden.vehiculo_marca, orden.vehiculo_modelo].filter(Boolean).join(' ')}
              </p>
            )}
            <Link
              href={`/ordenes/${orden.id}`}
              onClick={() => setVistas(prev => new Set([...prev, orden.id]))}
              className="inline-flex items-center gap-1 text-xs text-green-600 font-semibold mt-2 hover:text-green-700"
            >
              Ver orden <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          {/* Cerrar */}
          <button
            onClick={() => setVistas(prev => new Set([...prev, orden.id]))}
            className="text-gray-400 hover:text-gray-600 flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  )
}