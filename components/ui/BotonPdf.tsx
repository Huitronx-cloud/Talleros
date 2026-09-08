'use client'

import { useState } from 'react'
import { FileDown, Loader2 } from 'lucide-react'

/**
 * Descargar un PDF desde la app instalada sin quedarse encerrado.
 *
 * El problema, tal cual lo contó un taller: abres la cotización en el móvil,
 * el PDF se enseña a pantalla completa y no hay forma de volver a TallerOS.
 * Pasa solo desde el icono instalado. La app corre en modo standalone, sin
 * barra del navegador, y iOS enseña los PDF dentro de esa ventana aunque la
 * cabecera diga `attachment` — así que no queda ni botón de atrás ni pestaña
 * que cerrar.
 *
 * Aquí se baja el PDF a memoria y se entrega por el camino nativo:
 *
 *   1. La hoja de compartir del sistema, si el aparato la ofrece para
 *      ficheros. Es lo mejor que puede pasar: tiene "Cancelar", y desde ahí se
 *      guarda en Archivos o se manda por WhatsApp, que es lo que el taller
 *      quiere hacer con una cotización de todos modos.
 *   2. Si no, una descarga normal con un enlace temporal.
 *   3. Y si eso también falla, se abre la dirección tal cual, que es
 *      exactamente lo que hacía antes: peor que las otras dos, pero nunca deja
 *      al usuario sin nada.
 *
 * No puedo probarlo en un iPhone desde aquí, así que las tres vías están
 * encadenadas a propósito: si la primera no existe en ese aparato, cae a la
 * siguiente sola.
 */
export default function BotonPdf({
  url,
  nombre,
  etiqueta = 'Descargar PDF',
  className = '',
}: {
  url: string
  /** Nombre del fichero, con extensión. Ej: "cotizacion-0012.pdf". */
  nombre: string
  etiqueta?: string
  className?: string
}) {
  const [cargando, setCargando] = useState(false)
  const [error, setError]       = useState('')

  const abrir = async () => {
    setCargando(true)
    setError('')

    try {
      const res = await fetch(url)
      if (!res.ok) throw new Error(`El servidor respondió ${res.status}`)
      const blob = await res.blob()
      const archivo = new File([blob], nombre, { type: 'application/pdf' })

      // 1. La hoja del sistema.
      const nav = navigator as Navigator & {
        canShare?: (datos: { files: File[] }) => boolean
        share?: (datos: { files: File[]; title?: string }) => Promise<void>
      }
      if (nav.canShare?.({ files: [archivo] }) && nav.share) {
        try {
          await nav.share({ files: [archivo], title: nombre })
          return
        } catch (err) {
          // Cancelar la hoja de compartir lanza AbortError. No es un fallo:
          // el usuario decidió que no. Sin esto le saldría un error rojo por
          // haber pulsado "Cancelar".
          if (err instanceof Error && err.name === 'AbortError') return
          // Cualquier otra cosa: seguimos a la descarga normal.
        }
      }

      // 2. Descarga con enlace temporal.
      const enlace = document.createElement('a')
      enlace.href = URL.createObjectURL(blob)
      enlace.download = nombre
      document.body.appendChild(enlace)
      enlace.click()
      document.body.removeChild(enlace)
      // Se libera después: revocarlo en el mismo instante corta la descarga
      // antes de que empiece en algunos navegadores.
      setTimeout(() => URL.revokeObjectURL(enlace.href), 60_000)
    } catch (err) {
      console.error('[pdf] no se pudo entregar el archivo:', err)
      // 3. Lo de siempre. Ni siquiera esto puede fallar en silencio.
      try {
        window.open(url, '_blank', 'noopener,noreferrer')
      } catch {
        setError('No se pudo abrir el PDF. Inténtalo desde el navegador.')
      }
    } finally {
      setCargando(false)
    }
  }

  return (
    <>
      <button onClick={abrir} disabled={cargando} className={className}>
        {cargando ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
        {cargando ? 'Preparando...' : etiqueta}
      </button>
      {error && <p className="text-xs text-red-600 mt-1.5">{error}</p>}
    </>
  )
}
