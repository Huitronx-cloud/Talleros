'use client'

import { useState } from 'react'
import { Loader2, X, Send, CheckCircle2, MessageCircle } from 'lucide-react'
import { generarMensajeWhatsAppContexto, registrarEnvioWhatsApp, DatosMensajeContexto } from '@/app/(dashboard)/ordenes/actions'
import { ContextoWhatsApp } from '@/lib/whatsapp-templates'
import { buildWhatsAppLink } from '@/lib/whatsapp-link'

const VERDE = '#25D366'

const TITULO_CONTEXTO: Record<ContextoWhatsApp, string> = {
  fotos_diagnostico: 'Enviar fotos por WhatsApp',
  portal_cliente:    'Enviar portal por WhatsApp',
  pdf_servicio:      'Enviar PDF por WhatsApp',
  aprobacion_extra:  'Solicitar aprobación por WhatsApp',
}

interface ExtraContexto {
  fotos?:         { url: string; descripcion: string }[]
  servicioExtra?: string
  costoExtra?:    string
}

// Botón + modal wa.me reutilizable para envíos atados a una acción (fotos,
// portal, PDF, aprobación extra). Mismo esquema que el modal por estatus:
// el mensaje se genera en el servidor, el empleado lo edita si quiere y lo
// manda desde SU PROPIO WhatsApp — nada se envía automáticamente.
export default function BotonWhatsAppContexto({
  ordenId,
  contexto,
  label,
  labelCargando,
  icono: Icono = MessageCircle,
  className,
  disabled = false,
  obtenerExtra,
  onDatos,
  onEnviado,
}: {
  ordenId:       string
  contexto:      ContextoWhatsApp
  label:         string
  labelCargando?: string
  icono?:        React.ComponentType<{ className?: string }>
  className:     string
  disabled?:     boolean
  obtenerExtra?: () => ExtraContexto | undefined
  onDatos?:      (datos: DatosMensajeContexto) => void
  onEnviado?:    () => void
}) {
  const [abierto, setAbierto]   = useState(false)
  const [cargando, setCargando] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado]   = useState(false)
  const [error, setError]       = useState('')
  const [avisoLog, setAvisoLog] = useState('')
  const [datos, setDatos]       = useState<DatosMensajeContexto | null>(null)
  const [mensaje, setMensaje]   = useState('')

  async function abrir(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    const extra = obtenerExtra?.()
    setError('')
    setAvisoLog('')
    setEnviado(false)
    setDatos(null)
    setMensaje('')
    setAbierto(true)
    setCargando(true)
    const res = await generarMensajeWhatsAppContexto(ordenId, contexto, extra)
    setCargando(false)
    if (res.error || !res.datos) {
      setError(res.error ?? 'No se pudo generar el mensaje')
      return
    }
    setDatos(res.datos)
    setMensaje(res.datos.mensaje)
    onDatos?.(res.datos)
  }

  function cerrar(e?: React.MouseEvent) {
    e?.preventDefault()
    e?.stopPropagation()
    setAbierto(false)
  }

  async function handleEnviar(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (!datos) return

    // Abrimos la pestaña ANTES de cualquier await — si se abre después de un
    // fetch, la mayoría de navegadores (sobre todo Safari/iOS) la bloquean
    // por no considerarla ya parte del gesto directo del usuario.
    const ventana = window.open('', '_blank')

    setEnviando(true)
    setError('')
    setAvisoLog('')

    const resLog = await registrarEnvioWhatsApp({ ordenId, plantilla: contexto, telefono: datos.telefono, mensaje })
    if (resLog.error) {
      setAvisoLog('El mensaje se puede enviar, pero no se pudo registrar en el historial.')
    }

    const link = buildWhatsAppLink(datos.telefono, mensaje, datos.paisTaller)

    if (ventana) {
      ventana.location.href = link
    } else {
      window.location.href = link
    }

    setEnviando(false)
    setEnviado(true)
    onEnviado?.()
    setTimeout(() => { setAbierto(false); setEnviado(false) }, 1200)
  }

  return (
    <>
      <button onClick={abrir} disabled={disabled} title={label} className={className}>
        <Icono className="w-4 h-4" />
        {label}
      </button>

      {abierto && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onClick={cerrar}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4" style={{ color: VERDE }} />
                <h3 className="text-sm font-semibold text-gray-900">{TITULO_CONTEXTO[contexto]}</h3>
              </div>
              <button onClick={cerrar} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {error && (
                <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
              )}
              {avisoLog && (
                <p className="text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">{avisoLog}</p>
              )}

              {cargando ? (
                <div className="flex flex-col items-center justify-center py-10 text-gray-400 gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {labelCargando && <p className="text-xs">{labelCargando}</p>}
                </div>
              ) : datos && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">
                      Mensaje (puedes editarlo antes de enviar)
                    </label>
                    <textarea
                      rows={10}
                      value={mensaje}
                      onChange={e => setMensaje(e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                    />
                  </div>
                  <p className="text-xs text-gray-400">
                    Se abrirá WhatsApp con este mensaje listo para <span className="font-medium text-gray-600">{datos.telefono}</span>.
                    Tú das el último tap para enviarlo — nada se manda automáticamente.
                  </p>
                </>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-gray-100">
              <button
                onClick={cerrar}
                className="text-sm font-medium text-gray-500 hover:text-gray-700 px-4 py-2"
              >
                Cancelar
              </button>
              <button
                onClick={handleEnviar}
                disabled={cargando || enviando || !mensaje || !datos}
                className="flex items-center gap-2 disabled:opacity-60 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
                style={{ background: VERDE }}
              >
                {enviando
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : enviado
                    ? <><CheckCircle2 className="w-4 h-4" /> Abierto</>
                    : <><Send className="w-4 h-4" /> Enviar por WhatsApp</>
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
