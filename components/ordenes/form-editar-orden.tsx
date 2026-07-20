'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, Loader2, ArrowLeft } from 'lucide-react'
import { Orden, ServicioItem, FormaPago } from '@/types'
import { editarOrden } from '@/app/(dashboard)/ordenes/actions'
import { formatMoney } from '@/lib/utils'
import { getIva } from '@/lib/iva'
import AutocompleteVehiculo from '@/components/ui/AutocompleteVehiculo'

const INPUT = 'w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400'
const LABEL = 'block text-sm font-medium text-gray-700 mb-1'

interface Props {
  orden: Orden
  pais: string
  moneda: string
  mecanicos: { id: string; nombre: string }[]
}

export default function FormEditarOrden({ orden, pais, moneda, mecanicos }: Props) {
  const router = useRouter()
  const [cargando, setCargando] = useState(false)
  const [error, setError]       = useState('')

  const { tasa, etiqueta } = getIva(pais)

  const [vehiculo, setVehiculo] = useState({
    marca:       orden.vehiculo_marca  ?? '',
    modelo:      orden.vehiculo_modelo ?? '',
    año:         orden.vehiculo_año    ? String(orden.vehiculo_año) : '',
    placas:      orden.placas          ?? '',
    kilometraje: orden.kilometraje     ? String(orden.kilometraje) : '',
  })

  const [form, setForm] = useState({
    descripcion_problema: orden.descripcion_problema ?? '',
    diagnostico:          orden.diagnostico          ?? '',
    mecanico_asignado:    orden.mecanico_asignado    ?? '',
    fecha_prometida:      orden.fecha_prometida       ?? '',
    forma_pago:           (orden.forma_pago ?? 'efectivo') as FormaPago,
    descuento:            String(orden.descuento ?? 0),
    notas_internas:       orden.notas_internas ?? '',
  })

  const serviciosIniciales: ServicioItem[] =
    (orden.servicios_realizados ?? []).length > 0
      ? orden.servicios_realizados
      : [{ descripcion: '', cantidad: 1, precio_unitario: 0, total: 0 }]

  const [servicios, setServicios] = useState<ServicioItem[]>(serviciosIniciales)
  const [preciosRaw, setPreciosRaw] = useState<string[]>(
    serviciosIniciales.map(s => (s.precio_unitario > 0 ? String(s.precio_unitario) : ''))
  )

  const actualizarPrecioRaw = (i: number, val: string) => {
    const limpio = val.replace(/[^\d.]/g, '')
    setPreciosRaw(prev => prev.map((p, idx) => idx === i ? limpio : p))
    const num = parseFloat(limpio) || 0
    setServicios(prev => prev.map((s, idx) => {
      if (idx !== i) return s
      const updated = { ...s, precio_unitario: num }
      updated.total = updated.cantidad * updated.precio_unitario
      return updated
    }))
  }

  const actualizarServicio = (i: number, campo: keyof ServicioItem, val: string) => {
    setServicios(prev => prev.map((s, idx) => {
      if (idx !== i) return s
      const updated = { ...s, [campo]: campo === 'descripcion' ? val : Number(val) }
      updated.total = updated.cantidad * updated.precio_unitario
      return updated
    }))
  }

  const agregarServicio = () => {
    setServicios(prev => [...prev, { descripcion: '', cantidad: 1, precio_unitario: 0, total: 0 }])
    setPreciosRaw(prev => [...prev, ''])
  }

  const quitarServicio = (i: number) => {
    setServicios(prev => prev.filter((_, idx) => idx !== i))
    setPreciosRaw(prev => prev.filter((_, idx) => idx !== i))
  }

  const subtotal  = servicios.reduce((acc, s) => acc + s.total, 0)
  const descuento = parseFloat(form.descuento) || 0
  const baseIva   = Math.max(0, subtotal - descuento)
  const impuestos = Math.round(baseIva * tasa * 100) / 100
  const total     = Math.round((baseIva + impuestos) * 100) / 100

  const fmt = (n: number) => formatMoney(n, moneda)

  const handleSubmit = async () => {
    if (!form.descripcion_problema.trim()) { setError('La descripción del problema es obligatoria'); return }
    setCargando(true)
    setError('')

    const resultado = await editarOrden(orden.id, {
      vehiculo_marca:       vehiculo.marca,
      vehiculo_modelo:      vehiculo.modelo,
      vehiculo_año:         vehiculo.año,
      placas:               vehiculo.placas,
      kilometraje:          vehiculo.kilometraje,
      descripcion_problema: form.descripcion_problema,
      diagnostico:          form.diagnostico,
      servicios_realizados: servicios.filter(s => s.descripcion.trim()),
      mecanico_asignado:    form.mecanico_asignado,
      fecha_prometida:      form.fecha_prometida,
      descuento,
      tasa_iva:             tasa,
      forma_pago:           form.forma_pago,
      notas_internas:       form.notas_internas,
    })

    if (resultado.error) {
      setError(resultado.error)
      setCargando(false)
    } else {
      router.push(`/ordenes/${orden.id}`)
      router.refresh()
    }
  }

  const numeroFmt = String(orden.numero_orden).padStart(4, '0')

  return (
    <div className="max-w-2xl mx-auto">
      <button
        onClick={() => router.push(`/ordenes/${orden.id}`)}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Volver a la orden
      </button>

      <h1 className="text-2xl font-bold text-gray-900 mb-8">Editar orden #{numeroFmt}</h1>

      <div className="space-y-6">
        {/* Vehículo */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Vehículo</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={LABEL}>Marca</label>
              <AutocompleteVehiculo
                type="marca"
                value={vehiculo.marca}
                onChange={val => setVehiculo(p => ({ ...p, marca: val, modelo: '' }))}
                placeholder="Toyota, BYD, Nissan..."
                className={INPUT}
              />
            </div>
            <div>
              <label className={LABEL}>Modelo</label>
              <AutocompleteVehiculo
                type="modelo"
                value={vehiculo.modelo}
                onChange={val => setVehiculo(p => ({ ...p, modelo: val }))}
                placeholder="Corolla, Atto 3..."
                className={INPUT}
                marcaSeleccionada={vehiculo.marca}
              />
            </div>
            <div>
              <label className={LABEL}>Año</label>
              <input type="number" value={vehiculo.año} onChange={e => setVehiculo(p => ({ ...p, año: e.target.value }))} placeholder="2020" className={INPUT} />
            </div>
            <div>
              <label className={LABEL}>Placas</label>
              <input type="text" value={vehiculo.placas} onChange={e => setVehiculo(p => ({ ...p, placas: e.target.value.toUpperCase() }))} placeholder="ABC-123" className={INPUT} />
            </div>
            <div className="col-span-2">
              <label className={LABEL}>Kilometraje</label>
              <input type="number" value={vehiculo.kilometraje} onChange={e => setVehiculo(p => ({ ...p, kilometraje: e.target.value }))} placeholder="85000" className={INPUT} />
            </div>
          </div>
        </div>

        {/* Problema */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="text-base font-semibold text-gray-900">Problema y diagnóstico</h2>
          <div>
            <label className={LABEL}>Descripción del problema <span className="text-red-500">*</span></label>
            <textarea rows={3} value={form.descripcion_problema} onChange={e => setForm(p => ({ ...p, descripcion_problema: e.target.value }))} className={`${INPUT} resize-none`} />
          </div>
          <div>
            <label className={LABEL}>Diagnóstico del mecánico</label>
            <textarea rows={3} value={form.diagnostico} onChange={e => setForm(p => ({ ...p, diagnostico: e.target.value }))} className={`${INPUT} resize-none`} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={LABEL}>Mecánico asignado</label>
              <select value={form.mecanico_asignado} onChange={e => setForm(p => ({ ...p, mecanico_asignado: e.target.value }))} className={INPUT}>
                <option value="">Sin asignar</option>
                {mecanicos.map(m => (
                  <option key={m.id} value={m.nombre}>{m.nombre}</option>
                ))}
                {form.mecanico_asignado && !mecanicos.some(m => m.nombre === form.mecanico_asignado) && (
                  <option value={form.mecanico_asignado}>{form.mecanico_asignado}</option>
                )}
              </select>
            </div>
            <div>
              <label className={LABEL}>Fecha prometida</label>
              <input type="date" value={form.fecha_prometida} onChange={e => setForm(p => ({ ...p, fecha_prometida: e.target.value }))} className={INPUT} />
            </div>
          </div>
        </div>

        {/* Servicios */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900">Servicios</h2>
            <button onClick={agregarServicio} className="flex items-center gap-1.5 text-sm text-blue-600 font-medium hover:text-blue-700">
              <Plus className="w-4 h-4" /> Agregar
            </button>
          </div>
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3">
            💡 Captura los precios <strong>sin {etiqueta}</strong>. El sistema lo suma solo al calcular el total.
          </p>
          <div className="space-y-3">
            <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-gray-400 uppercase px-1">
              <div className="col-span-5">Descripción</div>
              <div className="col-span-2 text-center">Cant.</div>
              <div className="col-span-3 text-right">Precio unit.</div>
              <div className="col-span-2 text-right">Total</div>
            </div>
            {servicios.map((s, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-5">
                  <input
                    type="text"
                    value={s.descripcion}
                    onChange={e => actualizarServicio(i, 'descripcion', e.target.value)}
                    placeholder="Servicio o refacción"
                    className={INPUT}
                  />
                </div>
                <div className="col-span-2">
                  <input
                    type="number"
                    min={1}
                    value={s.cantidad}
                    onChange={e => actualizarServicio(i, 'cantidad', e.target.value)}
                    className={INPUT}
                  />
                </div>
                <div className="col-span-3">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-500 pointer-events-none select-none">
                      {(preciosRaw[i] ?? '') !== '' || s.precio_unitario > 0 ? '$' : ''}
                    </span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={preciosRaw[i] ?? (s.precio_unitario > 0 ? String(s.precio_unitario) : '')}
                      onChange={e => actualizarPrecioRaw(i, e.target.value)}
                      placeholder="0.00"
                      className={`${INPUT} ${(preciosRaw[i] ?? '') !== '' || s.precio_unitario > 0 ? 'pl-7' : ''}`}
                    />
                  </div>
                </div>
                <div className="col-span-1 text-right text-sm font-semibold text-gray-900">
                  {fmt(s.total)}
                </div>
                <div className="col-span-1 flex justify-end">
                  {servicios.length > 1 && (
                    <button onClick={() => quitarServicio(i)} className="p-1 hover:bg-red-50 rounded text-gray-400 hover:text-red-500">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Totales */}
          <div className="mt-5 pt-4 border-t border-gray-100 space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Subtotal</span>
              <span>{fmt(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Descuento</span>
              <input
                type="number" min={0} step={0.01}
                value={form.descuento}
                onChange={e => setForm(p => ({ ...p, descuento: e.target.value }))}
                className="w-28 px-2 py-1 border border-gray-300 rounded text-sm text-right text-gray-900 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>{etiqueta}</span>
              <span>{fmt(impuestos)}</span>
            </div>
            <div className="flex justify-between text-base font-bold text-gray-900 pt-2 border-t border-gray-100">
              <span>Total</span>
              <span>{fmt(total)}</span>
            </div>
          </div>
        </div>

        {/* Datos adicionales */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="text-base font-semibold text-gray-900">Datos adicionales</h2>
          <div>
            <label className={LABEL}>Forma de pago</label>
            <select value={form.forma_pago} onChange={e => setForm(p => ({ ...p, forma_pago: e.target.value as FormaPago }))} className={INPUT}>
              <option value="efectivo">Efectivo</option>
              <option value="transferencia">Transferencia</option>
              <option value="tarjeta">Tarjeta</option>
            </select>
          </div>
          <div>
            <label className={LABEL}>Notas internas</label>
            <textarea rows={2} value={form.notas_internas} onChange={e => setForm(p => ({ ...p, notas_internas: e.target.value }))} placeholder="Notas para el equipo..." className={`${INPUT} resize-none`} />
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-lg">{error}</p>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => router.push(`/ordenes/${orden.id}`)}
            className="px-5 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={cargando}
            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
          >
            {cargando && <Loader2 className="w-4 h-4 animate-spin" />}
            Guardar cambios
          </button>
        </div>
      </div>
    </div>
  )
}
