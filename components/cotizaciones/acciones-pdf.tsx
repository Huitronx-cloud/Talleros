'use client'

import { useState } from 'react'
import { Download, MessageCircle, Send, Check, Trash2, X } from 'lucide-react'
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
  emailCliente?: string | null
  total: number
  moneda: string
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
  id, numeroCotizacion, estado, nombreCliente, telefonoCliente, emailCliente, total, moneda,
}: Props) {
  const router = useRouter()
  const [cargando, setCargando]           = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [modalPdf, setModalPdf]           = useState(false)
  const [enviandoEmail, setEnviandoEmail] = useState(false)
  const [emailEnviado, setEmailEnviado]   = useState(false)

  const numero   = String(numeroCotizacion).padStart(4, '0')
  const totalFmt = formatMoney(total, moneda)

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

  async function handleEnviarEmail() {
    if (!emailCliente) return
    setEnviandoEmail(true)
    try {
      await fetch(`/api/cotizaciones/${id}/email`, { method: 'POST' })
      setEmailEnviado(true)
      setTimeout(() => setEmailEnviado(false), 3000)
    } catch {}
    setEnviandoEmail(false)
  }

  return (
    <>
      {modalPdf && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-gray-900">Compartir cotización</h3>
              <button
                onClick={() => setModalPdf(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-5">
              Cotización #{numero} · {totalFmt}
            </p>
            <div className="flex flex-col gap-3">
              <a
                href={`/api/cotizaciones/${id}/pdf`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 text-sm font-medium px-4 py-3 rounded-xl transition-colors"
              >
                <Download className="w-4 h-4" />
                Descargar PDF
              </a>

              {emailCliente && (
                <button
                  onClick={handleEnviarEmail}
                  disabled={enviandoEmail || emailEnviado}
                  className="flex items-center gap-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-sm font-medium px-4 py-3 rounded-xl transition-colors disabled:opacity-60"
                >
                  {emailEnviado
                    ? <Check className="w-4 h-4" />
                    : <Send className="w-4 h-4" />
                  }
                  {emailEnviado
                    ? '¡Email enviado!'
                    : enviandoEmail
                    ? 'Enviando...'
                    : 'Enviar por email'
                  }
                </button>
              )}

              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 bg-green-50 hover:bg-green-100 border border-green-200 text-green-700 text-sm font-medium px-4 py-3 rounded-xl transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                Enviar por WhatsApp
              </a>

              <button
                onClick={() => setModalPdf(false)}
                className="text-sm text-gray-400 hover:text-gray-600 py-2 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setModalPdf(true)}
          className="flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-medium px-4 py-2.5 rounded-lg transition-colors shadow-sm"
        >
          <Download className="w-4 h-4" />
          PDF
        </button>

        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors shadow-sm"
        >
          <MessageCircle className="w-4 h-4" />
          WhatsApp
        </a>

        {SIGUIENTE_ESTADO[estado] && (
          <button
            onClick={handleCambiarEstado}
            disabled={cargando}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors shadow-sm"
          >
            {estado === 'enviada'
              ? <Check className="w-4 h-4" />
              : <Send className="w-4 h-4" />
            }
            {LABEL_ESTADO[estado]}
          </button>
        )}

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
    </>
  )
}