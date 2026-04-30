'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Mail, Loader2, CheckCircle } from 'lucide-react'

type Modo = 'magic-link' | 'password'

export default function LoginPage() {
  const [modo, setModo] = useState<Modo>('magic-link')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [cargando, setCargando] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [error, setError] = useState('')

  const supabase = createClient()
  const router = useRouter()

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setCargando(true)
    setError('')

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })

    if (error) {
      setError('No se pudo enviar el enlace. Verifica tu email.')
    } else {
      setEnviado(true)
    }
    setCargando(false)
  }

  const handlePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return
    setCargando(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
  setError('Email o contraseña incorrectos.')
} else {
  router.push('/dashboard')
}
setCargando(false)
  }

  if (enviado) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
        <div className="flex justify-center mb-4">
          <CheckCircle className="w-12 h-12 text-green-500" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">¡Enlace enviado!</h2>
        <p className="text-gray-500 text-sm">
          Revisa tu correo <strong>{email}</strong> y haz clic en el enlace para entrar.
        </p>
        <button
          onClick={() => setEnviado(false)}
          className="mt-6 text-sm text-blue-600 hover:underline"
        >
          Usar otro email
        </button>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
      {/* Selector de modo */}
      <div className="flex rounded-lg bg-gray-100 p-1 mb-6">
        <button
          onClick={() => setModo('magic-link')}
          className={`flex-1 text-sm font-medium py-2 rounded-md transition-all ${
            modo === 'magic-link'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Magic Link
        </button>
        <button
          onClick={() => setModo('password')}
          className={`flex-1 text-sm font-medium py-2 rounded-md transition-all ${
            modo === 'password'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Contraseña
        </button>
      </div>

      <form onSubmit={modo === 'magic-link' ? handleMagicLink : handlePassword}>
        <div className="space-y-4">
          {/* Email */}
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
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Contraseña (solo en modo password) */}
          {modo === 'password' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}

          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}

          <button
            type="submit"
            disabled={cargando}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-medium py-2.5 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
          >
            {cargando ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : modo === 'magic-link' ? (
              'Enviar enlace de acceso'
            ) : (
              'Iniciar sesión'
            )}
          </button>
        </div>
      </form>

      {modo === 'magic-link' && (
        <p className="text-xs text-gray-400 text-center mt-4">
          Te enviaremos un enlace seguro — no necesitas contraseña.
        </p>
      )}
    </div>
  )
}
