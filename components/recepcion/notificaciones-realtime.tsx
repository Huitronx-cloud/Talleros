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
    let canal: ReturnType<typeof supabase.channel> | null = null
    let cancelado = false

    /**
     * Las que YA estaban listas cuando se abrió la pantalla.
     *
     * Hace de línea base. Antes esto miraba `payload.old.estado` para saber si
     * la orden acababa de cambiar a "listo", y no podía funcionar: la replica
     * identity de `ordenes` es la de por defecto, así que el registro viejo que
     * manda Postgres trae SOLO la clave primaria. `vieja.estado` era siempre
     * undefined, y `undefined !== 'listo'` es cierto — o sea que el aviso
     * saltaba en cualquier actualización de una orden ya lista: cambiar una
     * nota de un coche entregado la semana pasada reventaba un "¡Orden lista!"
     * en la cara de recepción.
     *
     * Se resuelve aquí y no con `replica identity full` a propósito: eso haría
     * que cada UPDATE escribiera la fila vieja entera en el WAL —incluido el
     * jsonb de servicios— para averiguar un dato que el navegador ya puede
     * saber por su cuenta.
     */
    const yaEstabanListas = new Set<string>()

    async function arrancar() {
      const { data: listas } = await supabase
        .from('ordenes')
        .select('id')
        .eq('taller_id', tallerId)
        .eq('estado', 'listo')

      if (cancelado) return
      for (const o of listas ?? []) yaEstabanListas.add(o.id)

      canal = supabase
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
            if (nueva.estado !== 'listo') {
              // Salió de "listo": si vuelve a entrar, vuelve a avisar.
              yaEstabanListas.delete(nueva.id)
              return
            }
            // Ya la habíamos contado: esto es otra edición, no un coche nuevo
            // que acaba de quedar listo.
            if (yaEstabanListas.has(nueva.id)) return
            yaEstabanListas.add(nueva.id)

            const { data: orden } = await supabase
              .from('ordenes')
              .select('id, numero_orden, clientes(nombre), vehiculo_marca, vehiculo_modelo')
              .eq('id', nueva.id)
              .single()

            if (orden && !cancelado) {
              setAlertas(prev => [orden as unknown as OrdenLista, ...prev])
            }
          }
        )
        .subscribe()
    }
    arrancar()

    return () => {
      cancelado = true
      if (canal) supabase.removeChannel(canal)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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