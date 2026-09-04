'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { X, Loader2, Search, CalendarPlus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Cliente } from '@/types'
import CampoTelefono from '@/components/ui/CampoTelefono'

const INPUT = 'w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400'
const LABEL = 'block text-sm font-medium text-gray-700 mb-1'

interface Props {
  tallerId: string
  clientes: Cliente[]
  pais: string | null
}

const VACIO = {
  cliente_nombre:   '',
  cliente_telefono: '',
  cliente_email:    '',
  vehiculo_marca:   '',
  vehiculo_modelo:  '',
  placas:           '',
  descripcion:      '',
  fecha:            '',
  hora:             '',
}

/**
 * Agendar una cita desde el taller.
 *
 * Hasta el 04/09/2026 no existía: la tabla `citas` solo se llenaba desde el
 * formulario público que rellena el CLIENTE. La pantalla de Citas decía
 * "Agenda y gestiona las citas de tu taller" y solo dejaba gestionar las que
 * ya habían entrado. Un taller que recibe la llamada —"¿me da cita el
 * martes?"— no tenía dónde apuntarla; el único camino era mandarle al cliente
 * el enlace público, que por teléfono no tiene ningún sentido.
 *
 * Lo reportó Zúñiga Automotriz. La base ya lo permitía: la política de RLS
 * `citas: insert` acepta al usuario del taller desde siempre. Solo faltaba
 * esta pantalla.
 *
 * Nace CONFIRMADA, no pendiente: "pendiente" significa que el cliente pidió
 * hueco y el taller aún no dice que sí. Aquí el que agenda es el taller, así
 * que ya está dicho.
 */
