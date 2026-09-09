'use client'

import { useState, useEffect } from 'react'
import { Info, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const CLAVE = 'talleros:caducados-visto'

/**
 * Le explica al taller qué pasó con los mensajes viejos que desaparecieron.
 *
 * Sin esto, un taller con 81 mensajes en cola abre un día y ve 27. La reacción
 * normal no es "qué bien, limpiaron": es "¿y los otros? ¿el sistema se comió
 * mis mensajes?". Y como el número además se puso rojo, la lectura fácil es
 * que la aplicación se puso en su contra.
 *
 * No se puede depender de que lea un correo. Tiene que estar en la pantalla,
 * la primera vez que entre, diciendo tres cosas en este orden:
 *
 *   1. Qué pasó y por qué esos mensajes ya no servían.
 *   2. Que NO fue culpa suya — la tarjeta estaba enterrada donde nadie la
 *      veía, y eso es un fallo nuestro.
 *   3. Que lo que queda sí vale la pena.
 *
 * Se cierra con la X y no vuelve. Si no se puede guardar que ya lo vio
 * —navegador privado, almacenamiento bloqueado— se enseña otra vez, que es
 * mucho mejor que no enseñarlo nunca.
 */
export default function AvisoCaducados() {
  const [cuantos, setCuantos] = useState(0)
  const [visible, setVisible] = useState(false)
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
        .select('taller_id')
        .eq('id', session.user.id)
        .single()

      if (!usuario?.taller_id) return

      const { count } = await supabase
        .from('mensajes_pendientes')
        .select('id', { count: 'exact', head: true })
        .eq('taller_id', usuario.taller_id)
        .eq('estado', 'caducado')

      if (count && count > 0) {
        setCuantos(count)
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
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4 flex items-start gap-3">
      <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-blue-900 mb-1">
          Retiramos {cuantos} {cuantos === 1 ? 'mensaje antiguo' : 'mensajes antiguos'} de esta lista
        </p>
        <p className="text-sm text-blue-800 leading-relaxed">
          Eran avisos de vehículos que entregaste hace semanas y recordatorios de citas
          que ya pasaron. Mandarlos hoy te dejaría peor con tus clientes que no mandarlos.
        </p>
        <p className="text-sm text-blue-800 leading-relaxed mt-2">
          <strong>No fue algo que hicieras mal.</strong> Estaban en una parte del tablero
          que casi no se veía, y eso lo arreglamos nosotros. Los que quedan aquí abajo son
          los que todavía vale la pena enviar.
        </p>
        <button
          onClick={cerrar}
          className="text-xs font-semibold text-blue-700 hover:text-blue-900 mt-3 underline underline-offset-2"
        >
          Entendido
        </button>
      </div>
      <button
        onClick={cerrar}
        aria-label="Cerrar aviso"
        className="text-blue-400 hover:text-blue-600 flex-shrink-0"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
