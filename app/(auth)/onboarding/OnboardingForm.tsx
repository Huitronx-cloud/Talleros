'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Props {
  tallerId: string
  nombreTaller: string
}

const CODIGOS_PAIS = [
  { code: 'CA', nombre: 'Canadá',           dial: '+1',   bandera: '🇨🇦' },
  { code: 'MX', nombre: 'México',           dial: '+52',  bandera: '🇲🇽' },
  { code: 'US', nombre: 'Estados Unidos',   dial: '+1',   bandera: '🇺🇸' },
  { code: 'CO', nombre: 'Colombia',         dial: '+57',  bandera: '🇨🇴' },
  { code: 'AR', nombre: 'Argentina',        dial: '+54',  bandera: '🇦🇷' },
  { code: 'PE', nombre: 'Perú',             dial: '+51',  bandera: '🇵🇪' },
  { code: 'CL', nombre: 'Chile',            dial: '+56',  bandera: '🇨🇱' },
  { code: 'EC', nombre: 'Ecuador',          dial: '+593', bandera: '🇪🇨' },
  { code: 'GT', nombre: 'Guatemala',        dial: '+502', bandera: '🇬🇹' },
  { code: 'CR', nombre: 'Costa Rica',       dial: '+506', bandera: '🇨🇷' },
  { code: 'DO', nombre: 'Rep. Dominicana',  dial: '+1',   bandera: '🇩🇴' },
  { code: 'VE', nombre: 'Venezuela',        dial: '+58',  bandera: '🇻🇪' },
  { code: 'BO', nombre: 'Bolivia',          dial: '+591', bandera: '🇧🇴' },
  { code: 'PY', nombre: 'Paraguay',         dial: '+595', bandera: '🇵🇾' },
  { code: 'UY', nombre: 'Uruguay',          dial: '+598', bandera: '🇺🇾' },
  { code: 'HN', nombre: 'Honduras',         dial: '+504', bandera: '🇭🇳' },
  { code: 'SV', nombre: 'El Salvador',      dial: '+503', bandera: '🇸🇻' },
  { code: 'PA', nombre: 'Panamá',           dial: '+507', bandera: '🇵🇦' },
  { code: 'NI', nombre: 'Nicaragua',        dial: '+505', bandera: '🇳🇮' },
]

