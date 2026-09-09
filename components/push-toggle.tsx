'use client'

import { usePushNotifications } from '@/hooks/usePushNotifications'
import { Bell, BellOff, Loader2, Share } from 'lucide-react'

export default function PushToggle({ dark = false, showText = false }: { dark?: boolean; showText?: boolean }) {
  const { soportado, permiso, activado, cargando, esIOS, instalada, activar, desactivar } = usePushNotifications()

  /**
   * Cuando no se puede, se dice por qué. Nunca se devuelve nada.
   *
   * Antes esto era `if (!soportado) return null`, y el caso que se tragaba es
   * justo el más común entre quien tiene que enterarse de una cita: una
   * recepcionista con iPhone abriendo TallerOS en Safari. Apple solo expone las
   * notificaciones dentro de una app instalada en la pantalla de inicio, así
   * que ahí `soportado` es false — y ella no veía ni el botón ni una
   * explicación. No es que no le funcionara: es que para ella la función no
   * existía.
   *
   * De las trece suscripciones de toda la plataforma, ninguna era de recepción.
   */
  if (!soportado) {
    const avisoClases = dark
      ? 'bg-gray-800 border-gray-700 text-gray-300'
      : 'bg-amber-50 border-amber-200 text-amber-900'

    if (esIOS && !instalada) {
      return (
        <div className={`flex items-start gap-2 text-xs leading-relaxed border rounded-lg px-3 py-2.5 ${avisoClases}`}>
          <Share className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>
            <strong className="font-semibold">Para que te suene el teléfono</strong>, agrega
            TallerOS a tu pantalla de inicio: toca <strong>Compartir</strong> y luego{' '}
            <strong>Agregar a inicio</strong>. Ábrelo desde ahí y vuelve a este botón.
          </span>
        </div>
      )
    }

    return (
      <div className={`flex items-start gap-2 text-xs leading-relaxed border rounded-lg px-3 py-2.5 ${avisoClases}`}>
        <BellOff className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <span>Este navegador no permite avisos. Prueba a abrir TallerOS en Chrome o en Safari.</span>
      </div>
    )
  }

  if (permiso === 'denied') {
    return (
      <div className="flex items-start gap-2 text-xs leading-relaxed text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
        <BellOff className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <span>
          Bloqueaste los avisos para TallerOS. Se vuelven a activar desde los ajustes
          de tu navegador, en Notificaciones.
        </span>
      </div>
    )
  }

  return (
    <button
      onClick={activado ? desactivar : activar}
      disabled={cargando}
      className={`flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-xl border transition-colors w-full ${
        dark
          ? activado
            ? 'bg-green-900/30 border-green-700 text-green-400 hover:bg-green-900/50'
            : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700'
          : activado
          ? 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100'
          : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
      }`}
    >
      {cargando
        ? <Loader2 className="w-4 h-4 animate-spin" />
        : activado
        ? <Bell className="w-4 h-4 flex-shrink-0" />
        : <BellOff className="w-4 h-4 flex-shrink-0" />
      }
      <span className={showText ? 'inline' : 'hidden sm:inline'}>
        {cargando
          ? 'Activando...'
          : activado
          ? 'Notificaciones activas'
          : 'Activar notificaciones'
        }
      </span>
    </button>
  )
}
