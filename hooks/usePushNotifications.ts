import { useState, useEffect } from 'react'

export function usePushNotifications() {
  const [soportado,  setSoportado]  = useState(false)
  const [permiso,    setPermiso]    = useState<NotificationPermission>('default')
  const [activado,   setActivado]   = useState(false)
  const [cargando,   setCargando]   = useState(false)

  useEffect(() => {
    setSoportado('serviceWorker' in navigator && 'PushManager' in window)
    setPermiso(Notification.permission)

    // Verificar si ya está suscrito
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(reg => {
        reg.pushManager.getSubscription().then(sub => {
          setActivado(!!sub)
        })
      })
    }
  }, [])

  async function activar() {
    if (!soportado) return
    setCargando(true)

    try {
      const reg = await navigator.serviceWorker.register('/sw.js')
      await navigator.serviceWorker.ready

      const permiso = await Notification.requestPermission()
      setPermiso(permiso)
      if (permiso !== 'granted') return

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly:      true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
        ),
      })

      await fetch('/api/push/suscribir', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(sub),
      })

      setActivado(true)
    } catch (e) {
      console.error('Error activando push:', e)
    } finally {
      setCargando(false)
    }
  }

  async function desactivar() {
    if (!soportado) return
    const reg = await navigator.serviceWorker.ready
    const sub = await reg.pushManager.getSubscription()
    if (sub) await sub.unsubscribe()
    setActivado(false)
  }

  return { soportado, permiso, activado, cargando, activar, desactivar }
}

function urlBase64ToUint8Array(base64String: string) {
  const padding  = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64   = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData  = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}