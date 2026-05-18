'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Plus, Trash2, Loader2, ChevronRight, ChevronLeft } from 'lucide-react'
import { Cliente, ServicioItem, EstadoOrden, FormaPago } from '@/types'
import { crearOrden, OrdenForm } from '@/app/(dashboard)/ordenes/actions'
import ChecklistRecepcion from './checklist-recepcion'
import SelectorCatalogo from './selector-catalogo'
import { formatMoney } from '@/lib/utils'
import AutocompleteVehiculo from '@/components/ui/AutocompleteVehiculo'

const INPUT = 'w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400'
const LABEL = 'block text-sm font-medium text-gray-700 mb-1'

const IVA_POR_PAIS: Record<string, { tasa: number; etiqueta: string }> = {
  'México':               { tasa: 0.16, etiqueta: 'IVA 16%'   },
  'Colombia':             { tasa: 0.19, etiqueta: 'IVA 19%'   },
  'Argentina':            { tasa: 0.21, etiqueta: 'IVA 21%'   },
  'Chile':                { tasa: 0.19, etiqueta: 'IVA 19%'   },
  'Perú':                 { tasa: 0.18, etiqueta: 'IGV 18%'   },
  'Ecuador':              { tasa: 0.15, etiqueta: 'IVA 15%'   },
  'Venezuela':            { tasa: 0.16, etiqueta: 'IVA 16%'   },
  'Bolivia':              { tasa: 0.13, etiqueta: 'IVA 13%'   },
  'Paraguay':             { tasa: 0.10, etiqueta: 'IVA 10%'   },
  'Uruguay':              { tasa: 0.22, etiqueta: 'IVA 22%'   },
  'Guatemala':            { tasa: 0.12, etiqueta: 'IVA 12%'   },
  'Costa Rica':           { tasa: 0.13, etiqueta: 'IVA 13%'   },
  'Panamá':               { tasa: 0.07, etiqueta: 'ITBMS 7%'  },
  'Honduras':             { tasa: 0.15, etiqueta: 'ISV 15%'   },
  'El Salvador':          { tasa: 0.13, etiqueta: 'IVA 13%'   },
  'Nicaragua':            { tasa: 0.15, etiqueta: 'IVA 15%'   },
  'República Dominicana': { tasa: 0.18, etiqueta: 'ITBIS 18%' },
}

function getIva(pais: string) {
  return IVA_POR_PAIS[pais] ?? { tasa: 0.16, etiqueta: 'IVA 16%' }
}

function getMoneda(moneda: string) {
  if (moneda === 'COP') return 'COP $'
  return '$'
}

const SERVICIO_VACIO: ServicioItem = { descripcion: '', cantidad: 1, precio_unitario: 0, total: 0 }

interface Props {
  clientes: Cliente[]
  tallerId: string
  pais: string
  moneda: string
  mecanicos: { id: string; nombre: string }[]
}

