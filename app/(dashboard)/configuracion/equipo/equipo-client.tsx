'use client'

import { useState } from 'react'
import { Usuario, RolUsuario } from '@/types'
import { Loader2, UserPlus, Mail, Trash2, Shield, Wrench, Coffee, Lock, MessageCircle, Copy, Check } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { buildWhatsAppLink } from '@/lib/whatsapp-link'
import CampoTelefono from '@/components/ui/CampoTelefono'

const ROL_CONFIG: Record<string, { label: string; color: string; icon: any; descripcion: string }> = {
  propietario: { label: 'Propietario',    color: 'bg-purple-100 text-purple-700', icon: Shield,  descripcion: 'Acceso total' },
  admin:       { label: 'Administrador',  color: 'bg-blue-100 text-blue-700',     icon: Shield,  descripcion: 'Acceso total excepto facturación' },
  tecnico:     { label: 'Mecánico',       color: 'bg-orange-100 text-orange-700', icon: Wrench,  descripcion: 'Ve órdenes asignadas, cambia estados' },
  recepcion:   { label: 'Recepcionista',  color: 'bg-green-100 text-green-700',   icon: Coffee,  descripcion: 'Crea órdenes y clientes, no ve finanzas' },
}

const INPUT = 'w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400'

interface Props {
  miembros:      Usuario[]
  rolActual:     RolUsuario
  tallerId:      string
  puedeInvitar:  boolean
  limitePlan:    number
  tallerNombre:  string
  pais:          string | null
}

/** Lo que queda en pantalla tras invitar: el link vale por sí solo. */
interface Invitacion {
  link:          string
  nombre:        string
  email:         string
  telefono:      string
  correoEnviado: boolean
}

