'use client'

import { useEffect, useState } from 'react'

const NUMERO = '14284362377'
const TEXTO  = encodeURIComponent('Hola, tengo una duda sobre TallerOS')

/**
 * Botón de WhatsApp presente en todas las páginas públicas.
 *
 * Va a la derecha: la esquina izquierda la ocupa el aviso de actividad de la
 * landing. Y se esconde al llegar al pie, donde ya hay un botón de soporte que
 * hace lo mismo y donde además se encimaba con la barra fija de registro.
 */
export default function WhatsappFlotante() {
  const [oculto, setOculto] = useState(false)

  useEffect(() => {
    const pie = document.querySelector('footer')
    if (!pie) return
    const io = new IntersectionObserver(([e]) => setOculto(e.isIntersecting), { threshold: 0.01 })
    io.observe(pie)
    return () => io.disconnect()
  }, [])

  return (
    <a
      href={`https://wa.me/${NUMERO}?text=${TEXTO}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Escríbenos por WhatsApp"
      className={`group fixed right-5 bottom-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25d366] shadow-[0_6px_20px_rgba(37,211,102,0.4)] transition-all duration-300 hover:scale-105 hover:bg-[#20bd5a] max-[640px]:right-4 max-[640px]:bottom-[124px] max-[640px]:h-[52px] max-[640px]:w-[52px] ${
        oculto ? 'pointer-events-none translate-y-2 scale-90 opacity-0' : 'opacity-100'
      }`}
    >
      {/* logo de WhatsApp: se reconoce de un vistazo, una burbuja genérica no */}
      <svg width="28" height="28" viewBox="0 0 24 24" fill="#fff" aria-hidden="true">
        <path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.47-1.75-1.65-2.05-.17-.3-.02-.46.13-.6.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.6-.92-2.2-.24-.58-.49-.5-.67-.5h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.22 3.08c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.75-.72 2-1.41.25-.69.25-1.28.17-1.41-.07-.13-.27-.2-.57-.35z" />
        <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.86 9.86 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91C21.96 6.45 17.5 2 12.04 2zm0 18.02h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.19 8.19 0 0 1-1.26-4.38c0-4.54 3.7-8.23 8.25-8.23 2.2 0 4.27.86 5.83 2.42a8.19 8.19 0 0 1 2.41 5.82c0 4.54-3.7 8.23-8.24 8.23z" />
      </svg>
      <span className="pointer-events-none absolute right-full mr-3 whitespace-nowrap rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100 max-[640px]:hidden">
        Escríbenos por WhatsApp
      </span>
    </a>
  )
}
