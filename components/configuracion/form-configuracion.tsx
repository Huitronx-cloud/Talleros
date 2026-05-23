'use client'

import { useState, useRef } from 'react'
import { Upload, Loader2, Check, X, Building2 } from 'lucide-react'
import { guardarConfiguracion } from '@/app/(dashboard)/configuracion/actions'
import { createClient } from '@/lib/supabase/client'
import { Taller } from '@/types'
import Image from 'next/image'

const CODIGOS_PAIS = [
  { code: 'CA', nombre: 'Canadá',          dial: '+1',   bandera: '🇨🇦' },
  { code: 'MX', nombre: 'México',          dial: '+52',  bandera: '🇲🇽' },
  { code: 'US', nombre: 'Estados Unidos',  dial: '+1',   bandera: '🇺🇸' },
  { code: 'CO', nombre: 'Colombia',        dial: '+57',  bandera: '🇨🇴' },
  { code: 'AR', nombre: 'Argentina',       dial: '+54',  bandera: '🇦🇷' },
  { code: 'PE', nombre: 'Perú',            dial: '+51',  bandera: '🇵🇪' },
  { code: 'CL', nombre: 'Chile',           dial: '+56',  bandera: '🇨🇱' },
  { code: 'EC', nombre: 'Ecuador',         dial: '+593', bandera: '🇪🇨' },
  { code: 'GT', nombre: 'Guatemala',       dial: '+502', bandera: '🇬🇹' },
  { code: 'CR', nombre: 'Costa Rica',      dial: '+506', bandera: '🇨🇷' },
  { code: 'DO', nombre: 'Rep. Dominicana', dial: '+1',   bandera: '🇩🇴' },
  { code: 'VE', nombre: 'Venezuela',       dial: '+58',  bandera: '🇻🇪' },
  { code: 'BO', nombre: 'Bolivia',         dial: '+591', bandera: '🇧🇴' },
  { code: 'PY', nombre: 'Paraguay',        dial: '+595', bandera: '🇵🇾' },
  { code: 'UY', nombre: 'Uruguay',         dial: '+598', bandera: '🇺🇾' },
  { code: 'HN', nombre: 'Honduras',        dial: '+504', bandera: '🇭🇳' },
  { code: 'SV', nombre: 'El Salvador',     dial: '+503', bandera: '🇸🇻' },
  { code: 'PA', nombre: 'Panamá',          dial: '+507', bandera: '🇵🇦' },
  { code: 'NI', nombre: 'Nicaragua',       dial: '+505', bandera: '🇳🇮' },
]

// Detecta el código de país y el número a partir de un teléfono guardado como "+52 55 1234 5678"
function parsearTelefono(telefono: string): { codigoPais: string; numero: string } {
  if (!telefono) return { codigoPais: 'MX', numero: '' }
  const match = CODIGOS_PAIS.find(p => telefono.startsWith(p.dial))
  if (match) {
    return {
      codigoPais: match.code,
      numero: telefono.slice(match.dial.length).trim(),
    }
  }
  return { codigoPais: 'MX', numero: telefono }
}