export default function EquipoClient({
  miembros: miembrosIniciales,
  rolActual,
  tallerId,
  puedeInvitar,
  limitePlan,
  tallerNombre,
  pais,
}: Props) {
  const [miembros, setMiembros]     = useState(miembrosIniciales)
  const [nombre, setNombre]         = useState('')
  const [email, setEmail]           = useState('')
  const [telefono, setTelefono]     = useState('')
  const [rol, setRol]               = useState<'admin' | 'tecnico' | 'recepcion'>('tecnico')
  const [enviando, setEnviando]     = useState(false)
  const [invitacion, setInvitacion] = useState<Invitacion | null>(null)
  const [copiado, setCopiado]       = useState(false)
  const [error, setError]           = useState('')
  const [eliminando, setEliminando] = useState<string | null>(null)
  const router = useRouter()

  const handleInvitar = async () => {
    if (!puedeInvitar) {
      router.push('/configuracion/plan')
      return
    }
    if (!nombre.trim())   { setError('El nombre es requerido'); return }
    if (!email.trim())    { setError('El email es requerido'); return }
    if (!telefono.trim()) { setError('El WhatsApp es requerido: es por donde le llega la invitación'); return }
    setEnviando(true)
    setError('')
    setInvitacion(null)
    setCopiado(false)

    try {
      const res  = await fetch('/api/invitaciones', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ nombre: nombre.trim(), email: email.trim(), telefono: telefono.trim(), rol }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      setInvitacion({
        link:          data.link,
        nombre:        nombre.trim(),
        email:         email.trim(),
        telefono:      telefono.trim(),
        correoEnviado: data.correoEnviado !== false,
      })
      setNombre('')
      setEmail('')
      setTelefono('')
    } catch {
      setError('Error enviando la invitación')
    } finally {
      setEnviando(false)
    }
  }

  const copiarLink = async () => {
    if (!invitacion) return
    try {
      await navigator.clipboard.writeText(invitacion.link)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch {
      setError('No se pudo copiar. Mantén pulsado el link para copiarlo a mano.')
    }
  }

  const handleEliminar = async (usuarioId: string) => {
    if (!confirm('¿Eliminar este miembro del taller?')) return
    setEliminando(usuarioId)
    try {
      await fetch(`/api/equipo/${usuarioId}`, { method: 'DELETE' })
      setMiembros(prev => prev.filter(m => m.id !== usuarioId))
    } finally {
      setEliminando(null)
    }
  }

  const handleCambiarRol = async (usuarioId: string, nuevoRol: RolUsuario) => {
    await fetch(`/api/equipo/${usuarioId}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ rol: nuevoRol }),
    })
    setMiembros(prev => prev.map(m => m.id === usuarioId ? { ...m, rol: nuevoRol } : m))
  }

  return (
    <div className="space-y-6">

      {/* Invitar nuevo miembro */}
      <div className={`bg-white rounded-xl border p-6 ${!puedeInvitar ? 'border-red-200 opacity-75' : 'border-gray-200'}`}>
        <div className="flex items-center gap-2 mb-4">
          <UserPlus className="w-4 h-4 text-blue-500" />
          <h2 className="text-sm font-semibold text-gray-900">Invitar miembro</h2>
          {!puedeInvitar && (
            <span className="ml-auto flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 px-2 py-1 rounded-full">
              <Lock className="w-3 h-3" />
              Límite alcanzado
            </span>
          )}
        </div>

        {!puedeInvitar ? (
          <div className="text-center py-4">
            <Lock className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-semibold text-gray-700 mb-1">
              Has alcanzado el límite de {limitePlan} usuarios
            </p>
            <p className="text-xs text-gray-500 mb-4">
              Actualiza tu plan para agregar más miembros al equipo sin límites.
            </p>
            <button
              onClick={() => router.push('/configuracion/plan')}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-4 py-2 rounded-lg transition-colors"
            >
              Ver planes →
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
              <input
                type="text"
                value={nombre}
                onChange={e => setNombre(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleInvitar()}
                placeholder="Juan Pérez"
                className={INPUT}
              />
              <p className="text-xs text-gray-400 mt-1">
                Así aparecerá en el desplegable de &ldquo;Mecánico asignado&rdquo;.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleInvitar()}
                placeholder="empleado@ejemplo.com"
                className={INPUT}
              />
              <p className="text-xs text-gray-400 mt-1">
                Le sirve para entrar a TallerOS. No hace falta que lo revise.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp</label>
              <CampoTelefono
                valor={telefono}
                onChange={setTelefono}
                paisPorDefecto={pais}
                className={INPUT}
                placeholder="Su número, sin la lada"
              />
              <p className="text-xs text-gray-400 mt-1">
                Por aquí le llega la invitación.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
              <div className="grid grid-cols-3 gap-2">
                {(['admin', 'tecnico', 'recepcion'] as const).map(r => {
                  const cfg  = ROL_CONFIG[r]
                  const Icon = cfg.icon
                  return (
                    <button
                      key={r}
                      onClick={() => setRol(r)}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-all text-center ${
                        rol === r ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${rol === r ? 'text-blue-600' : 'text-gray-400'}`} />
                      <span className={`text-xs font-semibold ${rol === r ? 'text-blue-700' : 'text-gray-600'}`}>
                        {cfg.label}
                      </span>
                      <span className="text-xs text-gray-400 leading-tight">{cfg.descripcion}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

            {invitacion && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
                <div>
                  <p className="text-sm font-semibold text-green-800">
                    Invitación creada para {invitacion.nombre}
                  </p>
                  <p className="text-xs text-green-700 mt-0.5">
                    {invitacion.correoEnviado
                      ? 'Le mandamos el correo de respaldo. Ahora mándale el link por WhatsApp:'
                      : 'El correo no salió, pero la invitación es válida. Mándale el link por WhatsApp:'}
                  </p>
                </div>

                <div className="flex gap-2">
                  {/* Un <a> de verdad, no window.open tras el await: el
                      navegador bloquea las ventanas que no salen de un toque
                      directo, y en el móvil eso significaba no abrir nada. */}
                  <a
                    href={buildWhatsAppLink(
                      invitacion.telefono,
                      `Hola ${invitacion.nombre.split(' ')[0]}, te invito a unirte a ${tallerNombre} en TallerOS.\n\n` +
                      `Ábrelo desde tu teléfono y crea tu contraseña:\n${invitacion.link}\n\n` +
                      `Tu correo para entrar es: ${invitacion.email}\n` +
                      `El link vence en 7 días.`,
                      pais,
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Enviar por WhatsApp
                  </a>
                  <button
                    onClick={copiarLink}
                    className="flex items-center justify-center gap-2 border border-green-300 bg-white text-green-700 text-sm font-semibold px-4 py-2.5 rounded-lg hover:bg-green-50 transition-colors"
                  >
                    {copiado ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copiado ? 'Copiado' : 'Copiar'}
                  </button>
                </div>

                <p className="text-xs text-green-600 break-all">{invitacion.link}</p>
              </div>
            )}

            <button
              onClick={handleInvitar}
              disabled={enviando}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
            >
              {enviando
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Enviando...</>
                : <><Mail className="w-4 h-4" /> Enviar invitación</>
              }
            </button>
          </div>
        )}
      </div>

      {/* Lista de miembros */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">
            Miembros del taller ({miembros.length}{limitePlan !== -1 ? `/${limitePlan}` : ''})
          </h2>
        </div>
        <div className="divide-y divide-gray-50">
          {miembros.map(m => {
            const cfg           = ROL_CONFIG[m.rol] ?? ROL_CONFIG.tecnico
            const Icon          = cfg.icon
            const esPropietario = m.rol === 'propietario'
            const puedeEditar   = rolActual === 'propietario' && !esPropietario

            return (
              <div key={m.id} className="flex items-center gap-4 px-6 py-4">
                <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-gray-600">
                    {m.nombre.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{m.nombre}</p>
                  <p className="text-xs text-gray-400 truncate">{m.email}</p>
                </div>
                {puedeEditar ? (
                  <select
                    value={m.rol}
                    onChange={e => handleCambiarRol(m.id, e.target.value as RolUsuario)}
                    className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-700 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="admin">Administrador</option>
                    <option value="tecnico">Mecánico</option>
                    <option value="recepcion">Recepcionista</option>
                  </select>
                ) : (
                  <span className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${cfg.color}`}>
                    <Icon className="w-3 h-3" />
                    {cfg.label}
                  </span>
                )}
                {puedeEditar && (
                  <button
                    onClick={() => handleEliminar(m.id)}
                    disabled={eliminando === m.id}
                    className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500 transition-colors"
                  >
                    {eliminando === m.id
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : <Trash2 className="w-3.5 h-3.5" />
                    }
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}