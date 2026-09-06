'use client'

import { useState } from 'react'

interface Props {
  tallerId: string
  enlace: string
  /** Cuántas veces ya se le escribió, para enseñarlo en el botón. */
  intentos: number
}

/**
 * El botón de WhatsApp de un carrito abandonado.
 *
 * Registra el contacto y luego abre el chat. El registro va por `keepalive`
 * porque la pestaña se va a segundo plano en cuanto WhatsApp toma el control:
 * un fetch normal se cancelaría a medias y el intento no quedaría contado.
 *
 * Y no se espera a la respuesta antes de abrir. Si el registro falla, lo peor
 * que pasa es que el próximo mensaje repita texto; hacer esperar a quien va a
 * escribir sería peor.
 */
export default function BotonWhatsAppCarrito({ tallerId, enlace, intentos }: Props) {
  const [contados, setContados] = useState(intentos)

  const registrar = () => {
    setContados(n => n + 1)
    fetch('/api/admin/contacto-carrito', {
      method:    'POST',
      headers:   { 'Content-Type': 'application/json' },
      body:      JSON.stringify({ taller_id: tallerId }),
      keepalive: true,
    }).catch(() => {})
  }

  return (
    <a
      href={enlace}
      target="_blank"
      rel="noopener noreferrer"
      onClick={registrar}
      className="flex-shrink-0 text-[11px] font-bold px-3 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 transition-colors"
    >
      WhatsApp{contados > 0 && <span className="ml-1.5 text-emerald-600/90">·{contados}</span>}
    </a>
  )
}
