'use client'

import { useState } from 'react'
import { MessageCircle, Loader2, X, Send, CheckCircle2 } from 'lucide-react'
import { EstadoOrden } from '@/types'
import { generarMensajeWhatsApp, registrarEnvioWhatsApp } from '@/app/(dashboard)/ordenes/actions'
import { PlantillaWhatsApp, PLANTILLA_LABEL, ESTADO_PLANTILLA_DEFAULT } from '@/lib/whatsapp-templates'
import { buildWhatsAppLink } from '@/lib/whatsapp-link'

const VERDE = '#25D366'

export default function BotonWhatsAppLink({
  ordenId,
  estado,
  compacto = false,
}: {
  ordenId: string
  estado: EstadoOrden
  compacto?: boolean
}) {
  const [abierto, setAbierto]     = useState(false)
  const [cargando, setCargando]   = useState(false)
  const [enviando, setEnviando]   = useState(false)
  const [enviado, setEnviado]     = useState(false)
  const [error, setError]         = useState('')
  const [avisoLog, setAvisoLog]   = useState('')
  const [plantilla, setPlantilla] = useState<PlantillaWhatsApp>(ESTADO_PLANTILLA_DEFAULT[estado])
  const [telefono, setTelefono]   = useState('')
  const [paisTaller, setPaisTaller] = useState<string | null>(null)
  const [mensaje, setMensaje]     = useState('')

  async function cargarMensaje(p: PlantillaWhatsApp) {
    setCargando(true)
    setError('')
    const res = await generarMensajeWhatsApp(ordenId, p)
    setCargando(false)
    if (res.error || !res.datos) {
      setError(res.error ?? 'No se pudo generar el mensaje')
      return
    }
    setPlantilla(p)
    setTelefono(res.datos.telefono)
    setPaisTaller(res.datos.paisTaller)
    setMensaje(res.datos.mensaje)
  }

  function abrir(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setAbierto(true)
    setEnviado(false)
    setAvisoLog('')
    cargarMensaje(ESTADO_PLANTILLA_DEFAULT[estado])
  }

  function cerrar(e?: React.MouseEvent) {
    e?.preventDefault()
    e?.stopPropagation()
    setAbierto(false)
  }

  async function handleEnviar(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()

    // Abrimos la pestaña ANTES de cualquier await — si se abre después de un
    // fetch, la mayoría de navegadores (sobre todo Safari/iOS) la bloquean
    // por no considerarla ya parte del gesto directo del usuario.
    const ventana = window.open('', '_blank')

    setEnviando(true)
    setError('')
    setAvisoLog('')

    const resLog = await registrarEnvioWhatsApp({ ordenId, plantilla, telefono, mensaje })
    if (resLog.error) {
      setAvisoLog('El mensaje se puede enviar, pero no se pudo registrar en el historial.')
    }

    const link = buildWhatsAppLink(telefono, mensaje, paisTaller)

    if (ventana) {
      ventana.location.href = link
    } else {
      // Popup bloqueado — navegamos la pestaña actual como último recurso.
      window.location.href = link
    }

    setEnviando(false)
    setEnviado(true)
    setTimeout(() => { setAbierto(false); setEnviado(false) }, 1200)
  }

  return (
    <>
      <button
        onClick={abrir}
        title="Enviar por WhatsApp"
        className={compacto
          ? 'flex items-center justify-center w-7 h-7 rounded-lg text-white transition-colors flex-shrink-0'
          : 'flex items-center gap-2 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors'}
        style={{ background: VERDE }}
        onMouseEnter={e => (e.currentTarget.style.background = '#1fb855')}
        onMouseLeave={e => (e.currentTarget.style.background = VERDE)}
      >
        <MessageCircle className="w-4 h-4" />
        {!compacto && 'Enviar por WhatsApp'}
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
                <h3 className="text-sm font-semibold text-gray-900">Enviar por WhatsApp</h3>
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

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Plantilla</label>
                <select
                  value={plantilla}
                  onChange={e => cargarMensaje(e.target.value as PlantillaWhatsApp)}
                  disabled={cargando}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  {Object.entries(PLANTILLA_LABEL).map(([valor, label]) => (
                    <option key={valor} value={valor}>{label}</option>
                  ))}
                </select>
              </div>

              {cargando ? (
                <div className="flex items-center justify-center py-10 text-gray-400">
                  <Loader2 className="w-5 h-5 animate-spin" />
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">
                      Mensaje (puedes editarlo antes de enviar)
                    </label>
                    <textarea
                      rows={8}
                      value={mensaje}
                      onChange={e => setMensaje(e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                    />
                  </div>
                  {telefono && (
                    <p className="text-xs text-gray-400">
                      Se abrirá WhatsApp con este mensaje listo para <span className="font-medium text-gray-600">{telefono}</span>.
                      Tú das el último tap para enviarlo — nada se manda automáticamente.
                    </p>
                  )}
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
                disabled={cargando || enviando || !mensaje || !telefono}
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
