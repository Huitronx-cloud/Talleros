'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Mail, Loader2, CheckCircle } from 'lucide-react'

export default function RecuperarPasswordPage() {
  const [email, setEmail] = useState('')
  const [cargando, setCargando] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setCargando(true)
    setError('')
    const { error } = await supabase.auth.resetPasswordForEmail(
      email.toLowerCase().trim(),
      { redirectTo: window.location.origin + '/nueva-password' }
    )
    setCargando(false)
    if (error) { setError('No se pudo enviar el correo.'); return }
    setEnviado(true)
  }

  if (enviado) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
        <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-7 h-7 text-green-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Correo enviado</h2>
        <p className="text-gray-500 text-sm mb-6">
          Revisa tu bandeja en{' '}
          <span className="font-medium text-gray-700">{email}</span>.
        </p>
        
         <a href="/login"
          className="block w-full bg-blue-600 text-white font-medium py-2.5 rounded-lg text-sm text-center"
        >
          Volver al login
        </a>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Recuperar contraseña</h2>
        <p className="text-gray-500 text-sm mt-1">
          Te enviaremos un enlace para crear una nueva contraseña.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Correo electrónico
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="tucorreo@taller.com"
              required
              autoFocus
              style={{ color: '#0f172a' }}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        {error && (
          <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
        )}
        <button
          type="submit"
          disabled={cargando}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-medium py-2.5 rounded-lg text-sm flex items-center justify-center gap-2"
        >
          {cargando ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Enviar enlace'}
        </button>
      </form>
      <p className="text-center text-sm text-gray-500 mt-6">
        <a href="/login" className="text-blue-600 hover:text-blue-700 font-medium">
          ← Volver al login
        </a>
      </p>
    </div>
  )
}