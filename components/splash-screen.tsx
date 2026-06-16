'use client'

import { useEffect, useState } from 'react'

export default function SplashScreen() {
  const [fadeOut, setFadeOut] = useState(false)
  const [hidden,  setHidden]  = useState(false)
  const [dots,    setDots]    = useState('.')

  useEffect(() => {
    const dotsInterval = setInterval(() => {
      setDots(d => d.length >= 3 ? '.' : d + '.')
    }, 400)

    // Iniciar fade-out a los 1.6s
    const fadeTimer = setTimeout(() => setFadeOut(true), 1600)

    // Quitar del DOM completamente a los 2.2s
    const hideTimer = setTimeout(() => setHidden(true), 2200)

    return () => {
      clearInterval(dotsInterval)
      clearTimeout(fadeTimer)
      clearTimeout(hideTimer)
    }
  }, [])

  if (hidden) return null

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

      <p style={{
        fontSize:      28,
        fontWeight:    800,
        color:         '#ffffff',
        letterSpacing: '-0.5px',
        marginBottom:  6,
        fontFamily:    'system-ui, sans-serif',
      }}>
        Taller<span style={{ opacity: 0.6 }}>OS</span>
      </p>

      <p style={{
        fontSize:      13,
        color:         'rgba(255,255,255,0.72)',
        fontWeight:    500,
        fontFamily:    'system-ui, sans-serif',
        letterSpacing: '0.02em',
      }}>
        Actualizando taller{dots}
      </p>

      <div style={{
        marginTop:    28,
        width:        120,
        height:       3,
        borderRadius: 99,
        background:   'rgba(255,255,255,0.2)',
        overflow:     'hidden',
      }}>
        <div style={{
          height:      '100%',
          borderRadius: 99,
          background:  'rgba(255,255,255,0.9)',
          animation:   'splashBar 1.6s ease-in-out forwards',
        }} />
      </div>

      <style>{`
        @keyframes splashBar {
          0%   { width: 0% }
          40%  { width: 55% }
          80%  { width: 85% }
          100% { width: 100% }
        }
      `}</style>
    </div>
  )
}