export default function FormConfiguracion({ taller }: { taller: Taller }) {
  const supabase = createClient()

  const telefonoParseado = parsearTelefono(taller.telefono ?? '')

  const [nombre,          setNombre]          = useState(taller.nombre          ?? '')
  const [codigoPais,      setCodigoPais]      = useState(telefonoParseado.codigoPais)
  const [numeroTel,       setNumeroTel]       = useState(telefonoParseado.numero)
  const [direccion,       setDireccion]       = useState(taller.direccion       ?? '')
  const [email,           setEmail]           = useState(taller.email           ?? '')
  const [moneda, setMoneda] = useState<string>(taller.moneda ?? 'MXN')
  const [vigencia,        setVigencia]        = useState(taller.vigencia_dias   ?? 15)
  const [logoUrl,         setLogoUrl]         = useState(taller.logo_url        ?? '')
  const [googleReviewUrl, setGoogleReviewUrl] = useState(taller.google_review_url ?? '')
  const [horario,         setHorario]         = useState(taller.horario   ?? '')
  const [instagram,       setInstagram]       = useState(taller.instagram ?? '')
  const [facebook,        setFacebook]        = useState(taller.facebook  ?? '')
  const [firmaPdf,        setFirmaPdf]        = useState(taller.firma_pdf ?? '')

  const [cargando, setCargando] = useState(false)
  const [subiendo, setSubiendo] = useState(false)
  const [ok,       setOk]       = useState(false)
  const [error,    setError]    = useState('')

  const inputFile = useRef<HTMLInputElement>(null)

  const paisSeleccionado = CODIGOS_PAIS.find(p => p.code === codigoPais)

  function telefonoCompleto() {
    const numero = numeroTel.trim()
    if (!numero) return ''
    return `${paisSeleccionado?.dial} ${numero}`
  }

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
    setLogoUrl(data.publicUrl + '?t=' + Date.now())
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
      telefono: telefonoCompleto(),
      direccion,
      email,
      moneda,
      vigencia_dias: vigencia,
      logo_url:          logoUrl         || undefined,
      google_review_url: googleReviewUrl || undefined,
      horario:           horario         || undefined,
      direccion:         direccion       || undefined,
      instagram:         instagram       || undefined,
      facebook:          facebook        || undefined,
      firma_pdf:         firmaPdf        || undefined,
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
          <div className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden bg-gray-50 flex-shrink-0">
            {logoUrl ? (
              <div className="relative w-full h-full">
                <Image src={logoUrl} alt="Logo" width={120} height={120} className="object-contain p-1" />
              </div>
            ) : (
              <Building2 className="w-8 h-8 text-gray-300" />
            )}
          </div>
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
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre del taller <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={nombre}
            onChange={e => setNombre(e.target.value)}
            placeholder="Ej. Taller Mecánico El Gordo"
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 bg-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Teléfono con selector de país */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
          <div className="flex gap-2">
            <div className="relative">
              <select
                value={codigoPais}
                onChange={e => setCodigoPais(e.target.value)}
                className="appearance-none border border-gray-300 rounded-lg pl-3 pr-8 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                {CODIGOS_PAIS.map(p => (
                  <option key={p.code} value={p.code}>
                    {p.bandera} {p.dial}
                  </option>
                ))}
              </select>
              <svg className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            <input
              type="tel"
              value={numeroTel}
              onChange={e => setNumeroTel(e.target.value.replace(/[^0-9\s\-]/g, ''))}
              placeholder={codigoPais === 'CA' || codigoPais === 'US' ? '416 123 4567' : '55 1234 5678'}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 bg-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {numeroTel && (
            <p className="text-xs text-gray-400 mt-1">
              Se guardará como: <span className="text-gray-600 font-medium">{paisSeleccionado?.dial} {numeroTel}</span>
            </p>
          )}
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
          <p className="text-xs text-gray-400 mt-1">
            Este link se enviará automáticamente al cliente para pedir reseña en Google.
          </p>
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

      {/* Horario y redes sociales */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">Horario y redes sociales</h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Dirección del taller</label>
          <input
            type="text"
            value={direccion}
            onChange={e => setDireccion(e.target.value)}
            placeholder="Ej. Av. Insurgentes Sur 1234, Col. Del Valle, CDMX"
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 bg-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-400 mt-1">Se mostrará como mapa en el portal del cliente.</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Horario de atención</label>
          <input
            type="text"
            value={horario}
            onChange={e => setHorario(e.target.value)}
            placeholder="Ej. Lunes a Viernes 8am - 6pm, Sábados 9am - 2pm"
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 bg-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-400 mt-1">Se mostrará en el portal del cliente.</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Instagram</label>
            <input
              type="text"
              value={instagram}
              onChange={e => setInstagram(e.target.value)}
              placeholder="@tallerelejemplo"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 bg-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Facebook</label>
            <input
              type="text"
              value={facebook}
              onChange={e => setFacebook(e.target.value)}
              placeholder="facebook.com/tallerelejemplo"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 bg-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Firma del PDF */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">Firma del PDF</h2>
        <div>
          <textarea
            value={firmaPdf}
            onChange={e => setFirmaPdf(e.target.value)}
            placeholder="Ej. Gracias por su preferencia. Garantía de 90 días en mano de obra."
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 bg-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
          <p className="text-xs text-gray-400 mt-1">Aparece al pie de todas tus cotizaciones y órdenes en PDF.</p>
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
              onChange={e => setMoneda(e.target.value as any)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="USD">USD — Dólar estadounidense</option>
              <option value="MXN">MXN — Peso mexicano</option>
              <option value="COP">COP — Peso colombiano</option>
              <option value="ARS">ARS — Peso argentino</option>
              <option value="CLP">CLP — Peso chileno</option>
              <option value="PEN">PEN — Sol peruano</option>
              <option value="GTQ">GTQ — Quetzal guatemalteco</option>
              <option value="CRC">CRC — Colón costarricense</option>
              <option value="DOP">DOP — Peso dominicano</option>
              <option value="BOB">BOB — Boliviano</option>
              <option value="PYG">PYG — Guaraní paraguayo</option>
              <option value="UYU">UYU — Peso uruguayo</option>
              <option value="HNL">HNL — Lempira hondureño</option>
              <option value="NIO">NIO — Córdoba nicaragüense</option>
              <option value="EUR">EUR — Euro</option>
              <option value="CAD">CAD — Dólar canadiense</option>
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