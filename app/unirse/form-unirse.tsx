'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'

interface Props {
  token: string
  email: string
  rol: string
  tallerNombre: string
  tallerId: string
}

export default function FormUnirse({ token, email, rol, tallerNombre, tallerId }: Props) {
  const router   = useRouter()
  const supabase = createClient()

  const [nombre, setNombre]     = useState('')
  const [password, setPassword] = useState('')
  const [cargando, setCargando] = useState(false)
  const [error, setError]       = useState('')

  const INPUT = 'w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400'

  const handleSubmit = async () => {
    if (!nombre.trim()) { setError('El nombre es requerido'); return }
    if (password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return }

    setCargando(true)
    setError('')

    try {
      // 1. Intentar registrar en Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { nombre } },
      })

      let userId: string | null = null

      if (
        authError?.message?.includes('already registered') ||
        authError?.message?.includes('already been registered')
      ) {
        // El email ya existe — intentar login con la contraseña ingresada
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({ email, password })
        if (loginError) throw new Error('Este email ya tiene cuenta. Intenta con tu contraseña actual.')
        userId = loginData.user?.id ?? null
      } else if (authError) {
        throw new Error(authError.message)
      } else {
        userId = authData.user?.id ?? null
      }

      if (!userId) throw new Error('No se pudo obtener el usuario')

      // 2. Insertar en tabla usuarios solo si no existe
      const { data: usuarioExistente } = await supabase
        .from('usuarios')
        .select('id')
        .eq('id', userId)
        .single()

      if (!usuarioExistente) {
        const { error: userError } = await supabase.from('usuarios').insert({
          id:        userId,
          taller_id: tallerId,
          nombre,
          email,
          rol,
        })
        if (userError && !userError.message.includes('duplicate')) {
          throw new Error(userError.message)
        }
      }

      // 3. Marcar invitación como usada
      await fetch('/api/invitaciones/usar', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ token }),
      })

      router.push('/dashboard')
    } catch (e: any) {
      setError(e.message)
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
        <input type="email" value={email} disabled className={`${INPUT} bg-gray-50 text-gray-400`} />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Tu nombre</label>
        <input
          type="text"
          value={nombre}
          onChange={e => setNombre(e.target.value)}
          placeholder="Nombre completo"
          className={INPUT}
          autoFocus
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Mínimo 6 caracteres"
          className={INPUT}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
        />
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={cargando}
        className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors"
      >
        {cargando && <Loader2 className="w-4 h-4 animate-spin" />}
        Crear cuenta y unirme
      </button>
    </div>
  )
}