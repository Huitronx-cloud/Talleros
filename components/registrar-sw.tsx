'use client'

import { useEffect } from 'react'

// Registra el service worker en cada carga (idempotente). Antes solo se
// registraba al activar las notificaciones push, así que la mayoría de los
// usuarios no tenía soporte offline ni el SW actualizado.
export default function RegistrarSW() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // Sin SW no pasa nada grave: la app funciona igual, solo sin offline.
      })
    }
  }, [])

  return null
}
