'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Mail, Lock, Loader2, Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail]           = useState('')
  const [password, setPassword]     = useState('')
  const [verPassword, setVerPassword] = useState(false)
  const [cargando, setCargando]     = useState(false)
  const [error, setError]           = useState('')

  const supabase = createClient()
  const router   = useRouter()

  // ── Detectar magic link del correo de bienvenida ─────────────────────────
  useEffect(() => {
    const hash = window.location.hash
    if (!hash) return

    const params = new URLSearchParams(hash.substring(1))
    const accessToken  = params.get('access_token')
    const refreshToken = params.get('refresh_token')
    const type         = params.get('type')

    if (accessToken && refreshToken && (type === 'magiclink' || type === 'recovery')) {
      setCargando(true)
      supabase.auth.setSession({
        access_token:  accessToken,
        refresh_token: refreshToken,
      }).then(({ error }) => {
        if (error) {
          setError('El enlace expiró. Inicia sesión con tu correo y contraseña.')
          setCargando(false)
        } else {
          // Verificar si ya completó el onboarding
          supabase
            .from('usuarios')
            .select('talleres(onboarding_completo)')
            .single()
            .then(({ data }) => {
              const raw    = data?.talleres
              const taller = (Array.isArray(raw) ? raw[0] : raw) as { onboarding_completo: boolean } | null
              if (type === 'recovery') {
  router.push('/nueva-password')
} else {
  router.push(taller?.onboarding_completo === false ? '/onboarding' : '/dashboard')
}
            })
        }
      })
    }
  }, [])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) return

    setCargando(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Email o contraseña incorrectos. Verifica tus datos.')
      setCargando(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  // Pantalla de carga mientras procesa el magic link
  if (cargando && !error) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-4" />
        <p className="text-gray-500 text-sm">Verificando acceso…</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">

      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Iniciar sesión</h2>
        <p className="text-gray-500 text-sm mt-1">Accede a tu taller</p>
      </div>

      <form onSubmit={handleLogin} className="space-y-4">

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
              style={{ color: '#0f172a' }}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Contraseña
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type={verPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Tu contraseña"
              required
              style={{ color: '#0f172a' }}
              className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              type="button"
              onClick={() => setVerPassword(!verPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {verPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
        )}

        <button
          type="submit"
          disabled={cargando}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-medium py-2.5 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
        >
          {cargando ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Entrar'}
        </button>

      </form>

      <div className="mt-6 space-y-3 text-center">
  <p>
    <a href="/recuperar-password" className="text-sm text-gray-500 hover:text-blue-600 transition-colors">
      ¿Olvidaste tu contraseña?
    </a>
  </p>
  <p className="text-sm text-gray-500">
    ¿No tienes cuenta?{' '}
    <a href="/registro" className="text-blue-600 hover:text-blue-700 font-medium">
      Regístrate gratis
    </a>
  </p>
</div>
</div>
  )
}