'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle2, Loader2, Calendar, Clock, User, Phone, Car } from 'lucide-react'

const INPUT = 'w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400'
const LABEL = 'block text-sm font-medium text-gray-700 mb-1'

const HORARIOS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '13:00', '13:30', '14:00',
  '14:30', '15:00', '15:30', '16:00', '16:30', '17:00',
]

export default function FormCitaPublica({ tallerId, tallerNombre }: { tallerId: string; tallerNombre: string }) {
  const supabase = createClient()
  const [enviando, setEnviando] = useState(false)
  const [listo, setListo]       = useState(false)
  const [error, setError]       = useState('')

  const hoy = new Date().toISOString().split('T')[0]

  const [form, setForm] = useState({
    cliente_nombre:   '',
    cliente_telefono: '',
    cliente_email:    '',
    vehiculo_marca:   '',
    vehiculo_modelo:  '',
    placas:           '',
    descripcion:      '',
    fecha:            '',
    hora:             '',
  })

  const handleSubmit = async () => {
    if (!form.cliente_nombre.trim()) { setError('El nombre es obligatorio'); return }
    if (!form.cliente_telefono.trim()) { setError('El teléfono es obligatorio'); return }
    if (!form.fecha) { setError('Selecciona una fecha'); return }
    if (!form.hora)  { setError('Selecciona un horario'); return }

    setEnviando(true)
    setError('')

    const { error: err } = await supabase.from('citas').insert({
      taller_id:        tallerId,
      cliente_nombre:   form.cliente_nombre.trim(),
      cliente_telefono: form.cliente_telefono.trim(),
      cliente_email:    form.cliente_email.trim() || null,
      vehiculo_marca:   form.vehiculo_marca.trim() || null,
      vehiculo_modelo:  form.vehiculo_modelo.trim() || null,
      placas:           form.placas.trim().toUpperCase() || null,
      descripcion:      form.descripcion.trim() || null,
      fecha:            form.fecha,
      hora:             form.hora,
      estado:           'pendiente',
    })

    if (err) {
      setError('Error al agendar. Intenta de nuevo.')
      setEnviando(false)
      return
    }

    setListo(true)
    setEnviando(false)
  }

  if (listo) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
        <CheckCircle2 className="w-14 h-14 text-green-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">¡Cita agendada!</h2>
        <p className="text-gray-500 text-sm mb-1">
          Tu cita en <span className="font-semibold">{tallerNombre}</span> fue registrada exitosamente.
        </p>
        <p className="text-gray-400 text-sm">
          El taller confirmará tu cita pronto. Te contactarán al número que proporcionaste.
        </p>
        <div className="mt-6 bg-gray-50 rounded-xl p-4 text-left text-sm space-y-1">
          <p><span className="text-gray-400">Fecha:</span> <span className="font-medium">{new Date(form.fecha + 'T12:00:00').toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}</span></p>
          <p><span className="text-gray-400">Hora:</span> <span className="font-medium">{form.hora}</span></p>
          <p><span className="text-gray-400">Teléfono:</span> <span className="font-medium">{form.cliente_telefono}</span></p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">

      {/* Datos del cliente */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <User className="w-4 h-4 text-blue-600" />
          <h2 className="text-sm font-bold text-gray-900">Tus datos</h2>
        </div>
        <div className="space-y-3">
          <div>
            <label className={LABEL}>Nombre completo <span className="text-red-500">*</span></label>
            <input type="text" value={form.cliente_nombre} onChange={e => setForm(p => ({ ...p, cliente_nombre: e.target.value }))} placeholder="Juan García" className={INPUT} />
          </div>
          <div>
            <label className={LABEL}>WhatsApp <span className="text-red-500">*</span></label>
            <input type="tel" value={form.cliente_telefono} onChange={e => setForm(p => ({ ...p, cliente_telefono: e.target.value }))} placeholder="+52 55 1234 5678" className={INPUT} />
          </div>
          <div>
            <label className={LABEL}>Email (opcional)</label>
            <input type="email" value={form.cliente_email} onChange={e => setForm(p => ({ ...p, cliente_email: e.target.value }))} placeholder="juan@email.com" className={INPUT} />
          </div>
        </div>
      </div>

      {/* Datos del vehículo */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Car className="w-4 h-4 text-blue-600" />
          <h2 className="text-sm font-bold text-gray-900">Tu vehículo</h2>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={LABEL}>Marca</label>
            <input type="text" value={form.vehiculo_marca} onChange={e => setForm(p => ({ ...p, vehiculo_marca: e.target.value }))} placeholder="Toyota" className={INPUT} />
          </div>
          <div>
            <label className={LABEL}>Modelo</label>
            <input type="text" value={form.vehiculo_modelo} onChange={e => setForm(p => ({ ...p, vehiculo_modelo: e.target.value }))} placeholder="Corolla" className={INPUT} />
          </div>
          <div className="col-span-2">
            <label className={LABEL}>Placas</label>
            <input type="text" value={form.placas} onChange={e => setForm(p => ({ ...p, placas: e.target.value.toUpperCase() }))} placeholder="ABC-123" className={INPUT} />
          </div>
        </div>
      </div>

      {/* Fecha y hora */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-4 h-4 text-blue-600" />
          <h2 className="text-sm font-bold text-gray-900">Fecha y hora</h2>
        </div>
        <div className="space-y-3">
          <div>
            <label className={LABEL}>Fecha <span className="text-red-500">*</span></label>
            <input type="date" min={hoy} value={form.fecha} onChange={e => setForm(p => ({ ...p, fecha: e.target.value }))} className={INPUT} />
          </div>
          <div>
            <label className={LABEL}>Horario <span className="text-red-500">*</span></label>
            <div className="grid grid-cols-4 gap-2">
              {HORARIOS.map(h => (
                <button
                  key={h}
                  onClick={() => setForm(p => ({ ...p, hora: h }))}
                  className={`py-2 text-sm rounded-lg border font-medium transition-all ${
                    form.hora === h
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                  }`}
                >
                  {h}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Descripción */}
      <div>
        <label className={LABEL}>¿Qué necesitas? (opcional)</label>
        <textarea
          rows={3}
          value={form.descripcion}
          onChange={e => setForm(p => ({ ...p, descripcion: e.target.value }))}
          placeholder="Describe brevemente el problema o servicio que necesitas..."
          className={`${INPUT} resize-none`}
        />
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-lg">{error}</p>
      )}

      <button
        onClick={handleSubmit}
        disabled={enviando}
        className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors"
      >
        {enviando ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Agendando...</>
        ) : (
          <><Calendar className="w-4 h-4" /> Agendar mi cita</>
        )}
      </button>

      <p className="text-xs text-gray-400 text-center">
        Al agendar, el taller recibirá tu solicitud y te confirmará por WhatsApp.
      </p>
    </div>
  )
}