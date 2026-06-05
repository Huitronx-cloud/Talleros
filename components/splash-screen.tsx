'use client'

import { useEffect, useState } from 'react'

export default function SplashScreen() {
  const [show,    setShow]    = useState(false)
  const [fadeOut, setFadeOut] = useState(false)
  const [dots,    setDots]    = useState('.')

  useEffect(() => {
    // Solo mostrar en modo PWA (standalone) o primera carga de la sesión
    const esPWA = window.matchMedia('(display-mode: standalone)').matches
      || (navigator as any).standalone === true

    const yaVisto = sessionStorage.getItem('_splash_shown')

    if (!esPWA && yaVisto) return

    sessionStorage.setItem('_splash_shown', '1')
    setShow(true)

    const dotsInterval = setInterval(() => {
      setDots(d => d.length >= 3 ? '.' : d + '.')
    }, 400)

    const fadeTimer = setTimeout(() => setFadeOut(true), 1600)
    const hideTimer = setTimeout(() => setShow(false), 2200)

    return () => {
      clearInterval(dotsInterval)
      clearTimeout(fadeTimer)
      clearTimeout(hideTimer)
    }
  }, [])

  if (!show) return null

  return (
    <div
      style={{
        position:       'fixed',
        inset:          0,
        zIndex:         9999,
        display:        'flex',
        flexDirection:  'column',
        alignItems:     'center',
        justifyContent: 'center',
        background:     'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 60%, #2563eb 100%)',
        transition:     'opacity 0.55s ease',
        opacity:        fadeOut ? 0 : 1,
        pointerEvents:  fadeOut ? 'none' : 'auto',
      }}
    >
      {/* Logo */}
      <img
        src="/icon-512.png"
        alt="TallerOS"
        style={{
          width:        96,
          height:       96,
          borderRadius: 24,
          marginBottom: 24,
          boxShadow:    '0 8px 32px rgba(0,0,0,0.3)',
        }}
      />

      {/* Nombre */}
      <p style={{
        fontSize:      28,
        fontWeight:    800,
        color:         '#ffffff',
        letterSpacing: '-0.5px',
        marginBottom:  6,
      }}>
        Taller<span style={{ opacity: 0.65 }}>OS</span>
      </p>

      {/* Mensaje de estado */}
      <p style={{
        fontSize:      13,
        color:         'rgba(255,255,255,0.7)',
        fontWeight:    500,
        letterSpacing: '0.02em',
      }}>
        Actualizando taller{dots}
      </p>

      {/* Barra de progreso */}
      <div style={{
        marginTop:    28,
        width:        120,
        height:       3,
        borderRadius: 99,
        background:   'rgba(255,255,255,0.2)',
        overflow:     'hidden',
      }}>
        <div style={{
          height:     '100%',
          borderRadius: 99,
          background: 'rgba(255,255,255,0.9)',
          animation:  'splash-bar 1.6s ease-in-out forwards',
        }} />
      </div>

      <style>{`
        @keyframes splash-bar {
          0%   { width: 0% }
          40%  { width: 55% }
          80%  { width: 85% }
          100% { width: 100% }
        }
      `}</style>
    </div>
  )
}
