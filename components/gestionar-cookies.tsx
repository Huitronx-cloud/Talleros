'use client'

import { EVENTO_GESTIONAR_COOKIES } from './cookie-consent'

// Botón para retirar/cambiar el consentimiento de cookies desde /privacidad.
export default function GestionarCookies() {
  function reabrirBanner() {
    localStorage.removeItem('talleros-cookie-consent')
    window.dispatchEvent(new Event(EVENTO_GESTIONAR_COOKIES))
    // Si ya se habían cargado GA/Pixel en esta sesión, recargar garantiza
    // que dejen de ejecutarse hasta una nueva decisión.
    window.location.reload()
  }

  return (
    <button
      onClick={reabrirBanner}
      style={{
        background: 'transparent', color: '#60a5fa', fontSize: 14, fontWeight: 600,
        border: '1px solid rgba(96,165,250,0.35)', borderRadius: 8,
        padding: '10px 18px', cursor: 'pointer',
      }}
    >
      Gestionar preferencias de cookies
    </button>
  )
}
