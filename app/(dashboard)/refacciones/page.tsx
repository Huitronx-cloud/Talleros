export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { ArrowLeft, Wrench } from 'lucide-react'
import BuscadorVin from './buscador-vin'

export const metadata = {
  title: 'Buscar refacción',
}

/**
 * Buscar refacción a partir del VIN.
 *
 * Va aparte del flujo de la orden a propósito, por decisión del dueño del
 * producto: el VIN sigue siendo opcional donde ya estaba y nadie se traba si
 * el taller no lo captura. Aquí el mecánico entra cuando lo necesita, con el
 * coche delante.
 *
 * Tampoco exige que el vehículo esté dado de alta. Si lo está sale con su
 * cliente y su historial; si no, se decodifica y se busca igual.
 */
export default function RefaccionesPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">

      <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-5">
        <ArrowLeft className="w-4 h-4" />
        Volver
      </Link>

      <div className="flex items-center gap-3 mb-1">
        <div className="w-10 h-10 rounded-xl bg-slate-700 flex items-center justify-center">
          <Wrench className="w-5 h-5 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Buscar refacción</h1>
      </div>
      <p className="text-sm text-gray-500 mb-6 leading-relaxed">
        Escribe el número de serie y te decimos qué vehículo es, con su motor y su
        versión, para que pidas la pieza correcta a la primera.
      </p>

      <BuscadorVin />
    </div>
  )
}
