'use client'

import { useState, useRef } from 'react'
import { Upload, Loader2, Check, X, Building2 } from 'lucide-react'
import { guardarConfiguracion } from '@/app/(dashboard)/configuracion/actions'
import { createClient } from '@/lib/supabase/client'
import { Taller } from '@/types'
import Image from 'next/image'

export default function FormConfiguracion({ taller }: { taller: Taller }) {
  const supabase = createClient()

  const [nombre,       setNombre]       = useState(taller.nombre       ?? '')
  const [telefono,     setTelefono]     = useState(taller.telefono     ?? '')
  const [direccion,    setDireccion]    = useState(taller.direccion    ?? '')
  const [email,        setEmail]        = useState(taller.email        ?? '')
  const [moneda,       setMoneda]       = useState<'MXN' | 'COP'>(taller.moneda ?? 'MXN')
  const [vigencia,     setVigencia]     = useState(taller.vigencia_dias ?? 15)
  const [logoUrl,      setLogoUrl]      = useState(taller.logo_url     ?? '')
  const [googleReviewUrl, setGoogleReviewUrl] = useState(taller.google_review_url ?? '')

  const [cargando,     setCargando]     = useState(false)
  const [subiendo,     setSubiendo]     = useState(false)
  const [ok,           setOk]           = useState(false)
  const [error,        setError]        = useState('')

  const inputFile = useRef<HTMLInputElement>(null)

  async function handleLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { setError('El logo debe pesar menos de 2 MB'); return }

    setSubiendo(true)
    setError('')

    const ext = file.name.split('.').pop()
    const path = `${taller.id}/logo.${ext}`

    const { error: errUp } = await supabase.storage
      .from('logos')
      .upload(path, file, { upsert: true })

    if (errUp) { setError('Error al subir el logo: ' + errUp.message); setSubiendo(false); return }

    const { data } = supabase.storage.from('logos').getPublicUrl(path)
    console.log('URL del logo:', data.publicUrl) 
    setLogoUrl(data.publicUrl + '?t=' + Date.now()) // cache-bust
    setSubiendo(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nombre.trim()) { setError('El nombre del taller es obligatorio'); return }

    setCargando(true)
    setError('')
    setOk(false)

    const result = await guardarConfiguracion({
      nombre,
      telefono,
      direccion,
      email,
      moneda,
      vigencia_dias: vigencia,
      logo_url: logoUrl || undefined,
      google_review_url: googleReviewUrl || undefined,
    })

    setCargando(false)
    if (result.error) { setError(result.error); return }
    setOk(true)
    setTimeout(() => setOk(false), 3000)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {/* Logo */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Logo del taller</h2>
        <div className="flex items-center gap-5">
          {/* Preview */}
          <div className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden bg-gray-50 flex-shrink-0">
            {logoUrl ? (
              <div className="relative w-full h-full">
                <Image src={logoUrl} alt="Logo" width={120} height={120} className="object-contain p-1" />
              </div>
            ) : (
              <Building2 className="w-8 h-8 text-gray-300" />
            )}
          </div>

          {/* Botones */}
          <div>
            <input
              ref={inputFile}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              className="hidden"
              onChange={handleLogo}
            />
            <button
              type="button"
              onClick={() => inputFile.current?.click()}
              disabled={subiendo}
              className="flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              {subiendo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {subiendo ? 'Subiendo...' : 'Subir logo'}
            </button>
            <p className="text-xs text-gray-400 mt-1.5">PNG, JPG o SVG · máx. 2 MB</p>
            {logoUrl && (
              <button
                type="button"
                onClick={() => setLogoUrl('')}
                className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600 mt-1"
              >
                <X className="w-3 h-3" /> Quitar logo
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Datos del taller */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">Información del taller</h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del taller <span className="text-red-500">*</span></label>
          <input
            type="text"
            value={nombre}
            onChange={e => setNombre(e.target.value)}
            placeholder="Ej. Taller Mecánico El Gordo"
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 bg-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
            <input
              type="tel"
              value={telefono}
              onChange={e => setTelefono(e.target.value)}
              placeholder="+52 55 1234 5678"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 bg-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="taller@ejemplo.com"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 bg-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div>
  <label className="block text-sm font-medium text-gray-700 mb-1.5">
    Link de reseña en Google
  </label>
  <input
    type="url"
    value={googleReviewUrl}
    onChange={e => setGoogleReviewUrl(e.target.value)}
    placeholder="https://g.page/r/tu-taller/review"
    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 bg-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
  />
  <p className="text-xs text-gray-400 mt-1">Este link se enviará automáticamente al cliente para pedir reseña en Google.</p>
</div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
          <input
            type="text"
            value={direccion}
            onChange={e => setDireccion(e.target.value)}
            placeholder="Calle, colonia, ciudad"
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 bg-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Preferencias de cotización */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">Preferencias de cotización</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Moneda predeterminada</label>
            <select
              value={moneda}
              onChange={e => setMoneda(e.target.value as 'MXN' | 'COP')}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="MXN">MXN — Peso mexicano</option>
              <option value="COP">COP — Peso colombiano</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Vigencia predeterminada (días)</label>
            <input
              type="number"
              value={vigencia}
              min={1}
              max={365}
              onChange={e => setVigencia(Number(e.target.value))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
          <X className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div />
        <button
          type="submit"
          disabled={cargando || subiendo}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium px-6 py-2.5 rounded-lg transition-colors"
        >
          {cargando ? <Loader2 className="w-4 h-4 animate-spin" /> : ok ? <Check className="w-4 h-4" /> : null}
          {cargando ? 'Guardando...' : ok ? '¡Guardado!' : 'Guardar cambios'}
        </button>
      </div>
    </form>
  )
}
