'use client'

import { useState } from 'react'
import { Download, MessageCircle, Send, Check, Trash2 } from 'lucide-react'
import { cambiarEstadoCotizacion, eliminarCotizacion } from '@/app/(dashboard)/cotizaciones/actions'
import { useRouter } from 'next/navigation'
import { EstadoCotizacion } from '@/types'
import { formatMoney } from '@/lib/utils'

interface Props {
  id: string
  numeroCotizacion: number
  estado: EstadoCotizacion
  nombreCliente?: string
  telefonoCliente?: string
  total: number
  moneda: 'MXN' | 'COP'
}

const SIGUIENTE_ESTADO: Partial<Record<EstadoCotizacion, EstadoCotizacion>> = {
  borrador: 'enviada',
  enviada:  'aprobada',
}

const LABEL_ESTADO: Partial<Record<EstadoCotizacion, string>> = {
  borrador: 'Marcar como enviada',
  enviada:  'Marcar como aprobada',
}

export default function AccionesPdf({
  id, numeroCotizacion, estado, nombreCliente, telefonoCliente, total, moneda,
}: Props) {
  const router  = useRouter()
  const [cargando, setCargando]       = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const numero  = String(numeroCotizacion).padStart(4, '0')
  const totalFmt = formatMoney(total, moneda)

  // WhatsApp link
  const mensajeWa = encodeURIComponent(
    `Hola ${nombreCliente ?? 'estimado cliente'}, le compartimos la cotización #${numero} por un total de ${totalFmt}. ` +
    `Puede descargarla desde el enlace o solicitar más información.`
  )
  const telefonoLimpio = (telefonoCliente ?? '').replace(/\D/g, '')
  const waUrl = telefonoLimpio
    ? `https://wa.me/${telefonoLimpio}?text=${mensajeWa}`
    : `https://wa.me/?text=${mensajeWa}`

  async function handleCambiarEstado() {
    const siguiente = SIGUIENTE_ESTADO[estado]
    if (!siguiente) return
    setCargando(true)
    await cambiarEstadoCotizacion(id, siguiente)
    setCargando(false)
    router.refresh()
  }

  async function handleEliminar() {
    setCargando(true)
    await eliminarCotizacion(id)
    router.push('/cotizaciones')
  }

  return (
    <div className="flex flex-wrap gap-2">
      {/* Descargar PDF */}
      <a
        href={`/api/cotizaciones/${id}/pdf`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-medium px-4 py-2.5 rounded-lg transition-colors shadow-sm"
      >
        <Download className="w-4 h-4" />
        Descargar PDF
      </a>

      {/* WhatsApp */}
      <a
        href={waUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors shadow-sm"
      >
        <MessageCircle className="w-4 h-4" />
        WhatsApp
      </a>

      {/* Cambiar estado */}
      {SIGUIENTE_ESTADO[estado] && (
        <button
          onClick={handleCambiarEstado}
          disabled={cargando}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors shadow-sm"
        >
          {estado === 'enviada' ? <Check className="w-4 h-4" /> : <Send className="w-4 h-4" />}
          {LABEL_ESTADO[estado]}
        </button>
      )}

      {/* Eliminar */}
      {!confirmDelete ? (
        <button
          onClick={() => setConfirmDelete(true)}
          className="flex items-center gap-2 bg-white border border-red-200 hover:bg-red-50 text-red-600 text-sm font-medium px-4 py-2.5 rounded-lg transition-colors shadow-sm"
        >
          <Trash2 className="w-4 h-4" />
          Eliminar
        </button>
      ) : (
        <div className="flex items-center gap-2">
          <span className="text-sm text-red-600 font-medium">¿Confirmar eliminación?</span>
          <button
            onClick={handleEliminar}
            disabled={cargando}
            className="bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-sm font-medium px-3 py-2 rounded-lg"
          >
            Sí, eliminar
          </button>
          <button
            onClick={() => setConfirmDelete(false)}
            className="text-gray-500 hover:text-gray-700 text-sm font-medium px-3 py-2 rounded-lg border border-gray-200"
          >
            Cancelar
          </button>
        </div>
      )}
    </div>
  )
}
