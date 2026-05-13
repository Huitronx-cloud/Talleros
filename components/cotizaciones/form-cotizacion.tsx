'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { crearCotizacion } from '@/app/(dashboard)/cotizaciones/actions'
import { Cliente, Orden, ServicioItem } from '@/types'
import { formatMoney } from '@/lib/utils'

// Tasas de IVA por país — igual que en form-nueva-orden
const IVA_POR_PAIS: Record<string, { tasa: number; etiqueta: string }> = {
  'México':              { tasa: 0.16,  etiqueta: 'IVA 16%' },
  'Colombia':            { tasa: 0.19,  etiqueta: 'IVA 19%' },
  'Argentina':           { tasa: 0.21,  etiqueta: 'IVA 21%' },
  'Chile':               { tasa: 0.19,  etiqueta: 'IVA 19%' },
  'Perú':                { tasa: 0.18,  etiqueta: 'IGV 18%' },
  'Ecuador':             { tasa: 0.15,  etiqueta: 'IVA 15%' },
  'Venezuela':           { tasa: 0.16,  etiqueta: 'IVA 16%' },
  'Bolivia':             { tasa: 0.13,  etiqueta: 'IVA 13%' },
  'Paraguay':            { tasa: 0.10,  etiqueta: 'IVA 10%' },
  'Uruguay':             { tasa: 0.22,  etiqueta: 'IVA 22%' },
  'Guatemala':           { tasa: 0.12,  etiqueta: 'IVA 12%' },
  'Costa Rica':          { tasa: 0.13,  etiqueta: 'IVA 13%' },
  'Panamá':              { tasa: 0.07,  etiqueta: 'ITBMS 7%' },
  'Honduras':            { tasa: 0.15,  etiqueta: 'ISV 15%' },
  'El Salvador':         { tasa: 0.13,  etiqueta: 'IVA 13%' },
  'Nicaragua':           { tasa: 0.15,  etiqueta: 'IVA 15%' },
  'República Dominicana':{ tasa: 0.18,  etiqueta: 'ITBIS 18%' },
}

function getIva(pais: string) {
  return IVA_POR_PAIS[pais] ?? { tasa: 0.16, etiqueta: 'IVA 16%' }
}

interface Props {
  clientes: Cliente[]
  ordenes: Orden[]
  monedaDefault: 'MXN' | 'COP'
  vigenciaDiasDefault: number
  ordenPreseleccionada?: string
  pais: string
}

const FILA_VACIA: ServicioItem = { descripcion: '', cantidad: 1, precio_unitario: 0, total: 0 }

