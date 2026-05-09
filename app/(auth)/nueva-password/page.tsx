'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Lock, Loader2, Eye, EyeOff, CheckCircle } from 'lucide-react'

export default function NuevaPasswordPage() {
  const [password,        setPassword]        = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [verPassword,     setVerPassword]     = useState(false)
  const [verConfirm,      setVerConfirm]      = useState(false)
  const [cargando,        setCargando]        = useState(false)
  const [listo,           setListo]           = useState(false)
  const [error,           setError]           = useState('')
  const [sesionLista,     setSesionLista]     = useState(false)

  const supabase = createClient()
  const router   = useRouter()

  useEffect(() => {
    const hash   = window.location.hash
    const search = window.location.search

    console.log('HASH:', hash)
    console.log('SEARCH:', search)

    // Caso 1: token en query params (?token_hash=...&type=recovery)
    const queryParams = new URLSearchParams(search)
    const tokenHashQ  = queryParams.get('token_hash')
    const typeQ       = queryParams.get('type')

    if (tokenHashQ && typeQ === 'recovery') {
      supabase.auth.verifyOtp({ token_hash: tokenHashQ, type: 'recovery' })
        .then(({ error }) => {
          if (error) setError('El enlace expiró o no es válido. Solicita uno nuevo.')
          else setSesionLista(true)
        })
      return
    }

    // Caso 2: token en hash fragment (#token_hash=... o #access_token=...)
    if (hash) {
      const hashParams   = new URLSearchParams(hash.substring(1))
      const tokenHashH   = hashParams.get('token_hash')
      const typeH        = hashParams.get('type')
      const accessToken  = hashParams.get('access_token')
      const refreshToken = hashParams.get('refresh_token')

      if (tokenHashH && typeH === 'recovery') {
        supabase.auth.verifyOtp({ token_hash: tokenHashH, type: 'recovery' })
          .then(({ error }) => {
            if (error) setError('El enlace expiró o no es válido. Solicita uno nuevo.')
            else setSesionLista(true)
          })
        return
      }

      if (accessToken && refreshToken) {
        supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
          .then(({ error }) => {
            if (error) setError('El enlace expiró o no es válido. Solicita uno nuevo.')
            else setSesionLista(true)
          })
        return
      }
    }

    // Caso 3: Supabase ya procesó el token y hay sesión activa
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setSesionLista(true)
      } else {
        setError('El enlace expiró o no es válido. Solicita uno nuevo.')
      }
    })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!password) { setError('Escribe tu nueva contraseña.'); return }
    if (password.length < 8) { setError('La contraseña debe tener al menos 8 caracteres.'); return }
    if (password !== passwordConfirm) { setError('Las contraseñas no coinciden.'); return }

    setCargando(true)
    setError('')

    const { error } = await supabase.auth.updateUser({ password })

    setCargando(false)

    if (error) {
      setError('No se pudo actualizar la contraseña. Intenta de nuevo.')
      return
    }

    setListo(true)
    setTimeout(() => router.push('/dashboard'), 2500)
  }

  if (listo) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
        <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-7 h-7 text-green-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">¡Contraseña actualizada!</h2>
        <p className="text-gray-500 text-sm">Entrando a tu taller…</p>
      </div>
    )
  }

  if (error && !sesionLista) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
        <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Lock className="w-7 h-7 text-red-500" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Enlace inválido</h2>
        <p className="text-gray-500 text-sm mb-6">{error}</p>
        <button
          type="button"
          onClick={() => router.push('/recuperar-password')}
          className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors text-sm text-center"
        >
          Solicitar nuevo enlace
        </button>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Nueva contraseña</h2>
        <p className="text-gray-500 text-sm mt-1">Crea una contraseña segura para tu cuenta.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nueva contraseña
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type={verPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres"
              required
              autoFocus
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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Confirmar contraseña
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type={verConfirm ? 'text' : 'password'}
              value={passwordConfirm}
              onChange={e => setPasswordConfirm(e.target.value)}
              placeholder="Repite tu contraseña"
              required
              style={{ color: '#0f172a' }}
              className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              type="button"
              onClick={() => setVerConfirm(!verConfirm)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {verConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
        )}

        <button
          type="submit"
          disabled={cargando || !sesionLista}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-medium py-2.5 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
        >
          {cargando ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Guardar contraseña'}
        </button>
      </form>
    </div>
  )
}