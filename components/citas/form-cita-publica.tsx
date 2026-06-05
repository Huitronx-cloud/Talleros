'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle2, Loader2, Calendar, Clock, User, Phone, Car, ChevronLeft, ChevronRight } from 'lucide-react'

const INPUT = 'w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400'
const LABEL = 'block text-sm font-medium text-gray-700 mb-1'

const HORARIOS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '13:00', '13:30', '14:00',
  '14:30', '15:00', '15:30', '16:00', '16:30', '17:00',
]

function getDiasDelMes(año: number, mes: number) {
  const dias = []
  const primerDia = new Date(año, mes, 1).getDay()
  const totalDias = new Date(año, mes + 1, 0).getDate()
  // Padding inicial
  for (let i = 0; i < primerDia; i++) dias.push(null)
  for (let i = 1; i <= totalDias; i++) dias.push(i)
  return dias
}

function formatFecha(año: number, mes: number, dia: number) {
  return `${año}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
}

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const DIAS  = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb']

interface HorarioDia { abre: string; cierra: string }

interface CitasConfig {
  horario:         Record<string, HorarioDia | null>
  limite_por_dia:  number
  dias_bloqueados: string[]
}

interface Props {
  tallerId:      string
  tallerNombre:  string
  citasOcupadas: { fecha: string; hora: string }[]
  citasConfig:   CitasConfig | null
}

export default function FormCitaPublica({ tallerId, tallerNombre, citasOcupadas: citasIniciales, citasConfig }: Props) {
  const supabase = createClient()
  const hoy      = new Date()

  const [paso, setPaso]         = useState<1 | 2 | 3>(1)
  const [enviando, setEnviando] = useState(false)
  const [listo, setListo]       = useState(false)
  const [error, setError]       = useState('')

  // Calendario
  const [mesVista, setMesVista] = useState(hoy.getMonth())
  const [añoVista, setAñoVista] = useState(hoy.getFullYear())
  const [fechaSeleccionada, setFechaSeleccionada] = useState('')
  const [horaSeleccionada, setHoraSeleccionada]   = useState('')

  // Disponibilidad en tiempo real
  const [citasOcupadas, setCitasOcupadas] = useState(citasIniciales)

  // Datos del cliente
  const [form, setForm] = useState({
    cliente_nombre:   '',
    cliente_telefono: '',
    cliente_email:    '',
    vehiculo_marca:   '',
    vehiculo_modelo:  '',
    placas:           '',
    descripcion:      '',
  })

  // Suscripción realtime a nuevas citas
  useEffect(() => {
    const channel = supabase
      .channel('citas-publicas')
      .on('postgres_changes', {
        event:  '*',
        schema: 'public',
        table:  'citas',
        filter: `taller_id=eq.${tallerId}`,
      }, async () => {
        // Refrescar citas ocupadas
        const hoyStr    = new Date().toISOString().split('T')[0]
        const en30dias  = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        const { data }  = await supabase
          .from('citas')
          .select('fecha, hora')
          .eq('taller_id', tallerId)
          .gte('fecha', hoyStr)
          .lte('fecha', en30dias)
          .neq('estado', 'cancelada')
        if (data) setCitasOcupadas(data)
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [tallerId])

  const horariosOcupados = (fecha: string) =>
    citasOcupadas.filter(c => c.fecha === fecha).map(c => c.hora.slice(0, 5))

  const DIAS_SEMANA: Record<number, string> = {
    0: 'domingo', 1: 'lunes', 2: 'martes', 3: 'miercoles',
    4: 'jueves',  5: 'viernes', 6: 'sabado',
  }

  const esDiaBloqueado = (fecha: string) =>
    citasConfig?.dias_bloqueados?.includes(fecha) ?? false

  const esDiaCerrado = (dia: number) => {
    if (!citasConfig) return false
    const fecha   = new Date(añoVista, mesVista, dia)
    const diaSem  = DIAS_SEMANA[fecha.getDay()]
    return citasConfig.horario[diaSem] === null
  }

  const limitePorDia = citasConfig?.limite_por_dia ?? 18

  const esDiaOcupado = (fecha: string) =>
    horariosOcupados(fecha).length >= limitePorDia

  const horariosDisponibles = (fecha: string) => {
    if (!citasConfig) return HORARIOS
    const fechaObj = new Date(fecha + 'T12:00:00')
    const diaSem   = DIAS_SEMANA[fechaObj.getDay()]
    const horario  = citasConfig.horario[diaSem]
    if (!horario) return []
    return HORARIOS.filter(h => h >= horario.abre && h <= horario.cierra)
  }

  const esPasado = (dia: number) => {
    const fecha = new Date(añoVista, mesVista, dia)
    fecha.setHours(0, 0, 0, 0)
    const hoyDate = new Date()
    hoyDate.setHours(0, 0, 0, 0)
    return fecha < hoyDate
  }

  const esDomingo = (dia: number) => !citasConfig && new Date(añoVista, mesVista, dia).getDay() === 0

  const dias = getDiasDelMes(añoVista, mesVista)

  const handleSubmit = async () => {
    if (!form.cliente_nombre.trim())   { setError('El nombre es obligatorio'); return }
    if (!form.cliente_telefono.trim()) { setError('El teléfono es obligatorio'); return }

    setEnviando(true)
    setError('')

    const { data: nuevaCita, error: err } = await supabase.from('citas').insert({
      taller_id:        tallerId,
      cliente_nombre:   form.cliente_nombre.trim(),
      cliente_telefono: form.cliente_telefono.trim(),
      cliente_email:    form.cliente_email.trim() || null,
      vehiculo_marca:   form.vehiculo_marca.trim() || null,
      vehiculo_modelo:  form.vehiculo_modelo.trim() || null,
      placas:           form.placas.trim() || null,
      descripcion:      form.descripcion.trim() || null,
      fecha:            fechaSeleccionada,
      hora:             horaSeleccionada,
      estado:           'pendiente',
    }).select('id').single()

    if (err) { setError('Error al agendar. Intenta de nuevo.'); setEnviando(false); return }

    // Notificar al taller — nueva cita pendiente
    try {
      await fetch('/api/notificar-cita', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          tallerId,
          clienteNombre:  form.cliente_nombre.trim(),
          fecha:          fechaSeleccionada,
          hora:           horaSeleccionada,
        }),
      })
    } catch {}

    // Enviar acuse de recibo al cliente (WhatsApp + email)
    if (nuevaCita?.id) {
      try {
        await fetch('/api/notificar-reserva-cliente', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ citaId: nuevaCita.id, tallerId }),
        })
      } catch {}
    }

    setListo(true)
    setEnviando(false)
  }

  // ── CONFIRMACIÓN ──
  if (listo) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-10 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">¡Cita agendada!</h2>
        <p className="text-gray-500 text-sm mb-1">
          <span className="font-semibold">{tallerNombre}</span> te espera el
        </p>
        <p className="text-2xl font-bold text-blue-600 mb-1">
          {new Date(fechaSeleccionada + 'T12:00:00').toLocaleDateString('es-MX', {
            weekday: 'long', day: 'numeric', month: 'long',
          })}
        </p>
        <p className="text-lg font-semibold text-gray-700 mb-4">a las {horaSeleccionada}</p>
        <p className="text-xs text-gray-400">Recibirás confirmación por WhatsApp. ¡Hasta pronto!</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">

      {/* Indicador de pasos */}
      <div className="flex items-center gap-2 mb-2">
        {[1, 2, 3].map(n => (
          <div key={n} className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
              paso >= n ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'
            }`}>{n}</div>
            <span className={`text-xs font-medium ${paso >= n ? 'text-gray-700' : 'text-gray-400'}`}>
              {n === 1 ? 'Fecha y hora' : n === 2 ? 'Tus datos' : 'Confirmar'}
            </span>
            {n < 3 && <div className={`h-px w-6 ${paso > n ? 'bg-blue-600' : 'bg-gray-200'}`} />}
          </div>
        ))}
      </div>

      {/* ── PASO 1: CALENDARIO ── */}
      {paso === 1 && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <h2 className="text-base font-bold text-gray-900 mb-4">¿Cuándo quieres venir?</h2>

          {/* Calendario */}
          <div className="mb-5">
            {/* Navegación del mes */}
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={() => {
                  if (mesVista === 0) { setMesVista(11); setAñoVista(a => a - 1) }
                  else setMesVista(m => m - 1)
                }}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-gray-500" />
              </button>
              <p className="text-sm font-bold text-gray-900">
                {MESES[mesVista]} {añoVista}
              </p>
              <button
                onClick={() => {
                  if (mesVista === 11) { setMesVista(0); setAñoVista(a => a + 1) }
                  else setMesVista(m => m + 1)
                }}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            {/* Días de la semana */}
            <div className="grid grid-cols-7 mb-1">
              {DIAS.map(d => (
                <div key={d} className="text-center text-xs font-semibold text-gray-400 py-1">{d}</div>
              ))}
            </div>

            {/* Días del mes */}
            <div className="grid grid-cols-7 gap-1">
              {dias.map((dia, i) => {
                if (!dia) return <div key={i} />
                const fecha    = formatFecha(añoVista, mesVista, dia)
                const pasado        = esPasado(dia)
                const domingo       = esDomingo(dia)
                const ocupado       = esDiaOcupado(fecha)
                const bloqueado     = esDiaBloqueado(fecha)
                const cerrado       = esDiaCerrado(dia)
                const seleccionado  = fecha === fechaSeleccionada
                const deshabilitado = pasado || domingo || ocupado || bloqueado || cerrado

                return (
                  <button
                    key={i}
                    onClick={() => { if (!deshabilitado) { setFechaSeleccionada(fecha); setHoraSeleccionada('') } }}
                    disabled={deshabilitado}
                    className={`aspect-square rounded-lg text-sm font-medium transition-all ${
                      seleccionado
                        ? 'bg-blue-600 text-white shadow-sm'
                        : deshabilitado
                        ? 'text-gray-300 cursor-not-allowed'
                        : 'hover:bg-blue-50 text-gray-900 hover:text-blue-600'
                    }`}
                  >
                    {dia}
                    {ocupado && !pasado && !domingo && (
                      <div className="w-1 h-1 bg-red-400 rounded-full mx-auto mt-0.5" />
                    )}
                  </button>
                )
              })}
            </div>

            {/* Leyenda */}
            <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-red-400" />
                <span>Sin disponibilidad</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-blue-600" />
                <span>Seleccionado</span>
              </div>
            </div>
          </div>

          {/* Horarios disponibles */}
          {fechaSeleccionada && (
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-3">
                Horarios disponibles —{' '}
                <span className="text-blue-600">
                  {new Date(fechaSeleccionada + 'T12:00:00').toLocaleDateString('es-MX', {
                    weekday: 'long', day: 'numeric', month: 'long',
                  })}
                </span>
              </p>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {horariosDisponibles(fechaSeleccionada).map(hora => {
                  const ocupado    = horariosOcupados(fechaSeleccionada).includes(hora)
                  const seleccionado = hora === horaSeleccionada
                  return (
                    <button
                      key={hora}
                      onClick={() => !ocupado && setHoraSeleccionada(hora)}
                      disabled={ocupado}
                      className={`py-2 rounded-lg text-sm font-semibold border-2 transition-all ${
                        seleccionado
                          ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                          : ocupado
                          ? 'bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed line-through'
                          : 'bg-white border-gray-200 text-gray-700 hover:border-blue-400 hover:text-blue-600'
                      }`}
                    >
                      {hora}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          <button
            onClick={() => {
              if (!fechaSeleccionada) { setError('Selecciona una fecha'); return }
              if (!horaSeleccionada)  { setError('Selecciona un horario'); return }
              setError('')
              setPaso(2)
            }}
            disabled={!fechaSeleccionada || !horaSeleccionada}
            className="w-full mt-5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-sm font-semibold py-3 rounded-xl transition-colors"
          >
            Continuar →
          </button>
          {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
        </div>
      )}

      {/* ── PASO 2: DATOS DEL CLIENTE ── */}
      {paso === 2 && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4">
          <h2 className="text-base font-bold text-gray-900">Tus datos</h2>

          <div>
            <label className={LABEL}>Nombre completo <span className="text-red-500">*</span></label>
            <input type="text" value={form.cliente_nombre}
              onChange={e => setForm(p => ({ ...p, cliente_nombre: e.target.value }))}
              placeholder="Tu nombre" className={INPUT} autoFocus />
          </div>
          <div>
            <label className={LABEL}>WhatsApp <span className="text-red-500">*</span></label>
            <input type="tel" value={form.cliente_telefono}
              onChange={e => setForm(p => ({ ...p, cliente_telefono: e.target.value }))}
              placeholder="10 dígitos" className={INPUT} />
          </div>
          <div>
            <label className={LABEL}>Email (opcional)</label>
            <input type="email" value={form.cliente_email}
              onChange={e => setForm(p => ({ ...p, cliente_email: e.target.value }))}
              placeholder="tu@email.com" className={INPUT} />
          </div>

          <div className="border-t border-gray-100 pt-4">
            <p className="text-sm font-semibold text-gray-700 mb-3">Datos del vehículo</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={LABEL}>Marca</label>
                <input type="text" value={form.vehiculo_marca}
                  onChange={e => setForm(p => ({ ...p, vehiculo_marca: e.target.value }))}
                  placeholder="Toyota" className={INPUT} />
              </div>
              <div>
                <label className={LABEL}>Modelo</label>
                <input type="text" value={form.vehiculo_modelo}
                  onChange={e => setForm(p => ({ ...p, vehiculo_modelo: e.target.value }))}
                  placeholder="Corolla" className={INPUT} />
              </div>
            </div>
            <div className="mt-3">
              <label className={LABEL}>Placas</label>
              <input type="text" value={form.placas}
                onChange={e => setForm(p => ({ ...p, placas: e.target.value.toUpperCase() }))}
                placeholder="ABC-123" className={INPUT} />
            </div>
          </div>

          <div>
            <label className={LABEL}>¿Qué necesitas? (opcional)</label>
            <textarea rows={2} value={form.descripcion}
              onChange={e => setForm(p => ({ ...p, descripcion: e.target.value }))}
              placeholder="Describe el servicio que necesitas..."
              className={`${INPUT} resize-none`} />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-3">
            <button onClick={() => setPaso(1)}
              className="px-4 py-3 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50">
              ← Atrás
            </button>
            <button
              onClick={() => {
                if (!form.cliente_nombre.trim())   { setError('El nombre es obligatorio'); return }
                if (!form.cliente_telefono.trim()) { setError('El teléfono es obligatorio'); return }
                setError('')
                setPaso(3)
              }}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-3 rounded-xl transition-colors"
            >
              Continuar →
            </button>
          </div>
        </div>
      )}

      {/* ── PASO 3: CONFIRMACIÓN ── */}
      {paso === 3 && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4">
          <h2 className="text-base font-bold text-gray-900">Confirma tu cita</h2>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span className="font-semibold text-blue-900">
                {new Date(fechaSeleccionada + 'T12:00:00').toLocaleDateString('es-MX', {
                  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
                })}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-blue-600" />
              <span className="font-semibold text-blue-900">{horaSeleccionada} hrs</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <User className="w-4 h-4 text-blue-600" />
              <span className="text-blue-800">{form.cliente_nombre}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Phone className="w-4 h-4 text-blue-600" />
              <span className="text-blue-800">{form.cliente_telefono}</span>
            </div>
            {(form.vehiculo_marca || form.vehiculo_modelo) && (
              <div className="flex items-center gap-2 text-sm">
                <Car className="w-4 h-4 text-blue-600" />
                <span className="text-blue-800">
                  {[form.vehiculo_marca, form.vehiculo_modelo, form.placas].filter(Boolean).join(' · ')}
                </span>
              </div>
            )}
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-3">
            <button onClick={() => setPaso(2)}
              className="px-4 py-3 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50">
              ← Atrás
            </button>
            <button
              onClick={handleSubmit}
              disabled={enviando}
              className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white text-sm font-bold py-3 rounded-xl transition-colors"
            >
              {enviando
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Agendando...</>
                : '✓ Confirmar cita'
              }
            </button>
          </div>
        </div>
      )}
    </div>
  )
}