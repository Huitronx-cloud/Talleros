'use client'

import { useState, useEffect } from 'react'
import GoogleAnalytics from './google-analytics'
import MetaPixel from './meta-pixel'

// Clave en localStorage. Valores: 'granted' | 'denied'. Sin valor → banner.
const CLAVE_CONSENT = 'talleros-cookie-consent'

// Evento para reabrir el banner desde otras partes de la app (ej. /privacidad).
export const EVENTO_GESTIONAR_COOKIES = 'talleros:gestionar-cookies'

// GA y Meta Pixel NO se cargan hasta que el usuario acepte. Rechazar (o no
// decidir) significa que ningún script de rastreo llega al navegador.
export default function CookieConsent() {
  // 'cargando' evita parpadeo del banner en SSR/hidratación
  const [estado, setEstado] = useState<'granted' | 'denied' | null | 'cargando'>('cargando')

  useEffect(() => {
    const guardado = localStorage.getItem(CLAVE_CONSENT)
    setEstado(guardado === 'granted' || guardado === 'denied' ? guardado : null)

    const reabrir = () => setEstado(null)
    window.addEventListener(EVENTO_GESTIONAR_COOKIES, reabrir)
    return () => window.removeEventListener(EVENTO_GESTIONAR_COOKIES, reabrir)
  }, [])

  function decidir(valor: 'granted' | 'denied') {
    localStorage.setItem(CLAVE_CONSENT, valor)
    setEstado(valor)
  }

  return (
    <>
      {estado === 'granted' && (
        <>
          <GoogleAnalytics />
          <MetaPixel />
        </>
      )}

      {estado === null && (
        <div
          role="dialog"
          aria-label="Preferencias de cookies"
          aria-live="polite"
          style={{
            position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9999,
            background: '#111827', borderTop: '1px solid rgba(255,255,255,0.1)',
            padding: '16px 20px', display: 'flex', flexWrap: 'wrap',
            alignItems: 'center', justifyContent: 'center', gap: 12,
            boxShadow: '0 -8px 24px rgba(0,0,0,0.35)',
          }}
        >
          <p style={{ color: '#cbd5e1', fontSize: 13, lineHeight: 1.5, maxWidth: 560, margin: 0 }}>
            Usamos cookies de analítica (Google Analytics) y marketing (Meta Pixel) para
            mejorar TallerOS. Solo se activan si aceptas. Las cookies esenciales de sesión
            no requieren consentimiento.{' '}
            <a href="/privacidad" style={{ color: '#60a5fa', textDecoration: 'underline' }}>
              Más información
            </a>
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => decidir('denied')}
              style={{
                background: 'transparent', color: '#94a3b8', fontSize: 13, fontWeight: 600,
                border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8,
                padding: '9px 16px', cursor: 'pointer',
              }}
            >
              Rechazar
            </button>
            <button
              onClick={() => decidir('granted')}
              style={{
                background: '#2563eb', color: '#fff', fontSize: 13, fontWeight: 600,
                border: 'none', borderRadius: 8, padding: '9px 18px', cursor: 'pointer',
              }}
            >
              Aceptar
            </button>
          </div>
        </div>
      )}
    </>
  )
}
