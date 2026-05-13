'use client'

import { usePushNotifications } from '@/hooks/usePushNotifications'
import { Bell, BellOff, Loader2 } from 'lucide-react'

export default function PushToggle() {
  const { soportado, permiso, activado, cargando, activar, desactivar } = usePushNotifications()

  if (!soportado) return null

  if (permiso === 'denied') {
    return (
      <div className="flex items-center gap-2 text-xs text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
        <BellOff className="w-4 h-4" />
        Notificaciones bloqueadas en tu navegador
      </div>
    )
  }

  return (
    <button
      onClick={activado ? desactivar : activar}
      disabled={cargando}
      className={`flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-xl border transition-colors ${
        activado
          ? 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100'
          : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
      }`}
    >
      {cargando
        ? <Loader2 className="w-4 h-4 animate-spin" />
        : activado
        ? <Bell className="w-4 h-4" />
        : <BellOff className="w-4 h-4" />
      }
      {cargando
        ? 'Activando...'
        : activado
        ? 'Notificaciones activas'
        : 'Activar notificaciones'
      }
    </button>
  )
}