'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { MessageCircle, ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const ROLES_PERMITIDOS = ['propietario', 'admin', 'recepcion']

/** Días enteros que lleva esperando el más antiguo. */
function diasEsperando(fecha: string): number {
  const ms = Date.now() - new Date(fecha).getTime()
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)))
}

/**
 * El aviso de mensajes pendientes en el tablero.
 *
 * No es un módulo más de la cuadrícula, y es a propósito: si se parece a los
 * demás se lee como "una función que existe" en vez de "algo que hay que
 * hacer hoy". Lleva el número dentro de un círculo verde de WhatsApp, ocupa el
 * ancho completo y va lo primero.
 *
 * La lista entera ya no vive aquí. Con cincuenta mensajes en cola tapaba el
 * tablero, que es justo lo que el dueño pidió evitar: se abre en /pendientes.
 *
 * Si no hay nada pendiente no se pinta nada. Un cero en un círculo es ruido.
 */
export default function AvisoPendientes() {
  const [total, setTotal]     = useState(0)
  const [dias, setDias]       = useState(0)
  const supabase = createClient()

  useEffect(() => {
    async function cargar() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) return

      const { data: usuario } = await supabase
        .from('usuarios')
        .select('taller_id, rol')
        .eq('id', session.user.id)
        .single()

      if (!usuario?.taller_id || !ROLES_PERMITIDOS.includes(usuario.rol)) return

      // Solo el conteo y la fecha del más antiguo: la lista se carga en su
      // propia pantalla, no hace falta traerla aquí.
      const { data, count } = await supabase
        .from('mensajes_pendientes')
        .select('created_at', { count: 'exact' })
        .eq('taller_id', usuario.taller_id)
        .eq('estado', 'pendiente')
        .order('created_at', { ascending: true })
        .limit(1)

      if (count && count > 0) {
        setTotal(count)
        if (data?.[0]) setDias(diasEsperando(data[0].created_at))
      }
    }
    cargar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (total === 0) return null

  return (
    <Link
      href="/pendientes"
      className="flex items-center gap-4 bg-white rounded-2xl border-2 p-4 sm:p-5 transition-colors hover:bg-gray-50"
      style={{ borderColor: '#25D366' }}
    >
      {/* El círculo. Es lo que hace que no se lea como un módulo más. */}
      <div
        className="relative flex items-center justify-center w-16 h-16 rounded-full flex-shrink-0"
        style={{ background: '#25D366' }}
      >
        <span className="text-2xl font-bold text-white leading-none">{total}</span>
        <span className="absolute -bottom-1 -right-1 flex items-center justify-center w-7 h-7 rounded-full bg-white border border-gray-200">
          <MessageCircle className="w-4 h-4" style={{ color: '#25D366' }} />
        </span>
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-base font-bold text-gray-900 leading-tight">
          {total === 1 ? 'Tienes 1 mensaje por enviar' : `Tienes ${total} mensajes por enviar`}
        </p>
        <p className="text-sm text-gray-500 mt-0.5 leading-snug">
          {dias >= 3
            ? <>El más antiguo lleva <span className="font-semibold text-amber-700">{dias} días</span> esperando.</>
            : 'Clientes esperando noticias de tu taller.'}
        </p>
      </div>

      <ChevronRight className="w-5 h-5 text-gray-300 flex-shrink-0" />
    </Link>
  )
}
