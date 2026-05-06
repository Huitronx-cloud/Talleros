'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Props {
  tallerId: string
  nombreTaller: string
}

export default function OnboardingForm({ tallerId, nombreTaller }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const inputRef = useRef<HTMLInputElement>(null)

  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')
  const [previewLogo, setPreviewLogo] = useState<string | null>(null)
  const [archivoLogo, setArchivoLogo] = useState<File | null>(null)
  const [form, setForm] = useState({ telefono: '', direccion: '' })

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
      if (form.telefono.trim()) updates.telefono = form.telefono.trim()
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

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <span className="text-2xl font-bold text-slate-900">
            Taller<span className="text-blue-600">OS</span>
          </span>
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

            {/* Logo */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Logo del taller</label>
              <div
                onClick={() => inputRef.current?.click()}
                className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
              >
                {previewLogo ? (
                  <img src={previewLogo} alt="Logo preview" className="h-16 object-contain mx-auto rounded" />
                ) : (
                  <>
                    <svg className="w-8 h-8 text-slate-300 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-sm text-slate-500">Haz clic para subir tu logo</p>
                    <p className="text-xs text-slate-400 mt-0.5">PNG, JPG o SVG · Máx 2 MB</p>
                  </>
                )}
              </div>
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
                  className="text-xs text-slate-400 hover:text-red-500 mt-1 transition-colors"
                >
                  Quitar logo
                </button>
              )}
            </div>

            {/* Teléfono */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Teléfono del taller</label>
              <input
                type="tel"
                value={form.telefono}
                onChange={e => actualizar('telefono', e.target.value)}
                placeholder="Ej: +52 55 1234 5678"
                className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Dirección */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Dirección</label>
              <input
                type="text"
                value={form.direccion}
                onChange={e => actualizar('direccion', e.target.value)}
                placeholder="Ej: Av. Insurgentes 123, CDMX"
                className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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