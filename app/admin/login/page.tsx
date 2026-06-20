'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Lock, Loader2 } from 'lucide-react'
import { iniciarSesionAdmin } from './actions'

export default function AdminLoginPage() {
  const [password, setPassword] = useState('')
  const [cargando, setCargando] = useState(false)
  const [error, setError]       = useState('')
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setCargando(true)
    setError('')

    const { error } = await iniciarSesionAdmin(password)
    if (error) {
      setError(error)
      setCargando(false)
      return
    }

    router.push('/admin/leads')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-gray-900 border border-gray-800 rounded-2xl p-8">
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold text-white">TallerOS</h1>
          <p className="text-sm text-gray-500 mt-1">Centro de control — acceso interno</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Contraseña"
              required
              autoFocus
              className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {error && (
            <p className="text-sm text-red-400 bg-red-500/10 px-3 py-2 rounded-lg">{error}</p>
          )}

          <button
            type="submit"
            disabled={cargando}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-medium py-2.5 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
          >
            {cargando ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
