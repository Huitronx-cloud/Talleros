export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import MensajesPendientes from '@/components/dashboard/mensajes-pendientes'
import AvisoCaducados from '@/components/dashboard/aviso-caducados'

export const metadata = {
  title: 'Pendientes',
}

/**
 * Los mensajes que esperan un tap para salir.
 *
 * Vivían dentro del tablero, y con cincuenta en cola lo tapaban entero. Ahora
 * el tablero solo lleva el aviso —un número que se ve de lejos— y la lista
 * está aquí, con sitio para respirar.
 */
export default function PendientesPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">

      <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-5">
        <ArrowLeft className="w-4 h-4" />
        Volver al tablero
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-1">Pendientes</h1>
      <p className="text-sm text-gray-500 mb-6 leading-relaxed">
        Mensajes listos para mandar desde tu propio WhatsApp. Cada uno es un cliente
        esperando noticias: un tap y sale.
      </p>

      {/* Explica los que desaparecieron ANTES de la lista: si no, el taller
          ve un número más bajo y piensa que se perdieron sus mensajes. */}
      <AvisoCaducados />

      <MensajesPendientes />

      <div className="text-center py-10">
        <p className="text-sm text-gray-400">
          Cuando no queda ninguno, esta pantalla se queda vacía. Es buena señal.
        </p>
      </div>
    </div>
  )
}
