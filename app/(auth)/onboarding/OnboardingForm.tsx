'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Building2, Phone, MapPin, Users, ClipboardList,
  CheckCircle2, ChevronRight, Loader2, Upload, Mail,
  Wrench, Shield, Coffee, Star, Bell, ArrowRight
} from 'lucide-react'

interface Props {
  tallerId: string
  nombreTaller: string
}

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

const PASOS = [
  { id: 1, label: 'Tu taller',   icon: Building2    },
  { id: 2, label: 'Tu equipo',   icon: Users        },
  { id: 3, label: 'Primera orden', icon: ClipboardList },
  { id: 4, label: '¡Listo!',    icon: CheckCircle2 },
]

export default function OnboardingForm({ tallerId, nombreTaller }: Props) {
  const router   = useRouter()
  const supabase = createClient()
  const inputRef = useRef<HTMLInputElement>(null)

  const [paso, setPaso]               = useState(1)
  const [cargando, setCargando]       = useState(false)
  const [error, setError]             = useState('')
  const [previewLogo, setPreviewLogo] = useState<string | null>(null)
  const [archivoLogo, setArchivoLogo] = useState<File | null>(null)
  const [codigoPais, setCodigoPais]   = useState('MX')
  const [numeroTel, setNumeroTel]     = useState('')
  const [direccion, setDireccion]     = useState('')

  // Equipo
  const [emailInvitacion, setEmailInvitacion] = useState('')
  const [rolInvitacion, setRolInvitacion]     = useState<'admin' | 'tecnico' | 'recepcion'>('tecnico')
  const [enviando, setEnviando]               = useState(false)
  const [invitados, setInvitados]             = useState<{ email: string; rol: string }[]>([])
  const [exitoInvitacion, setExitoInvitacion] = useState('')
  const [errorInvitacion, setErrorInvitacion] = useState('')

  const paisSeleccionado = CODIGOS_PAIS.find(p => p.code === codigoPais)

  function telefonoCompleto() {
    const numero = numeroTel.trim()
    if (!numero) return ''
    return `${paisSeleccionado?.dial} ${numero}`
  }

  function seleccionarLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { setError('El logo no puede pesar más de 2 MB.'); return }
    setArchivoLogo(file)
    setPreviewLogo(URL.createObjectURL(file))
    setError('')
  }

  async function guardarPaso1() {
    setCargando(true)
    setError('')
    try {
      let logo_url: string | null = null

      if (archivoLogo) {
        const ext  = archivoLogo.name.split('.').pop()
        const path = `${tallerId}/logo.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('logos')
          .upload(path, archivoLogo, { upsert: true, contentType: archivoLogo.type })
        if (!uploadError) {
          const { data: urlData } = supabase.storage.from('logos').getPublicUrl(path)
          logo_url = urlData.publicUrl
        }
      }

      const updates: Record<string, unknown> = {}
      const tel = telefonoCompleto()
      if (tel) updates.telefono = tel
      if (direccion.trim()) updates.direccion = direccion.trim()
      if (logo_url) updates.logo_url = logo_url

      if (Object.keys(updates).length > 0) {
        await supabase.from('talleres').update(updates).eq('id', tallerId)
      }

      setPaso(2)
    } catch {
      setError('Error guardando. Intenta de nuevo.')
    } finally {
      setCargando(false)
    }
  }

  async function enviarInvitacion() {
    if (!emailInvitacion.trim()) { setErrorInvitacion('Ingresa un email'); return }
    setEnviando(true)
    setErrorInvitacion('')
    setExitoInvitacion('')
    try {
      const res  = await fetch('/api/invitaciones', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: emailInvitacion.trim(), rol: rolInvitacion }),
      })
      const data = await res.json()
      if (!res.ok) { setErrorInvitacion(data.error); return }
      setInvitados(prev => [...prev, { email: emailInvitacion.trim(), rol: rolInvitacion }])
      setExitoInvitacion(`Invitación enviada a ${emailInvitacion}`)
      setEmailInvitacion('')
    } catch {
      setErrorInvitacion('Error enviando invitación')
    } finally {
      setEnviando(false)
    }
  }

  async function finalizarOnboarding() {
    setCargando(true)
    await supabase
      .from('talleres')
      .update({ onboarding_completo: true })
      .eq('id', tallerId)
    setCargando(false)
    router.push('/dashboard')
  }

  const ROL_OPTS = [
    { value: 'tecnico',   label: 'Mecánico',      icon: Wrench,  desc: 'Ve y actualiza órdenes' },
    { value: 'admin',     label: 'Admin',          icon: Shield,  desc: 'Acceso total' },
    { value: 'recepcion', label: 'Recepcionista',  icon: Coffee,  desc: 'Crea órdenes y clientes' },
  ]

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-6">
          <a href="/" className="inline-flex flex-col items-center gap-2">
            <img src="/icon-512.png" alt="TallerOS" className="h-14 w-14 object-contain" />
            <span className="text-2xl font-bold text-slate-900">
              Taller<span className="text-blue-600">OS</span>
            </span>
          </a>
        </div>

        {/* Indicador de pasos */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {PASOS.map((p, i) => {
            const completado = paso > p.id
            const activo     = paso === p.id
            const Icon       = p.icon
            return (
              <div key={p.id} className="flex items-center gap-2">
                <div className={`flex flex-col items-center gap-1`}>
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                    completado ? 'bg-green-500' :
                    activo     ? 'bg-blue-600' :
                                 'bg-gray-200'
                  }`}>
                    {completado
                      ? <CheckCircle2 className="w-5 h-5 text-white" />
                      : <Icon className={`w-4 h-4 ${activo ? 'text-white' : 'text-gray-400'}`} />
                    }
                  </div>
                  <span className={`text-xs font-medium hidden sm:block ${
                    activo ? 'text-blue-600' : completado ? 'text-green-600' : 'text-gray-400'
                  }`}>
                    {p.label}
                  </span>
                </div>
                {i < PASOS.length - 1 && (
                  <div className={`w-8 h-0.5 mb-4 ${completado ? 'bg-green-400' : 'bg-gray-200'}`} />
                )}
              </div>
            )
          })}
        </div>

        {/* ── PASO 1: DATOS DEL TALLER ── */}
        {paso === 1 && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-5">
            <div>
              <h1 className="text-xl font-bold text-slate-900">Configura tu taller</h1>
              <p className="text-slate-500 text-sm mt-1">
                <span className="font-semibold text-slate-700">{nombreTaller}</span> está casi listo.
                Estos datos son opcionales.
              </p>
            </div>

            {/* Logo */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5" /> Logo del taller
              </label>
              {previewLogo ? (
                <div
                  className="relative rounded-xl overflow-hidden cursor-pointer border-2 border-blue-200 h-36 flex items-center justify-center"
                  onClick={() => inputRef.current?.click()}
                >
                  <img src={previewLogo} alt="Logo" className="h-28 w-auto object-contain" />
                  <span className="absolute bottom-2 text-xs text-slate-500 bg-white/80 px-2 py-0.5 rounded-full">
                    Toca para cambiar
                  </span>
                </div>
              ) : (
                <div
                  onClick={() => inputRef.current?.click()}
                  className="border-2 border-dashed border-slate-200 rounded-xl h-36 flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
                >
                  <Upload className="w-8 h-8 text-slate-300 mb-2" />
                  <p className="text-sm text-slate-500">Subir logo</p>
                  <p className="text-xs text-slate-400">PNG, JPG o SVG · Máx 2 MB</p>
                </div>
              )}
              <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={seleccionarLogo} className="hidden" />
              {previewLogo && (
                <button onClick={() => { setPreviewLogo(null); setArchivoLogo(null) }} className="text-xs text-slate-400 hover:text-red-500 mt-1">
                  Quitar logo
                </button>
              )}
            </div>

            {/* Teléfono */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5" /> Teléfono
              </label>
              <div className="flex gap-2">
                <select
                  value={codigoPais}
                  onChange={e => setCodigoPais(e.target.value)}
                  className="border border-slate-300 rounded-lg pl-3 pr-8 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                >
                  {CODIGOS_PAIS.map(p => (
                    <option key={p.code} value={p.code}>{p.bandera} {p.dial}</option>
                  ))}
                </select>
                <input
                  type="tel"
                  value={numeroTel}
                  onChange={e => setNumeroTel(e.target.value.replace(/[^0-9\s\-]/g, ''))}
                  placeholder="55 1234 5678"
                  className="flex-1 border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400"
                />
              </div>
            </div>

            {/* Dirección */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" /> Dirección
              </label>
              <input
                type="text"
                value={direccion}
                onChange={e => setDireccion(e.target.value)}
                placeholder="Av. Insurgentes 123, CDMX"
                className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400"
              />
            </div>

            {error && <p className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>}

            <button
              onClick={guardarPaso1}
              disabled={cargando}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {cargando ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {cargando ? 'Guardando...' : <>Siguiente <ChevronRight className="w-4 h-4" /></>}
            </button>
            <button onClick={() => setPaso(2)} className="w-full text-slate-400 hover:text-slate-600 text-sm py-1 transition-colors">
              Omitir por ahora
            </button>
          </div>
        )}

        {/* ── PASO 2: INVITAR EQUIPO ── */}
        {paso === 2 && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-5">
            <div>
              <h1 className="text-xl font-bold text-slate-900">Invita a tu equipo</h1>
              <p className="text-slate-500 text-sm mt-1">
                Agrega a tus mecánicos y recepcionistas para que empiecen a usar TallerOS.
              </p>
            </div>

            {/* Roles */}
            <div className="grid grid-cols-3 gap-2">
              {ROL_OPTS.map(r => {
                const Icon = r.icon
                return (
                  <button
                    key={r.value}
                    onClick={() => setRolInvitacion(r.value as any)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-center ${
                      rolInvitacion === r.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${rolInvitacion === r.value ? 'text-blue-600' : 'text-gray-400'}`} />
                    <span className={`text-xs font-semibold ${rolInvitacion === r.value ? 'text-blue-700' : 'text-gray-600'}`}>
                      {r.label}
                    </span>
                    <span className="text-xs text-gray-400 leading-tight">{r.desc}</span>
                  </button>
                )
              })}
            </div>

            {/* Email */}
            <div className="flex gap-2">
              <input
                type="email"
                value={emailInvitacion}
                onChange={e => setEmailInvitacion(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && enviarInvitacion()}
                placeholder="mecanico@ejemplo.com"
                className="flex-1 border border-slate-300 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400"
              />
              <button
                onClick={enviarInvitacion}
                disabled={enviando}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-4 py-2.5 rounded-xl transition-colors flex items-center gap-1.5 text-sm font-medium"
              >
                {enviando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                Invitar
              </button>
            </div>

            {errorInvitacion && <p className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">{errorInvitacion}</p>}
            {exitoInvitacion && <p className="text-green-600 text-sm bg-green-50 rounded-lg px-3 py-2">✅ {exitoInvitacion}</p>}

            {/* Lista de invitados */}
            {invitados.length > 0 && (
              <div className="space-y-2">
                {invitados.map((inv, i) => (
                  <div key={i} className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm text-green-800 truncate">{inv.email}</span>
                    <span className="text-xs text-green-600 ml-auto capitalize">{inv.rol}</span>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => setPaso(3)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              Siguiente <ChevronRight className="w-4 h-4" />
            </button>
            <button onClick={() => setPaso(3)} className="w-full text-slate-400 hover:text-slate-600 text-sm py-1 transition-colors">
              Omitir por ahora
            </button>
          </div>
        )}

        {/* ── PASO 3: PRIMERA ORDEN ── */}
        {paso === 3 && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-5">
            <div>
              <h1 className="text-xl font-bold text-slate-900">Crea tu primera orden</h1>
              <p className="text-slate-500 text-sm mt-1">
                Registra un vehículo real o de prueba para ver cómo funciona TallerOS en acción.
              </p>
            </div>

            {/* Ilustración */}
            <div className="bg-blue-50 rounded-2xl p-6 text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <ClipboardList className="w-8 h-8 text-blue-600" />
              </div>
              <p className="text-sm font-semibold text-blue-900 mb-1">Flujo completo en minutos</p>
              <p className="text-xs text-blue-700 leading-relaxed">
                Registra el cliente → toma fotos → asigna mecánico → notifica por WhatsApp → entrega con reseña automática
              </p>
            </div>

            <button
              onClick={async () => {
                await supabase.from('talleres').update({ onboarding_completo: true }).eq('id', tallerId)
                router.push('/ordenes/nueva')
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <ClipboardList className="w-4 h-4" />
              Crear mi primera orden
            </button>

            <button
              onClick={() => setPaso(4)}
              className="w-full text-slate-400 hover:text-slate-600 text-sm py-1 transition-colors"
            >
              Ir al dashboard primero
            </button>
          </div>
        )}

        {/* ── PASO 4: CHECKLIST DE ACTIVACIÓN ── */}
        {paso === 4 && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-5">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h1 className="text-xl font-bold text-slate-900">¡Tu taller está listo!</h1>
              <p className="text-slate-500 text-sm mt-1">
                Completa estos pasos para sacarle el máximo provecho a TallerOS.
              </p>
            </div>

            <div className="space-y-3">
              {[
                {
                  icon: Building2,
                  label: 'Datos del taller',
                  desc: 'Logo, teléfono y dirección',
                  href: '/configuracion',
                  completado: true,
                },
                {
                  icon: Users,
                  label: 'Invitar equipo',
                  desc: 'Mecánicos y recepcionistas',
                  href: '/configuracion/equipo',
                  completado: invitados.length > 0,
                },
                {
                  icon: Star,
                  label: 'Link de Google Reviews',
                  desc: 'Para pedir reseñas automáticas',
                  href: '/configuracion',
                  completado: false,
                },
                {
                  icon: Bell,
                  label: 'Recordatorios de mantenimiento',
                  desc: 'Recupera clientes inactivos',
                  href: '/recordatorios',
                  completado: false,
                },
                {
                  icon: ClipboardList,
                  label: 'Primera orden',
                  desc: 'Registra tu primer vehículo',
                  href: '/ordenes/nueva',
                  completado: false,
                },
              ].map(item => {
                const Icon = item.icon
                return (
                  <a
                    key={item.label}
                    href={item.href}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all hover:shadow-sm ${
                      item.completado
                        ? 'border-green-200 bg-green-50'
                        : 'border-gray-200 bg-white hover:border-blue-300'
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      item.completado ? 'bg-green-100' : 'bg-gray-100'
                    }`}>
                      {item.completado
                        ? <CheckCircle2 className="w-5 h-5 text-green-600" />
                        : <Icon className="w-5 h-5 text-gray-500" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold ${item.completado ? 'text-green-800' : 'text-gray-900'}`}>
                        {item.label}
                      </p>
                      <p className="text-xs text-gray-400">{item.desc}</p>
                    </div>
                    {!item.completado && <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />}
                  </a>
                )
              })}
            </div>

            <button
              onClick={finalizarOnboarding}
              disabled={cargando}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {cargando ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {cargando ? 'Cargando...' : <>Ir a mi dashboard <ArrowRight className="w-4 h-4" /></>}
            </button>
          </div>
        )}

      </div>
    </main>
  )
}