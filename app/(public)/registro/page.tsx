'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const PAISES = [
  { code: 'MX', nombre: 'México',           bandera: '🇲🇽' },
  { code: 'CO', nombre: 'Colombia',          bandera: '🇨🇴' },
  { code: 'AR', nombre: 'Argentina',         bandera: '🇦🇷' },
  { code: 'PE', nombre: 'Perú',              bandera: '🇵🇪' },
  { code: 'CL', nombre: 'Chile',             bandera: '🇨🇱' },
  { code: 'EC', nombre: 'Ecuador',           bandera: '🇪🇨' },
  { code: 'GT', nombre: 'Guatemala',         bandera: '🇬🇹' },
  { code: 'CR', nombre: 'Costa Rica',        bandera: '🇨🇷' },
  { code: 'DO', nombre: 'Rep. Dominicana',   bandera: '🇩🇴' },
  { code: 'VE', nombre: 'Venezuela',         bandera: '🇻🇪' },
]

type Paso = 1 | 2

export default function RegistroPage() {
  const router = useRouter()
  const [paso, setPaso] = useState<Paso>(1)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')
  const [exito, setExito] = useState(false)

  const [form, setForm] = useState({
    nombre_taller: '',
    pais: 'MX',
    nombre_propietario: '',
    email: '',
  })

  function actualizar(campo: keyof typeof form, valor: string) {
    setForm(prev => ({ ...prev, [campo]: valor }))
    setError('')
  }

  function validarPaso1() {
    if (!form.nombre_taller.trim()) return 'Escribe el nombre de tu taller.'
    if (!form.pais) return 'Selecciona tu país.'
    return ''
  }

  function validarPaso2() {
    if (!form.nombre_propietario.trim()) return 'Escribe tu nombre completo.'
    if (!form.email.trim()) return 'Escribe tu correo electrónico.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return 'El correo no es válido.'
    return ''
  }

  function avanzar() {
    const err = validarPaso1()
    if (err) { setError(err); return }
    setPaso(2)
    setError('')
  }

  async function enviar() {
    const err = validarPaso2()
    if (err) { setError(err); return }

    setCargando(true)
    setError('')

    try {
      const res = await fetch('/api/talleres/registro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Error al registrar. Intenta de nuevo.')
        return
      }

      setExito(true)
    } catch {
      setError('Error de conexión. Revisa tu internet e intenta de nuevo.')
    } finally {
      setCargando(false)
    }
  }

  if (exito) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 w-full max-w-md p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">¡Taller registrado!</h2>
          <p className="text-slate-500 text-sm leading-relaxed mb-6">
            Te enviamos un enlace de acceso a{' '}
            <span className="font-medium text-slate-700">{form.email}</span>.
            <br />Revisa tu bandeja (y la carpeta de spam si no llega en 2 minutos).
          </p>
          <button
            onClick={() => router.push('/login')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors text-sm"
          >
            Ir al inicio de sesión
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <a href="/" className="inline-flex flex-col items-center gap-2">
            <img src="/icon-512.png" alt="TallerOS" className="h-16 w-16 object-contain" />
            <span className="text-2xl font-bold text-slate-900">
              Taller<span className="text-blue-600">OS</span>
            </span>
          </a>
          <p className="text-slate-500 text-sm mt-1">Gestión inteligente para tu taller</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">

          <div className="flex border-b border-slate-100">
            {([1, 2] as Paso[]).map((n) => (
              <div
                key={n}
                className={`flex-1 py-3 text-center text-xs font-medium transition-colors ${
                  paso === n
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : n < paso
                    ? 'text-green-600'
                    : 'text-slate-400'
                }`}
              >
                {n < paso ? '✓ ' : `${n}. `}
                {n === 1 ? 'Tu taller' : 'Tu cuenta'}
              </div>
            ))}
          </div>

          <div className="p-6">

            {paso === 1 && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Cuéntanos de tu taller</h2>
                  <p className="text-slate-500 text-sm mt-0.5">Así lo mostraremos a tus clientes.</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Nombre del taller <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.nombre_taller}
                    onChange={e => actualizar('nombre_taller', e.target.value)}
                    placeholder="Ej: Taller Mecánico García"
                    maxLength={80}
                    style={{ color: '#0f172a' }}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    onKeyDown={e => e.key === 'Enter' && avanzar()}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    País <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.pais}
                    onChange={e => actualizar('pais', e.target.value)}
                    style={{ color: '#0f172a' }}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  >
                    {PAISES.map(p => (
                      <option key={p.code} value={p.code}>
                        {p.bandera} {p.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                {error && (
                  <p className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>
                )}

                <button
                  onClick={avanzar}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors text-sm"
                >
                  Siguiente →
                </button>
              </div>
            )}

            {paso === 2 && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Crea tu cuenta</h2>
                  <p className="text-slate-500 text-sm mt-0.5">
                    Serás el propietario de{' '}
                    <span className="font-medium text-slate-700">{form.nombre_taller}</span>.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Tu nombre completo <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.nombre_propietario}
                    onChange={e => actualizar('nombre_propietario', e.target.value)}
                    placeholder="Ej: Carlos García López"
                    maxLength={80}
                    style={{ color: '#0f172a' }}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Correo electrónico <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => actualizar('email', e.target.value)}
                    placeholder="carlos@mitaller.com"
                    style={{ color: '#0f172a' }}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    onKeyDown={e => e.key === 'Enter' && !cargando && enviar()}
                  />
                  <p className="text-slate-400 text-xs mt-1">
                    Te enviaremos un enlace para acceder — sin contraseña.
                  </p>
                </div>

                {error && (
                  <p className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>
                )}

                <button
                  onClick={enviar}
                  disabled={cargando}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-lg transition-colors text-sm flex items-center justify-center gap-2"
                >
                  {cargando ? (
                    <>
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                      </svg>
                      Creando tu taller…
                    </>
                  ) : (
                    'Crear mi taller gratis'
                  )}
                </button>

                <button
                  onClick={() => { setPaso(1); setError('') }}
                  className="w-full text-slate-500 hover:text-slate-700 text-sm py-1 transition-colors"
                >
                  ← Volver
                </button>
              </div>
            )}

          </div>
        </div>

        <p className="text-center text-sm text-slate-500 mt-4">
          ¿Ya tienes cuenta?{' '}
          <a href="/login" className="text-blue-600 hover:text-blue-700 font-medium">
            Inicia sesión
          </a>
        </p>

      </div>
    </main>
  )
}