export default function OnboardingForm({ tallerId, nombreTaller }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const inputRef = useRef<HTMLInputElement>(null)

  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')
  const [previewLogo, setPreviewLogo] = useState<string | null>(null)
  const [archivoLogo, setArchivoLogo] = useState<File | null>(null)
  const [codigoPais, setCodigoPais] = useState('CA')
  const [numeroTel, setNumeroTel] = useState('')
  const [form, setForm] = useState({ direccion: '' })

  function actualizar(campo: keyof typeof form, valor: string) {
    setForm(prev => ({ ...prev, [campo]: valor }))
    setError('')
  }

  function seleccionarLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { setError('El logo no puede pesar más de 2 MB.'); return }
    if (!['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'].includes(file.type)) {
      setError('Solo se aceptan imágenes PNG, JPG, WebP o SVG.'); return
    }
    setArchivoLogo(file)
    setPreviewLogo(URL.createObjectURL(file))
    setError('')
  }

  function telefonoCompleto() {
    const pais = CODIGOS_PAIS.find(p => p.code === codigoPais)
    const numero = numeroTel.trim()
    if (!numero) return ''
    return `${pais?.dial} ${numero}`
  }

  async function guardar() {
    setCargando(true)
    setError('')

    try {
      let logo_url: string | null = null

      if (archivoLogo) {
        const ext = archivoLogo.name.split('.').pop()
        const path = `${tallerId}/logo.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('taller-logos')
          .upload(path, archivoLogo, { upsert: true, contentType: archivoLogo.type })

        if (!uploadError) {
          const { data: urlData } = supabase.storage.from('taller-logos').getPublicUrl(path)
          logo_url = urlData.publicUrl
        } else {
          console.warn('Logo upload:', uploadError.message)
        }
      }

      const updates: Record<string, unknown> = { onboarding_completo: true }
      const tel = telefonoCompleto()
      if (tel) updates.telefono = tel
      if (form.direccion.trim()) updates.direccion = form.direccion.trim()
      if (logo_url) updates.logo_url = logo_url

      const { error: updateError } = await supabase
        .from('talleres')
        .update(updates)
        .eq('id', tallerId)

      if (updateError) { setError('No se pudo guardar. Intenta de nuevo.'); return }

      router.push('/dashboard')
    } catch {
      setError('Error inesperado. Intenta de nuevo.')
    } finally {
      setCargando(false)
    }
  }

  const paisSeleccionado = CODIGOS_PAIS.find(p => p.code === codigoPais)

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
</div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="mb-6">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mb-3">
              <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-slate-900">Configura tu taller</h1>
            <p className="text-slate-500 text-sm mt-1">
              <span className="font-medium text-slate-700">{nombreTaller}</span> está casi listo.
              Estos datos son opcionales — puedes agregarlos después.
            </p>
          </div>

          <div className="space-y-5">

            {/* ── Logo ── */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Logo del taller</label>

              {previewLogo ? (
                /* Vista previa con mosaico de fondo */
                <div
                  className="relative rounded-xl overflow-hidden cursor-pointer border-2 border-blue-200"
                  style={{ height: '160px' }}
                  onClick={() => inputRef.current?.click()}
                >
                  {/* Mosaico de fondo */}
                  <div
                    className="absolute inset-0"
                    style={{
                      backgroundImage: `url(${previewLogo})`,
                      backgroundSize: '80px 80px',
                      backgroundRepeat: 'repeat',
                      opacity: 0.08,
                      filter: 'blur(1px)',
                    }}
                  />
                  {/* Overlay suave */}
                  <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-white/60" />
                  {/* Logo principal centrado */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                    <img
  src={previewLogo}
  alt="Logo preview"
  className="h-32 w-auto object-contain drop-shadow-sm"
/>
                    <span className="text-xs text-slate-500 bg-white/80 px-2 py-0.5 rounded-full">
                      Haz clic para cambiar
                    </span>
                  </div>
                </div>
              ) : (
                /* Estado vacío */
                <div
                  onClick={() => inputRef.current?.click()}
                  className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
                  style={{ height: '160px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
                >
                  <svg className="w-10 h-10 text-slate-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm text-slate-500">Haz clic para subir tu logo</p>
                  <p className="text-xs text-slate-400 mt-0.5">PNG, JPG o SVG · Máx 2 MB</p>
                </div>
              )}

              <input
                ref={inputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                onChange={seleccionarLogo}
                className="hidden"
              />
              {previewLogo && (
                <button
                  onClick={() => { setPreviewLogo(null); setArchivoLogo(null) }}
                  className="text-xs text-slate-400 hover:text-red-500 mt-1.5 transition-colors"
                >
                  Quitar logo
                </button>
              )}
            </div>

            {/* Teléfono con selector de país */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Teléfono del taller
              </label>
              <div className="flex gap-2">
                <div className="relative">
                  <select
                    value={codigoPais}
                    onChange={e => setCodigoPais(e.target.value)}
                    style={{ color: '#0f172a' }}
                    className="appearance-none border border-slate-300 rounded-lg pl-3 pr-8 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white cursor-pointer"
                  >
                    {CODIGOS_PAIS.map(p => (
                      <option key={p.code} value={p.code}>
                        {p.bandera} {p.dial}
                      </option>
                    ))}
                  </select>
                  <svg className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                <input
                  type="tel"
                  value={numeroTel}
                  onChange={e => setNumeroTel(e.target.value.replace(/[^0-9\s\-]/g, ''))}
                  placeholder={codigoPais === 'CA' || codigoPais === 'US' ? '416 123 4567' : '55 1234 5678'}
                  style={{ color: '#0f172a' }}
                  className="flex-1 border border-slate-300 rounded-lg px-3 py-2.5 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              {numeroTel && (
                <p className="text-xs text-slate-400 mt-1">
                  Se guardará como: <span className="text-slate-600 font-medium">{paisSeleccionado?.dial} {numeroTel}</span>
                </p>
              )}
            </div>

            {/* Dirección */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Dirección</label>
              <input
                type="text"
                value={form.direccion}
                onChange={e => actualizar('direccion', e.target.value)}
                placeholder="Ej: Av. Insurgentes 123, CDMX"
                style={{ color: '#0f172a' }}
                className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {error && (
              <p className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>
            )}

            <button
              onClick={guardar}
              disabled={cargando}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-medium py-2.5 rounded-lg transition-colors text-sm flex items-center justify-center gap-2"
            >
              {cargando ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                  </svg>
                  Guardando…
                </>
              ) : (
                'Ir a mi dashboard →'
              )}
            </button>

            <button
              onClick={() => router.push('/dashboard')}
              className="w-full text-slate-400 hover:text-slate-600 text-sm py-1 transition-colors"
            >
              Omitir por ahora
            </button>

          </div>
        </div>

        <div className="flex items-center gap-2 mt-4 justify-center">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <div className="w-2 h-2 rounded-full bg-blue-600" />
          <div className="w-2 h-2 rounded-full bg-slate-200" />
          <span className="text-xs text-slate-400 ml-1">Paso 2 de 3</span>
        </div>

      </div>
    </main>
  )
}