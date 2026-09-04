'use client'

import { useState } from 'react'
import { Car, Plus, Pencil, Trash2, Loader2, X } from 'lucide-react'
import { Vehiculo, VehiculoForm } from '@/types'
import { agregarVehiculo, editarVehiculo, archivarVehiculo } from '@/app/(dashboard)/clientes/[id]/vehiculos-actions'

const INPUT = 'w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400'
const LABEL = 'block text-xs font-medium text-gray-600 mb-1'

const VACIO: VehiculoForm = { marca: '', modelo: '', anio: null, placas: '', vin: '', notas: '' }

interface Props {
  clienteId: string
  vehiculos: Vehiculo[]
}

/** El coche como se le nombra: "2020 Toyota Corolla". */
function titulo(v: Vehiculo): string {
  const partes = [v.anio, v.marca, v.modelo]
    .map(p => String(p ?? '').trim())
    .filter(p => p !== '' && p !== '0')
  return partes.length > 0 ? partes.join(' ') : 'Vehículo sin datos'
}

/**
 * La lista de vehículos de un cliente.
 *
 * Sustituye a la tarjeta "Vehículo" en singular, que solo podía enseñar uno
 * porque los datos vivían en columnas dentro de la ficha del cliente. Lo pidió
 * un taller por correo: "quiero agregar una unidad a un cliente ya registrado
 * pero no me aparece la opción". No aparecía porque no existía.
 */
export default function VehiculosCliente({ clienteId, vehiculos }: Props) {
  const [editando, setEditando] = useState<string | null>(null)
  const [form, setForm]         = useState<VehiculoForm>(VACIO)
  const [guardando, setGuardando] = useState(false)
  const [quitando, setQuitando] = useState<string | null>(null)
  const [error, setError]       = useState('')

  const set = (campo: keyof VehiculoForm, valor: string) =>
    setForm(prev => ({ ...prev, [campo]: valor }))

  const abrirNuevo = () => { setForm(VACIO); setEditando('nuevo'); setError('') }

  const abrirEdicion = (v: Vehiculo) => {
    setForm({ marca: v.marca, modelo: v.modelo, anio: v.anio, placas: v.placas, vin: v.vin, notas: v.notas })
    setEditando(v.id)
    setError('')
  }

  const cerrar = () => { setEditando(null); setForm(VACIO); setError('') }

  const guardar = async () => {
    setGuardando(true)
    setError('')
    const res = editando === 'nuevo'
      ? await agregarVehiculo(clienteId, form)
      : await editarVehiculo(editando!, clienteId, form)
    setGuardando(false)
    if (res.error) { setError(res.error); return }
    cerrar()
  }

  const quitar = async (v: Vehiculo) => {
    if (!confirm(`¿Quitar ${titulo(v)} de este cliente?\n\nSus órdenes se conservan.`)) return
    setQuitando(v.id)
    const res = await archivarVehiculo(v.id, clienteId)
    setQuitando(null)
    if (res.error) setError(res.error)
  }

  const formulario = (
    <div className="border border-blue-200 bg-blue-50/40 rounded-xl p-4 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={LABEL}>Marca</label>
          <input type="text" value={form.marca ?? ''} onChange={e => set('marca', e.target.value)} placeholder="Toyota" className={INPUT} />
        </div>
        <div>
          <label className={LABEL}>Modelo</label>
          <input type="text" value={form.modelo ?? ''} onChange={e => set('modelo', e.target.value)} placeholder="Corolla" className={INPUT} />
        </div>
        <div>
          <label className={LABEL}>Año</label>
          <input type="number" value={form.anio ?? ''} onChange={e => set('anio', e.target.value)} placeholder="2020" className={INPUT} />
        </div>
        <div>
          <label className={LABEL}>Placas</label>
          <input type="text" value={form.placas ?? ''} onChange={e => set('placas', e.target.value.toUpperCase())} placeholder="ABC-123" className={INPUT} />
        </div>
        <div className="col-span-2">
          <label className={LABEL}>VIN</label>
          <input type="text" value={form.vin ?? ''} onChange={e => set('vin', e.target.value.toUpperCase())} placeholder="17 caracteres" maxLength={17} className={INPUT} />
        </div>
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">{error}</p>}

      <div className="flex gap-2">
        <button
          onClick={guardar}
          disabled={guardando}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold px-4 py-2 rounded-lg"
        >
          {guardando && <Loader2 className="w-4 h-4 animate-spin" />}
          {editando === 'nuevo' ? 'Agregar vehículo' : 'Guardar cambios'}
        </button>
        <button onClick={cerrar} className="px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50">
          Cancelar
        </button>
      </div>
    </div>
  )

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Car size={18} className="text-blue-500" />
          <h2 className="font-bold text-gray-900">
            Vehículos {vehiculos.length > 0 && <span className="text-gray-400 font-medium">({vehiculos.length})</span>}
          </h2>
        </div>
        {editando !== 'nuevo' && (
          <button
            onClick={abrirNuevo}
            className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-semibold"
          >
            <Plus className="w-4 h-4" /> Agregar
          </button>
        )}
      </div>

      <div className="space-y-3">
        {editando === 'nuevo' && formulario}

        {vehiculos.length === 0 && editando !== 'nuevo' && (
          <p className="text-sm text-gray-400 py-2">
            Este cliente todavía no tiene vehículos. Agrega el primero para poder elegirlo al abrir una orden.
          </p>
        )}

        {vehiculos.map(v => (
          editando === v.id ? (
            <div key={v.id}>{formulario}</div>
          ) : (
            <div key={v.id} className="flex items-start justify-between gap-3 border border-gray-100 rounded-xl p-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{titulo(v)}</p>
                <p className="text-xs text-gray-400 truncate">
                  {[v.placas, v.vin].filter(Boolean).join(' · ') || 'Sin placas ni VIN'}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => abrirEdicion(v)} aria-label="Editar vehículo" className="p-1.5 hover:bg-gray-50 rounded-lg text-gray-400 hover:text-gray-700">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => quitar(v)} disabled={quitando === v.id} aria-label="Quitar vehículo" className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500">
                  {quitando === v.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          )
        ))}
      </div>

      {error && editando === null && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg mt-3 flex items-start gap-2">
          <span className="flex-1">{error}</span>
          <button onClick={() => setError('')} aria-label="Cerrar aviso"><X className="w-3.5 h-3.5" /></button>
        </p>
      )}
    </div>
  )
}