export default function FormCotizacion({
  clientes,
  ordenes,
  monedaDefault,
  vigenciaDiasDefault,
  ordenPreseleccionada,
  pais,
}: Props) {
  const router = useRouter()

  const [paso, setPaso] = useState(1)

  // Step 1
  const [busquedaCliente, setBusquedaCliente]       = useState('')
  const [clienteId, setClienteId]                   = useState('')
  const [ordenId, setOrdenId]                       = useState(ordenPreseleccionada ?? '')
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false)
  const refBusqueda = useRef<HTMLDivElement>(null)

  // Step 2
  const [servicios, setServicios]       = useState<ServicioItem[]>([{ ...FILA_VACIA }])
  const [preciosRaw, setPreciosRaw]     = useState<string[]>([''])
  const [descuento, setDescuento]       = useState(0)
  const [aplicarIva, setAplicarIva]     = useState(true)  // activo por defecto
  const [moneda, setMoneda]             = useState<'MXN' | 'COP'>(monedaDefault)
  const [vigenciaDias, setVigenciaDias] = useState(vigenciaDiasDefault)
  const [notas, setNotas]               = useState('')

  const [cargando, setCargando] = useState(false)
  const [error, setError]       = useState('')

  const { tasa, etiqueta } = getIva(pais)
  const simbolo = moneda === 'COP' ? 'COP $' : '$'

  // Pre-fill desde orden
  useEffect(() => {
    if (!ordenPreseleccionada) return
    const orden = ordenes.find(o => o.id === ordenPreseleccionada)
    if (!orden) return
    if (orden.cliente_id) setClienteId(orden.cliente_id)
    const cliente = clientes.find(c => c.id === orden.cliente_id)
    if (cliente) setBusquedaCliente(cliente.nombre)
    const serviciosPrefill: ServicioItem[] = (orden.servicios_realizados ?? []).map(s => ({
      descripcion:     s.descripcion,
      cantidad:        s.cantidad,
      precio_unitario: s.precio_unitario,
      total:           s.cantidad * s.precio_unitario,
    }))
    if (serviciosPrefill.length) {
      setServicios(serviciosPrefill)
      setPreciosRaw(serviciosPrefill.map(s => s.precio_unitario > 0 ? String(s.precio_unitario) : ''))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Cerrar dropdown al click afuera
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (refBusqueda.current && !refBusqueda.current.contains(e.target as Node)) {
        setMostrarSugerencias(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Totales
  const subtotal   = servicios.reduce((s, r) => s + r.total, 0)
  const baseIva    = Math.max(0, subtotal - descuento)
  const impuestos  = aplicarIva ? Math.round(baseIva * tasa * 100) / 100 : 0
  const total      = Math.round((baseIva + impuestos) * 100) / 100

  const clientesFiltrados = busquedaCliente.length >= 1
    ? clientes.filter(c => c.nombre.toLowerCase().includes(busquedaCliente.toLowerCase())).slice(0, 6)
    : []

  const ordenesFiltradas = clienteId
    ? ordenes.filter(o => o.cliente_id === clienteId)
    : []

  function seleccionarCliente(c: Cliente) {
    setClienteId(c.id)
    setBusquedaCliente(c.nombre)
    setMostrarSugerencias(false)
    setOrdenId('')
  }

  // Actualiza precio raw (string con $ dinámico)
  function actualizarPrecioRaw(i: number, val: string) {
    const limpio = val.replace(/[^\d.]/g, '')
    setPreciosRaw(prev => prev.map((p, idx) => idx === i ? limpio : p))
    const num = parseFloat(limpio) || 0
    setServicios(prev => {
      const filas = [...prev]
      const fila  = { ...filas[i], precio_unitario: num }
      fila.total  = Number(fila.cantidad) * num
      filas[i]    = fila
      return filas
    })
  }

  function actualizarFila(idx: number, campo: keyof ServicioItem, valor: string | number) {
    setServicios(prev => {
      const filas = [...prev]
      const fila  = { ...filas[idx], [campo]: valor }
      if (campo === 'cantidad') {
        fila.total = Number(valor) * Number(fila.precio_unitario)
      }
      filas[idx] = fila
      return filas
    })
  }

  function agregarFila() {
    setServicios(prev => [...prev, { ...FILA_VACIA }])
    setPreciosRaw(prev => [...prev, ''])
  }

  function eliminarFila(idx: number) {
    setServicios(prev => prev.filter((_, i) => i !== idx))
    setPreciosRaw(prev => prev.filter((_, i) => i !== idx))
  }

  function moverFila(idx: number, dir: -1 | 1) {
    setServicios(prev => {
      const filas = [...prev]
      const temp  = filas[idx]
      filas[idx]  = filas[idx + dir]
      filas[idx + dir] = temp
      return filas
    })
    setPreciosRaw(prev => {
      const arr  = [...prev]
      const temp = arr[idx]
      arr[idx]   = arr[idx + dir]
      arr[idx + dir] = temp
      return arr
    })
  }

  const fmt = (n: number) => formatMoney(n, moneda)

  async function handleSubmit() {
    setError('')
    if (!clienteId) { setError('Selecciona un cliente'); return }
    if (servicios.every(s => !s.descripcion)) { setError('Agrega al menos un servicio'); return }

    setCargando(true)
    const result = await crearCotizacion({
      cliente_id:    clienteId,
      orden_id:      ordenId,
      servicios:     servicios.filter(s => s.descripcion),
      subtotal,
      descuento,
      impuestos,
      total,
      moneda,
      estado:        'borrador',
      notas,
      vigencia_dias: vigenciaDias,
      aplicar_iva:   aplicarIva,
    })
    setCargando(false)

    if (result.error) { setError(result.error); return }
    router.push(`/cotizaciones/${result.id}`)
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Progress */}
      <div className="flex items-center gap-3 mb-8">
        {[1, 2].map(n => (
          <div key={n} className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
              paso >= n ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'
            }`}>{n}</div>
            <span className={`text-sm font-medium ${paso >= n ? 'text-gray-900' : 'text-gray-400'}`}>
              {n === 1 ? 'Cliente y orden' : 'Servicios y totales'}
            </span>
            {n < 2 && <div className={`h-px w-10 ${paso > n ? 'bg-blue-600' : 'bg-gray-200'}`} />}
          </div>
        ))}
      </div>

      {/* ── PASO 1 ── */}
      {paso === 1 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5">
          <h2 className="font-semibold text-gray-900">Cliente y orden (opcional)</h2>

          {/* Buscador cliente */}
          <div ref={refBusqueda}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cliente <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={busquedaCliente}
                onChange={e => { setBusquedaCliente(e.target.value); setClienteId(''); setMostrarSugerencias(true) }}
                onFocus={() => setMostrarSugerencias(true)}
                placeholder="Buscar cliente..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 bg-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {mostrarSugerencias && clientesFiltrados.length > 0 && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                  {clientesFiltrados.map(c => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => seleccionarCliente(c)}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-900 hover:bg-blue-50 border-b border-gray-50 last:border-0"
                    >
                      <span className="font-medium">{c.nombre}</span>
                      {c.placas && <span className="ml-2 text-gray-400 text-xs">Placas: {c.placas}</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Orden vinculada */}
          {ordenesFiltradas.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vincular a orden (opcional)</label>
              <select
                value={ordenId}
                onChange={e => {
                  setOrdenId(e.target.value)
                  if (e.target.value) {
                    const orden = ordenes.find(o => o.id === e.target.value)
                    if (orden?.servicios_realizados?.length) {
                      const svcs = orden.servicios_realizados.map(s => ({
                        descripcion:     s.descripcion,
                        cantidad:        s.cantidad,
                        precio_unitario: s.precio_unitario,
                        total:           s.cantidad * s.precio_unitario,
                      }))
                      setServicios(svcs)
                      setPreciosRaw(svcs.map(s => s.precio_unitario > 0 ? String(s.precio_unitario) : ''))
                    }
                  }
                }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Sin orden vinculada</option>
                {ordenesFiltradas.map(o => (
                  <option key={o.id} value={o.id}>
                    #{String(o.numero_orden).padStart(4, '0')} — {(o.descripcion_problema ?? '').slice(0, 50)}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-400 mt-1">Al vincular una orden, los servicios se pre-llenan automáticamente.</p>
            </div>
          )}

          {/* Moneda y vigencia */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Moneda</label>
              <select
                value={moneda}
                onChange={e => setMoneda(e.target.value as 'MXN' | 'COP')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="MXN">MXN — Peso mexicano</option>
                <option value="COP">COP — Peso colombiano</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vigencia (días)</label>
              <input
                type="number"
                value={vigenciaDias}
                min={1}
                onChange={e => setVigenciaDias(Number(e.target.value))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end">
            <button
              onClick={() => {
                if (!clienteId) { setError('Selecciona un cliente'); return }
                setError('')
                setPaso(2)
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
            >
              Siguiente →
            </button>
          </div>
        </div>
      )}

      {/* ── PASO 2 ── */}
      {paso === 2 && (
        <div className="space-y-5">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Servicios</h2>
              <button
                onClick={agregarFila}
                className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                <Plus className="w-4 h-4" /> Agregar fila
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left pb-2 text-xs font-semibold text-gray-500 pr-2" style={{ width: '44%' }}>Descripción</th>
                    <th className="text-center pb-2 text-xs font-semibold text-gray-500 px-2" style={{ width: '12%' }}>Cant.</th>
                    <th className="text-right pb-2 text-xs font-semibold text-gray-500 px-2" style={{ width: '20%' }}>Precio unit.</th>
                    <th className="text-right pb-2 text-xs font-semibold text-gray-500 px-2" style={{ width: '18%' }}>Subtotal</th>
                    <th style={{ width: '6%' }} />
                  </tr>
                </thead>
                <tbody>
                  {servicios.map((fila, i) => (
                    <tr key={i} className="border-b border-gray-50 group">
                      <td className="py-1.5 pr-2">
                        <input
                          type="text"
                          value={fila.descripcion}
                          onChange={e => actualizarFila(i, 'descripcion', e.target.value)}
                          placeholder="Descripción del servicio..."
                          className="w-full border border-gray-200 rounded px-2 py-1.5 text-gray-900 bg-white placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                        />
                      </td>
                      <td className="py-1.5 px-2">
                        <input
                          type="number"
                          value={fila.cantidad}
                          min={1}
                          onChange={e => actualizarFila(i, 'cantidad', Number(e.target.value))}
                          className="w-full border border-gray-200 rounded px-2 py-1.5 text-gray-900 bg-white text-center focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                        />
                      </td>
                      <td className="py-1.5 px-2">
                        {/* Precio con $ dinámico */}
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-500 pointer-events-none select-none">
                            {(preciosRaw[i] ?? '') !== '' || fila.precio_unitario > 0 ? '$' : ''}
                          </span>
                          <input
                            type="text"
                            inputMode="decimal"
                            value={preciosRaw[i] ?? (fila.precio_unitario > 0 ? String(fila.precio_unitario) : '')}
                            onChange={e => actualizarPrecioRaw(i, e.target.value)}
                            onFocus={() => {
                              if (!preciosRaw[i] && fila.precio_unitario === 0) {
                                setPreciosRaw(prev => prev.map((p, idx) => idx === i ? '' : p))
                              }
                            }}
                            placeholder="0.00"
                            className={`w-full border border-gray-200 rounded py-1.5 text-gray-900 bg-white text-right focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm ${
                              (preciosRaw[i] ?? '') !== '' || fila.precio_unitario > 0 ? 'pl-5 pr-2' : 'px-2'
                            }`}
                          />
                        </div>
                      </td>
                      <td className="py-1.5 px-2 text-right font-medium text-gray-900">
                        {fmt(fila.total)}
                      </td>
                      <td className="py-1.5 pl-1">
                        <div className="flex flex-col items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          {i > 0 && (
                            <button onClick={() => moverFila(i, -1)} className="text-gray-400 hover:text-gray-600">
                              <ChevronUp className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {i < servicios.length - 1 && (
                            <button onClick={() => moverFila(i, 1)} className="text-gray-400 hover:text-gray-600">
                              <ChevronDown className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {servicios.length > 1 && (
                            <button onClick={() => eliminarFila(i)} className="text-red-400 hover:text-red-600">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totales */}
            <div className="mt-5 border-t border-gray-100 pt-4 space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Subtotal</span>
                <span className="font-medium text-gray-900">{fmt(subtotal)}</span>
              </div>

              <div className="flex justify-between items-center text-sm text-gray-600">
                <span>Descuento</span>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 text-xs">{simbolo}</span>
                  <input
                    type="number"
                    value={descuento}
                    min={0}
                    step={0.01}
                    onChange={e => setDescuento(Number(e.target.value))}
                    className="w-28 border border-gray-200 rounded px-2 py-1 text-right text-gray-900 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                  />
                </div>
              </div>

              {/* IVA — toggle con etiqueta automática por país */}
              <div className="flex justify-between items-center text-sm text-gray-600">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={aplicarIva}
                    onChange={e => setAplicarIva(e.target.checked)}
                    className="w-4 h-4 rounded accent-blue-600"
                  />
                  Aplicar {etiqueta}
                </label>
                {aplicarIva && (
                  <span className="font-medium text-gray-900">{fmt(impuestos)}</span>
                )}
              </div>

              <div className="flex justify-between text-base font-bold text-gray-900 border-t border-gray-100 pt-2 mt-2">
                <span>TOTAL</span>
                <span>{fmt(total)}</span>
              </div>
            </div>
          </div>

          {/* Notas */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">Notas (opcional)</label>
            <textarea
              value={notas}
              onChange={e => setNotas(e.target.value)}
              rows={3}
              placeholder="Términos, condiciones, observaciones..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 bg-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-between">
            <button
              onClick={() => setPaso(1)}
              className="text-gray-500 hover:text-gray-700 text-sm font-medium px-4 py-2.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              ← Atrás
            </button>
            <button
              onClick={handleSubmit}
              disabled={cargando}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium px-6 py-2.5 rounded-lg transition-colors"
            >
              {cargando ? 'Guardando...' : 'Crear cotización'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}