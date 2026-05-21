'use client'

import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, Loader2, Bot, User, Minimize2 } from 'lucide-react'

interface Mensaje {
  rol: 'user' | 'assistant'
  contenido: string
}

const SUGERENCIAS = [
  '¿Cómo creo una orden de trabajo?',
  '¿Cómo envío una cotización por WhatsApp?',
  '¿Cómo invito a un mecánico?',
  '¿Cómo cambio la moneda?',
]

export default function SoporteWidget() {
  const [abierto, setAbierto]     = useState(false)
  const [minimizado, setMin]      = useState(false)
  const [input, setInput]         = useState('')
  const [cargando, setCargando]   = useState(false)
  const [mensajes, setMensajes]   = useState<Mensaje[]>([
    {
      rol: 'assistant',
      contenido: '¡Hola! 👋 Soy Taller AI, tu asistente de TallerOS. ¿En qué te puedo ayudar hoy?',
    },
  ])
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef  = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (abierto && !minimizado) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
      inputRef.current?.focus()
    }
  }, [mensajes, abierto, minimizado])

  async function enviar(texto?: string) {
    const msg = texto ?? input.trim()
    if (!msg || cargando) return
    setInput('')

    const nuevosMensajes: Mensaje[] = [...mensajes, { rol: 'user', contenido: msg }]
    setMensajes(nuevosMensajes)
    setCargando(true)

    try {
      const res = await fetch('/api/soporte', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          mensaje:   msg,
          historial: mensajes.slice(-8), // Últimos 8 mensajes de contexto
        }),
      })
      const data = await res.json()
      setMensajes(prev => [...prev, { rol: 'assistant', contenido: data.respuesta }])
    } catch {
      setMensajes(prev => [...prev, {
        rol:      'assistant',
        contenido: 'Lo siento, hubo un error. Intenta de nuevo o escríbenos a hola@tallerosapp.com',
      }])
    }
    setCargando(false)
  }

  return (
    <>
      {/* ── Widget flotante ── */}
      {!abierto && (
        <button
          onClick={() => setAbierto(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-blue-600 hover:bg-blue-500 rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 group"
          aria-label="Abrir soporte"
        >
          <MessageCircle size={24} className="text-white" />
          <span className="absolute -top-10 right-0 bg-gray-900 text-white text-xs px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            ¿Necesitas ayuda?
          </span>
        </button>
      )}

      {/* ── Chat window ── */}
      {abierto && (
        <div className={`fixed bottom-6 right-6 z-50 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col transition-all ${minimizado ? 'h-14' : 'h-[520px]'}`}>

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-blue-600 rounded-t-2xl">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <Bot size={16} className="text-white" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm leading-none">Taller AI</p>
                <p className="text-blue-200 text-xs mt-0.5">Soporte TallerOS • En línea</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setMin(!minimizado)}
                className="w-7 h-7 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <Minimize2 size={14} className="text-white" />
              </button>
              <button
                onClick={() => setAbierto(false)}
                className="w-7 h-7 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <X size={14} className="text-white" />
              </button>
            </div>
          </div>

          {!minimizado && (
            <>
              {/* Mensajes */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {mensajes.map((m, i) => (
                  <div key={i} className={`flex items-start gap-2 ${m.rol === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                      m.rol === 'assistant' ? 'bg-blue-100' : 'bg-gray-100'
                    }`}>
                      {m.rol === 'assistant'
                        ? <Bot size={14} className="text-blue-600" />
                        : <User size={14} className="text-gray-600" />
                      }
                    </div>
                    <div className={`max-w-[75%] px-3 py-2 rounded-xl text-sm leading-relaxed ${
                      m.rol === 'assistant'
                        ? 'bg-gray-100 text-gray-800 rounded-tl-sm'
                        : 'bg-blue-600 text-white rounded-tr-sm'
                    }`}>
                      {m.contenido}
                    </div>
                  </div>
                ))}

                {/* Typing indicator */}
                {cargando && (
                  <div className="flex items-start gap-2">
                    <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center">
                      <Bot size={14} className="text-blue-600" />
                    </div>
                    <div className="bg-gray-100 px-3 py-2 rounded-xl rounded-tl-sm">
                      <Loader2 size={14} className="text-gray-400 animate-spin" />
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              {/* Sugerencias — solo si hay pocos mensajes */}
              {mensajes.length === 1 && (
                <div className="px-4 pb-2 flex flex-wrap gap-1.5">
                  {SUGERENCIAS.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => enviar(s)}
                      className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full border border-blue-200 transition-colors text-left"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}

              {/* Input */}
              <div className="p-3 border-t border-gray-100">
                <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && enviar()}
                    placeholder="Escribe tu pregunta..."
                    className="flex-1 bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-400"
                    disabled={cargando}
                  />
                  <button
                    onClick={() => enviar()}
                    disabled={!input.trim() || cargando}
                    className="w-8 h-8 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg flex items-center justify-center transition-colors flex-shrink-0"
                  >
                    <Send size={14} className="text-white" />
                  </button>
                </div>
                <p className="text-center text-xs text-gray-400 mt-2">
                  Powered by TallerOS AI · <a href="mailto:hola@tallerosapp.com" className="underline">Soporte humano</a>
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </>
  )
}
