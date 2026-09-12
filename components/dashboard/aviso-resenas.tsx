'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Star } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const CLAVE = 'talleros:resenas-visto'
const ROLES = ['propietario', 'admin']

/**
 * Le dice al taller lo que está dejando sobre la mesa por no tener su enlace
 * de Google.
 *
 * ── Por qué existe ──────────────────────────────────────────────────────────
 *
 * Las solicitudes de reseña están construidas y funcionan: al entregar un
 * coche, TallerOS arma el mensaje con el nombre del cliente y su vehículo y lo
 * deja en Pendientes. Pero necesitan un `google_review_url`, y sin él
 * `enviarResenaOrden` se sale por la puerta de atrás en la primera línea.
 *
 * El resultado medido: de 83 talleres reales, 10 han entregado coches y solo 2
 * tienen algo puesto en ese campo. En toda la historia de la plataforma no ha
 * salido ni una solicitud de reseña. Uno de esos talleres lleva 57 entregas.
 *
 * Buscar la ficha ya es un toque desde que existe "¿Es este tu taller?". Lo que
 * falta es que alguien se entere de que esa pantalla existe.
 *
 * ── Por qué una tarjeta y no una campana ───────────────────────────────────
 *
 * La campana de Pendientes cuenta cosas que esperan a que alguien las haga:
 * sube cuando entra trabajo y baja cuando se despacha. Esto es un paso único.
 * Una campana marcaría 1 para siempre hasta resolverlo, y un número que no baja
 * deja de ser un aviso y pasa a ser un reproche.
 *
 * ── Las reglas que la hacen no molestar ────────────────────────────────────
 *
 *   · No aparece hasta la primera entrega. Antes es abstracto.
 *   · Se cierra y no vuelve.
 *   · Desaparece sola en cuanto hay enlace, sin que nadie la descarte.
 *   · Nunca se mete en el flujo de entrega: con el cliente delante y el taller
 *     cobrando, aquí no sale nada. Eso quedó decidido.
 *
 * Ámbar y no rojo a propósito: no está roto nada, es una oportunidad que se
 * escapa. El rojo del tablero está reservado para lo que va mal.
 */
export default function AvisoResenas() {
  const [entregados, setEntregados] = useState(0)
  const [visible, setVisible]       = useState(false)
  const supabase = createClient()

  useEffect(() => {
    try {
      if (localStorage.getItem(CLAVE)) return
    } catch { /* almacenamiento bloqueado: se enseña igual */ }

    async function cargar() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) return

      const { data: usuario } = await supabase
        .from('usuarios')
        .select('taller_id, rol')
        .eq('id', session.user.id)
        .single()

      if (!usuario?.taller_id || !ROLES.includes(usuario.rol)) return

      // Si ya tiene enlace no hay nada que contarle. Se mira ANTES de contar
      // entregas: es la condición que apaga la tarjeta para siempre.
      const { data: config, error: errorConfig } = await supabase
        .from('resenas_config')
        .select('google_review_url')
        .eq('taller_id', usuario.taller_id)
        .maybeSingle()

      // supabase-js no lanza. Sin esto, un fallo de lectura se vería igual que
      // "no tiene enlace" y le saldría la tarjeta a un taller que ya lo resolvió
      // — que es justo el caso que prometimos que no pasaría.
      if (errorConfig) {
        console.error('[aviso-resenas] no se pudo leer la configuración:', errorConfig.message)
        return
      }
      if (config?.google_review_url?.trim()) return

      const { count, error: errorOrdenes } = await supabase
        .from('ordenes')
        .select('id', { count: 'exact', head: true })
        .eq('taller_id', usuario.taller_id)
        .eq('estado', 'entregado')
        .eq('es_ejemplo', false)

      if (errorOrdenes) {
        console.error('[aviso-resenas] no se pudieron contar las entregas:', errorOrdenes.message)
        return
      }

      // Sin entregas no se enseña: pedir reseñas antes de haber entregado un
      // coche es una idea abstracta, y una tarjeta que no significa nada el
      // primer día es una tarjeta que se cierra sin leer.
      if ((count ?? 0) > 0) {
        setEntregados(count ?? 0)
        setVisible(true)
      }
    }
    cargar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function cerrar() {
    setVisible(false)
    try { localStorage.setItem(CLAVE, '1') } catch { /* da igual */ }
  }

  if (!visible) return null

  return (
    <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 sm:p-5 flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
          <Star className="w-5 h-5 text-amber-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-base font-bold text-amber-900 leading-tight">
            Estás dejando reseñas sobre la mesa
          </p>
          <p className="text-sm text-amber-800 mt-1 leading-relaxed">
            Has entregado{' '}
            <strong>
              {entregados} {entregados === 1 ? 'vehículo' : 'vehículos'}
            </strong>{' '}
            y no le has pedido reseña a ninguno. TallerOS prepara el mensaje solo;
            solo falta saber cuál es tu taller en Google.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Link
          href="/resenas"
          className="flex-1 text-center bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold py-2.5 rounded-xl transition-colors"
        >
          Buscar mi taller
        </Link>
        <button
          onClick={cerrar}
          className="text-sm font-semibold text-amber-800 hover:text-amber-900 px-2 py-2.5"
        >
          Ahora no
        </button>
      </div>
    </div>
  )
}