export default function ModalNuevaCita({ tallerId, clientes, pais }: Props) {
  const router = useRouter()
  const supabase = createClient()

  const [abierto, setAbierto]   = useState(false)
  const [form, setForm]         = useState(VACIO)
  const [busqueda, setBusqueda] = useState('')
  const [sugerencias, setSugerencias] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [error, setError]       = useState('')

  const set = (campo: keyof typeof VACIO, valor: string) =>
    setForm(prev => ({ ...prev, [campo]: valor }))

  const coincidencias = busqueda.trim().length > 1
    ? clientes.filter(c =>
        c.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        (c.telefono ?? '').includes(busqueda) ||
        (c.placas ?? '').toUpperCase().includes(busqueda.toUpperCase())
      ).slice(0, 5)
    : []

  // La cita casi siempre es de alguien que ya está en la libreta: quien llama
  // dice "soy Juan, el del Corolla". Rellenarlo evita teclear otra vez lo que
  // el taller ya sabe, y evita que el mismo cliente entre dos veces escrito de
  // dos formas distintas.
  const elegirCliente = (c: Cliente) => {
    setForm(prev => ({
      ...prev,
      cliente_nombre:   c.nombre,
      cliente_telefono: c.telefono ?? '',
      cliente_email:    c.email ?? '',
      vehiculo_marca:   c.vehiculo_marca ?? '',
      vehiculo_modelo:  c.vehiculo_modelo ?? '',
      placas:           c.placas ?? '',
    }))
    setBusqueda('')
    setSugerencias(false)
  }

  const cerrar = () => {
    setAbierto(false)
    setForm(VACIO)
    setBusqueda('')
    setError('')
  }

  const guardar = async () => {
    if (!form.cliente_nombre.trim())   { setError('El nombre del cliente es obligatorio'); return }
    if (!form.cliente_telefono.trim()) { setError('El teléfono es obligatorio: es por donde se le avisa'); return }
    if (!form.fecha)                   { setError('Elige la fecha de la cita'); return }
    if (!form.hora)                    { setError('Elige la hora de la cita'); return }

    setGuardando(true)
    setError('')

    const { error: err } = await supabase.from('citas').insert({
      taller_id:        tallerId,
      cliente_nombre:   form.cliente_nombre.trim(),
      cliente_telefono: form.cliente_telefono.trim(),
      cliente_email:    form.cliente_email.trim() || null,
      vehiculo_marca:   form.vehiculo_marca.trim() || null,
      vehiculo_modelo:  form.vehiculo_modelo.trim() || null,
      placas:           form.placas.trim() || null,
      descripcion:      form.descripcion.trim() || null,
      fecha:            form.fecha,
      hora:             form.hora,
      estado:           'confirmada',
    })

    // supabase-js no lanza: sin mirar `error` la cita se perdería con el modal
    // cerrándose como si todo hubiera ido bien.
    if (err) {
      console.error('[citas] no se pudo agendar:', err.message)
      setError('No se pudo guardar la cita. Revisa tu conexión e intenta de nuevo.')
      setGuardando(false)
      return
    }

    setGuardando(false)
    cerrar()
    router.refresh()
  }

  if (!abierto) {
    return (
      <button
        onClick={() => setAbierto(true)}
        className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors shrink-0"
      >
        <CalendarPlus className="w-4 h-4" />
        Nueva cita
      </button>
    )
  }

  return (
    <>
      <button
        disabled
        className="flex items-center justify-center gap-2 bg-blue-600 text-white text-sm font-medium px-4 py-2.5 rounded-lg opacity-60 shrink-0"
      >
        <CalendarPlus className="w-4 h-4" />
        Nueva cita
      </button>

      <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
        <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl max-h-[92vh] overflow-y-auto">

          <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Nueva cita</h2>
            <button onClick={cerrar} aria-label="Cerrar" className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="px-5 py-4 space-y-4">

            <div className="relative">
              <label className={LABEL}>Buscar cliente</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={busqueda}
                  onChange={e => { setBusqueda(e.target.value); setSugerencias(true) }}
                  onFocus={() => setSugerencias(true)}
                  placeholder="Nombre, teléfono o placas..."
                  className={`${INPUT} pl-10`}
                />
              </div>
              {sugerencias && coincidencias.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                  {coincidencias.map(c => (
                    <button
                      key={c.id}
                      type="button"
                      onMouseDown={() => elegirCliente(c)}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-50 last:border-0"
                    >
                      <p className="text-sm font-medium text-gray-900">{c.nombre}</p>
                      <p className="text-xs text-gray-400">
                        {[c.vehiculo_marca, c.vehiculo_modelo, c.placas].filter(Boolean).join(' · ') || c.telefono}
                      </p>
                    </button>
                  ))}
                </div>
              )}
              <p className="text-xs text-gray-400 mt-1">
                O escribe los datos abajo si es un cliente nuevo.
              </p>
            </div>

            <div>
              <label className={LABEL}>Nombre <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={form.cliente_nombre}
                onChange={e => set('cliente_nombre', e.target.value)}
                placeholder="Juan Pérez"
                className={INPUT}
              />
            </div>

            <div>
              <label className={LABEL}>Teléfono <span className="text-red-500">*</span></label>
              <CampoTelefono
                valor={form.cliente_telefono}
                onChange={v => set('cliente_telefono', v)}
                paisPorDefecto={pais}
                className={INPUT}
                placeholder="Su número"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={LABEL}>Fecha <span className="text-red-500">*</span></label>
                <input type="date" value={form.fecha} onChange={e => set('fecha', e.target.value)} className={INPUT} />
              </div>
              <div>
                <label className={LABEL}>Hora <span className="text-red-500">*</span></label>
                <input type="time" value={form.hora} onChange={e => set('hora', e.target.value)} className={INPUT} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={LABEL}>Marca</label>
                <input type="text" value={form.vehiculo_marca} onChange={e => set('vehiculo_marca', e.target.value)} placeholder="Toyota" className={INPUT} />
              </div>
              <div>
                <label className={LABEL}>Modelo</label>
                <input type="text" value={form.vehiculo_modelo} onChange={e => set('vehiculo_modelo', e.target.value)} placeholder="Corolla" className={INPUT} />
              </div>
              <div>
                <label className={LABEL}>Placas</label>
                <input type="text" value={form.placas} onChange={e => set('placas', e.target.value.toUpperCase())} placeholder="ABC-123" className={INPUT} />
              </div>
              <div>
                <label className={LABEL}>Email</label>
                <input type="email" value={form.cliente_email} onChange={e => set('cliente_email', e.target.value)} placeholder="Opcional" className={INPUT} />
              </div>
            </div>

            <div>
              <label className={LABEL}>¿Qué necesita?</label>
              <textarea
                rows={2}
                value={form.descripcion}
                onChange={e => set('descripcion', e.target.value)}
                placeholder="Servicio de 10 mil, ruido al frenar..."
                className={`${INPUT} resize-none`}
              />
            </div>

            {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">{error}</p>}
          </div>

          <div className="sticky bottom-0 bg-white border-t border-gray-100 px-5 py-4 flex gap-3">
            <button
              onClick={cerrar}
              className="px-5 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              onClick={guardar}
              disabled={guardando}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors"
            >
              {guardando && <Loader2 className="w-4 h-4 animate-spin" />}
              Agendar cita
            </button>
          </div>

        </div>
      </div>
    </>
  )
}