export default function FormNuevaOrden({ clientes, tallerId: tallerIdProp, pais, moneda, mecanicos }: Props) {
  const router = useRouter()
  const [paso, setPaso]         = useState(1)
  const [cargando, setCargando] = useState(false)
  const [error, setError]       = useState('')
  const [ordenId, setOrdenId]   = useState<string | null>(null)
  const [preciosRaw, setPreciosRaw] = useState<string[]>([''])

  const [busquedaCliente, setBusquedaCliente]         = useState('')
  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null)
  const [mostrarSugerencias, setMostrarSugerencias]   = useState(false)

  const [vehiculo, setVehiculo] = useState({
    marca: '', modelo: '', año: '', placas: '', kilometraje: '', vin: '',
  })

  const [form, setForm] = useState({
    numero_factura:       '',
    descripcion_problema: '',
    diagnostico:          '',
    mecanico_asignado:    '',
    fecha_prometida:      '',
    estado:               'recibido' as EstadoOrden,
    forma_pago:           'efectivo' as FormaPago,
    descuento:            '0',
    notas_internas:       '',
  })

  const [servicios, setServicios] = useState<ServicioItem[]>([{ ...SERVICIO_VACIO }])

  const { tasa, etiqueta } = getIva(pais)
  const simbolo = getMoneda(moneda)

  const sugerencias = busquedaCliente.length > 1
    ? clientes.filter(c =>
        c.nombre.toLowerCase().includes(busquedaCliente.toLowerCase()) ||
        (c.placas ?? '').toUpperCase().includes(busquedaCliente.toUpperCase())
      ).slice(0, 5)
    : []

  const seleccionarCliente = (c: Cliente) => {
    setClienteSeleccionado(c)
    setBusquedaCliente(c.nombre)
    setMostrarSugerencias(false)
    setVehiculo({
      marca:       c.vehiculo_marca  ?? '',
      modelo:      c.vehiculo_modelo ?? '',
      año:         c.vehiculo_año    ? String(c.vehiculo_año) : '',
      placas:      c.placas          ?? '',
      kilometraje: '',
      vin:         '',
    })
  }

  const limpiarCliente = () => {
    setClienteSeleccionado(null)
    setBusquedaCliente('')
    setVehiculo({ marca: '', modelo: '', año: '', placas: '', kilometraje: '', vin: '' })
  }

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
    setServicios(prev => [...prev, { ...SERVICIO_VACIO }])
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

    const datos: OrdenForm = {
      cliente_id:           clienteSeleccionado?.id ?? null,
      vehiculo_marca:       vehiculo.marca,
      vehiculo_modelo:      vehiculo.modelo,
      vehiculo_año:         vehiculo.año,
      placas:               vehiculo.placas,
      kilometraje:          vehiculo.kilometraje,
      descripcion_problema: form.descripcion_problema,
      diagnostico:          form.diagnostico,
      servicios_realizados: servicios.filter(s => s.descripcion.trim()),
      mecanico_asignado:    form.mecanico_asignado,
      estado:               form.estado,
      fecha_entrada:        new Date().toISOString().split('T')[0],
      fecha_prometida:      form.fecha_prometida,
      subtotal,
      descuento,
      impuestos,
      tasa_iva:             tasa,
      total,
      forma_pago:           form.forma_pago,
      notas_internas:       form.notas_internas,
      vin:                  vehiculo.vin?.trim() || null,
      numero_factura:       form.numero_factura.trim() || null,
    }

    const resultado = await crearOrden(datos)
    if (resultado.error) {
      setError(resultado.error)
      setCargando(false)
    } else {
      setOrdenId(resultado.id ?? null)
      setPaso(3)
      setCargando(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">

      {/* Progreso */}
      {paso < 3 && (
        <div className="flex items-center gap-3 mb-8">
          {[
            { n: 1, label: 'Cliente y vehículo' },
            { n: 2, label: 'Servicios y detalles' },
            { n: 3, label: 'Checklist de recepción' },
          ].map(({ n, label }) => (
            <div key={n} className="flex items-center gap-3">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold transition-colors ${
                paso >= n ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
              }`}>{n}</div>
              <span className={`text-sm font-medium ${paso >= n ? 'text-gray-900' : 'text-gray-400'}`}>
                {label}
              </span>
              {n < 3 && <ChevronRight className="w-4 h-4 text-gray-300" />}
            </div>
          ))}
        </div>
      )}

      {/* ── PASO 1 ── */}
      {paso === 1 && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Cliente</h2>
            <div className="relative mb-4">
              <label className={LABEL}>Buscar cliente existente</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={busquedaCliente}
                  onChange={e => { setBusquedaCliente(e.target.value); setMostrarSugerencias(true); if (!e.target.value) limpiarCliente() }}
                  onFocus={() => setMostrarSugerencias(true)}
                  placeholder="Nombre o placas..."
                  className={`${INPUT} pl-10`}
                />
              </div>
              {mostrarSugerencias && sugerencias.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                  {sugerencias.map(c => (
                    <button
                      key={c.id}
                      type="button"
                      onMouseDown={() => seleccionarCliente(c)}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0"
                    >
                      <p className="text-sm font-medium text-gray-900">{c.nombre}</p>
                      <p className="text-xs text-gray-400">
                        {[c.vehiculo_marca, c.vehiculo_modelo, c.placas].filter(Boolean).join(' · ')}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {clienteSeleccionado && (
              <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 mb-2">
                <div>
                  <p className="text-sm font-semibold text-blue-900">{clienteSeleccionado.nombre}</p>
                  <p className="text-xs text-blue-600">{clienteSeleccionado.telefono ?? clienteSeleccionado.email ?? ''}</p>
                </div>
                <button onClick={limpiarCliente} className="text-xs text-blue-500 hover:text-blue-700 font-medium">
                  Cambiar
                </button>
              </div>
            )}
          </div>

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
                <label className={LABEL}>VIN (Número de serie del vehículo)</label>
                <input
                  type="text"
                  value={vehiculo.vin}
                  onChange={e => setVehiculo(p => ({ ...p, vin: e.target.value.toUpperCase() }))}
                  placeholder="17 caracteres — ej. 1HGCM82633A123456"
                  className={INPUT}
                  maxLength={17}
                />
              </div>
              <div className="col-span-2">
                <label className={LABEL}>Kilometraje</label>
                <input type="number" value={vehiculo.kilometraje} onChange={e => setVehiculo(p => ({ ...p, kilometraje: e.target.value }))} placeholder="85000" className={INPUT} />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => setPaso(2)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-6 py-2.5 rounded-lg transition-colors"
            >
              Siguiente <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── PASO 2 ── */}
      {paso === 2 && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <h2 className="text-base font-semibold text-gray-900">Problema reportado</h2>
            <div>
              <label className={LABEL}>Número de factura (opcional)</label>
              <input
                type="text"
                value={form.numero_factura}
                onChange={e => setForm(p => ({ ...p, numero_factura: e.target.value }))}
                placeholder="Ej. A-0001 — déjalo vacío si no aplica"
                className={INPUT}
              />
            </div>
            <div>
              <label className={LABEL}>Descripción del problema <span className="text-red-500">*</span></label>
              <textarea rows={3} value={form.descripcion_problema} onChange={e => setForm(p => ({ ...p, descripcion_problema: e.target.value }))} placeholder="¿Qué problema reporta el cliente?" className={`${INPUT} resize-none`} />
            </div>
            <div>
              <label className={LABEL}>Diagnóstico del mecánico</label>
              <textarea rows={3} value={form.diagnostico} onChange={e => setForm(p => ({ ...p, diagnostico: e.target.value }))} placeholder="Diagnóstico técnico..." className={`${INPUT} resize-none`} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={LABEL}>Mecánico asignado</label>
                <select
                  value={form.mecanico_asignado}
                  onChange={e => setForm(p => ({ ...p, mecanico_asignado: e.target.value }))}
                  className={INPUT}
                >
                  <option value="">Sin asignar</option>
                  {mecanicos.map(m => (
                    <option key={m.id} value={m.nombre}>{m.nombre}</option>
                  ))}
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
              <div className="flex items-center gap-3">
                <SelectorCatalogo
                  tallerId={tallerIdProp}
                  moneda={moneda}
                  onSeleccionar={servicio => {
                    setServicios(prev => [...prev, servicio])
                    setPreciosRaw(prev => [...prev, String(servicio.precio_unitario)])
                  }}
                />
                <button onClick={agregarServicio} className="flex items-center gap-1.5 text-sm text-blue-600 font-medium hover:text-blue-700">
                  <Plus className="w-4 h-4" /> Agregar
                </button>
              </div>
            </div>
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
                        onFocus={() => {
                          if (!preciosRaw[i] && s.precio_unitario === 0) {
                            setPreciosRaw(prev => prev.map((p, idx) => idx === i ? '' : p))
                          }
                        }}
                        onBlur={() => {
                          if ((preciosRaw[i] ?? '') === '') {
                            setPreciosRaw(prev => prev.map((p, idx) => idx === i ? '' : p))
                          }
                        }}
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

          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <h2 className="text-base font-semibold text-gray-900">Datos adicionales</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={LABEL}>Estado inicial</label>
                <select value={form.estado} onChange={e => setForm(p => ({ ...p, estado: e.target.value as EstadoOrden }))} className={INPUT}>
                  <option value="recibido">Recibido</option>
                  <option value="en_proceso">En proceso</option>
                  <option value="listo">Listo</option>
                  <option value="entregado">Entregado</option>
                </select>
              </div>
              <div>
                <label className={LABEL}>Forma de pago</label>
                <select value={form.forma_pago} onChange={e => setForm(p => ({ ...p, forma_pago: e.target.value as FormaPago }))} className={INPUT}>
                  <option value="efectivo">Efectivo</option>
                  <option value="transferencia">Transferencia</option>
                  <option value="tarjeta">Tarjeta</option>
                </select>
              </div>
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
              onClick={() => setPaso(1)}
              className="flex items-center gap-2 px-5 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> Atrás
            </button>
            <button
              onClick={handleSubmit}
              disabled={cargando}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
            >
              {cargando && <Loader2 className="w-4 h-4 animate-spin" />}
              Crear orden de trabajo
            </button>
          </div>
        </div>
      )}

      {/* ── PASO 3 — CHECKLIST ── */}
      {paso === 3 && ordenId && (
        <ChecklistRecepcion
          ordenId={ordenId}
          tallerId={tallerIdProp}
          onTerminar={() => router.push(`/ordenes/${ordenId}`)}
        />
      )}

    </div>
  )
}