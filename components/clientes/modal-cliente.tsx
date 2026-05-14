'use client'

import { useState, useEffect } from 'react'
import { X, Loader2 } from 'lucide-react'
import { Cliente, ClienteForm } from '@/types'
import { crearCliente, editarCliente } from '@/app/(dashboard)/clientes/actions'

interface Props {
  cliente?: Cliente | null
  onCerrar: () => void
}

const FORM_VACIO: ClienteForm = {
  nombre: '', telefono: '', email: '',
  vehiculo_marca: '', vehiculo_modelo: '', vehiculo_año: null, placas: '', vin: '', notas: '',
}

const INPUT = 'w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400'
const LABEL = 'block text-sm font-medium text-gray-700 mb-1'

export default function ModalCliente({ cliente, onCerrar }: Props) {
  const [form, setForm]       = useState<ClienteForm>(FORM_VACIO)
  const [cargando, setCargando] = useState(false)
  const [error, setError]     = useState('')

  useEffect(() => {
    setForm(cliente ? {
      nombre:          cliente.nombre,
      telefono:        cliente.telefono        ?? '',
      email:           cliente.email           ?? '',
      vehiculo_marca:  cliente.vehiculo_marca  ?? '',
      vehiculo_modelo: cliente.vehiculo_modelo ?? '',
      vehiculo_año:    cliente.vehiculo_año    ?? null,
      placas:          cliente.placas          ?? '',
      vin:             cliente.vin             ?? '',
      notas:           cliente.notas           ?? '',
    } : FORM_VACIO)
    setError('')
  }, [cliente])

  const set = (campo: keyof ClienteForm, valor: string) =>
    setForm(prev => ({ ...prev, [campo]: valor }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.nombre.trim()) { setError('El nombre es obligatorio'); return }
    setCargando(true)
    setError('')

    const resultado = cliente
      ? await editarCliente(cliente.id, form)
      : await crearCliente(form)

    if (resultado.error) {
      setError(resultado.error)
      setCargando(false)
    } else {
      onCerrar()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <h2 className="text-base font-semibold text-gray-900">
            {cliente ? 'Editar cliente' : 'Nuevo cliente'}
          </h2>
          <button onClick={onCerrar} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-6 py-5 space-y-4">

          {/* Datos personales */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Datos del cliente
            </p>
            <div className="space-y-3">
              <div>
                <label className={LABEL}>Nombre <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={form.nombre}
                  onChange={e => set('nombre', e.target.value)}
                  placeholder="Ej: Juan Pérez"
                  className={INPUT}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={LABEL}>Teléfono</label>
                  <input
                    type="tel"
                    value={form.telefono ?? ''}
                    onChange={e => set('telefono', e.target.value)}
                    placeholder="55 1234 5678"
                    className={INPUT}
                  />
                </div>
                <div>
                  <label className={LABEL}>Email</label>
                  <input
                    type="email"
                    value={form.email ?? ''}
                    onChange={e => set('email', e.target.value)}
                    placeholder="juan@email.com"
                    className={INPUT}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Datos del vehículo */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Datos del vehículo
            </p>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={LABEL}>Marca</label>
                  <input
                    type="text"
                    value={form.vehiculo_marca ?? ''}
                    onChange={e => set('vehiculo_marca', e.target.value)}
                    placeholder="Ej: Toyota"
                    className={INPUT}
                  />
                </div>
                <div>
                  <label className={LABEL}>Modelo</label>
                  <input
                    type="text"
                    value={form.vehiculo_modelo ?? ''}
                    onChange={e => set('vehiculo_modelo', e.target.value)}
                    placeholder="Ej: Corolla"
                    className={INPUT}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={LABEL}>Año</label>
                  <input
                    type="number"
                    value={form.vehiculo_año ?? ''}
                    onChange={e => set('vehiculo_año', e.target.value)}
                    placeholder="Ej: 2020"
                    min={1900}
                    max={new Date().getFullYear() + 1}
                    className={INPUT}
                  />
                </div>
                <div>
                  <label className={LABEL}>Placas</label>
                  <input
                    type="text"
                    value={form.placas ?? ''}
                    onChange={e => set('placas', e.target.value.toUpperCase())}
                    placeholder="Ej: ABC-123"
                    className={INPUT}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Notas */}
          <div>
            <label className={LABEL}>Notas</label>
            <textarea
              value={form.notas ?? ''}
              onChange={e => set('notas', e.target.value)}
              placeholder="Observaciones del cliente o del vehículo..."
              rows={3}
              className={`${INPUT} resize-none`}
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}
        </form>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-gray-100 flex-shrink-0">
          <button
            type="button"
            onClick={onCerrar}
            className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit as any}
            disabled={cargando}
            className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {cargando && <Loader2 className="w-4 h-4 animate-spin" />}
            {cliente ? 'Guardar cambios' : 'Agregar cliente'}
          </button>
        </div>
      </div>
    </div>
  )
}
