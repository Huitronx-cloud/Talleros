'use client'

import { MessageCircle } from 'lucide-react'

const NUMERO = '14284362377'
const TEXTO  = encodeURIComponent('Hola, tengo una duda sobre TallerOS')

export default function WhatsappFlotante() {
  return (
    <a
      href={`https://wa.me/${NUMERO}?text=${TEXTO}`}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 left-6 z-50 w-14 h-14 bg-green-500 hover:bg-green-400 rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 group"
      aria-label="Escríbenos por WhatsApp"
    >
      <MessageCircle size={24} className="text-white" />
      <span className="absolute -top-10 left-0 bg-gray-900 text-white text-xs px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
        Escríbenos por WhatsApp
      </span>
    </a>
  )
}
