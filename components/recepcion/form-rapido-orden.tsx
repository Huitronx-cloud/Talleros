'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, ChevronRight, ChevronLeft, Loader2, UserPlus, Car, History } from 'lucide-react'
import HistorialCliente from './historial-cliente'
import { Cliente } from '@/types'
import { crearOrden } from '@/app/(dashboard)/ordenes/actions'

const INPUT = 'w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400'
const LABEL = 'block text-sm font-medium text-gray-700 mb-1'

interface Props {
  clientes: Cliente[]
  tallerId: string
  pais: string
  moneda: string
  mecanicos: { id: string; nombre: string }[]
}

export default function FormRapidoOrden({ clientes, tallerId, pais, moneda, mecanicos }: Props) {
  const router = useRouter()

  const [paso, setPaso]                       = useState(1)
  const [cargando, setCargando]               = useState(false)
  const [error, setError]                     = useState('')
  const [busqueda, setBusqueda]               = useState('')
  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null)
  const [mostrarSugerencias, setMostrarSugerencias]   = useState(false)
  const [modoNuevoCliente, setModoNuevoCliente]       = useState(false)

  // Campos cliente nuevo
  const [nuevoNombre, setNuevoNombre]   = useState('')
  const [nuevoTelefono, setNuevoTelefono] = useState('')

  // Campos vehículo y orden
  const [marca, setMarca]           = useState('')
  const [modelo, setModelo]         = useState('')
  const [placas, setPlacas]         = useState('')
  const [problema, setProblema]     = useState('')
  const [mecanico, setMecanico]     = useState('')
  const [fechaPrometida, setFechaPrometida] = useState('')

  const sugerencias = busqueda.length >= 1
    ? clientes.filter(c =>
        c.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        (c.placas ?? '').toUpperCase().includes(busqueda.toUpperCase()) ||
        (c.telefono ?? '').includes(busqueda)
      ).slice(0, 5)
    : []

  const seleccionarCliente = (c: Cliente) => {
    setClienteSeleccionado(c)
    setBusqueda(c.nombre)
    setMostrarSugerencias(false)
    setMarca(c.vehiculo_marca ?? '')
    setModelo(c.vehiculo_modelo ?? '')
    setPlacas(c.placas ?? '')
  }

  const handleSubmit = async () => {
    if (!problema.trim()) { setError('Describe el problema del vehículo'); return }
    setCargando(true)
    setError('')

    try {
      // Si es cliente nuevo, crearlo primero
      let clienteId = clienteSeleccionado?.id ?? null

      if (modoNuevoCliente && nuevoNombre.trim()) {
        const res = await fetch('/api/clientes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nombre:          nuevoNombre.trim(),
            telefono:        nuevoTelefono.trim() || null,
            vehiculo_marca:  marca.trim() || null,
            vehiculo_modelo: modelo.trim() || null,
            placas:          placas.trim() || null,
          }),
        })
        const data = await res.json()
        clienteId = data.id ?? null
      }

      const resultado = await crearOrden({
        cliente_id:           clienteId,
        vehiculo_marca:       marca,
        vehiculo_modelo:      modelo,
        vehiculo_año:         '',
        placas,
        kilometraje:          '',
        descripcion_problema: problema,
        diagnostico:          '',
        servicios_realizados: [],
        mecanico_asignado:    mecanico,
        estado:               'recibido',
        fecha_entrada:        new Date().toISOString().split('T')[0],
        fecha_prometida:      fechaPrometida,
        subtotal:             0,
        descuento:            0,
        impuestos:            0,
        tasa_iva:             0.16,
        total:                0,
        forma_pago:           'efectivo',
        notas_internas:       '',
      })

      if (resultado.error) { setError(resultado.error); return }
      router.push(`/ordenes/${resultado.id}`)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto">

      {/* Progreso */}
      <div className="flex items-center gap-3 mb-6">
        {[
          { n: 1, label: 'Cliente' },
          { n: 2, label: 'Vehículo y problema' },
        ].map(({ n, label }) => (
          <div key={n} className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
              paso >= n ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'
            }`}>{n}</div>
            <span className={`text-sm font-medium ${paso >= n ? 'text-gray-900' : 'text-gray-400'}`}>
              {label}
            </span>
            {n < 2 && <div className={`h-px w-8 ${paso > n ? 'bg-blue-600' : 'bg-gray-200'}`} />}
          </div>
        ))}
      </div>

      {/* ── PASO 1: CLIENTE ── */}
      {paso === 1 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="text-base font-semibold text-gray-900">¿Quién trae el vehículo?</h2>

          {!modoNuevoCliente ? (
            <>
              {/* Buscador */}
              <div className="relative">
                <label className={LABEL}>Buscar cliente existente</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={busqueda}
                    onChange={e => {
                      setBusqueda(e.target.value)
                      setMostrarSugerencias(true)
                      if (!e.target.value) setClienteSeleccionado(null)
                    }}
                    onFocus={() => setMostrarSugerencias(true)}
                    placeholder="Nombre, placas o teléfono..."
                    className={`${INPUT} pl-10`}
                    autoFocus
                  />
                </div>
                {mostrarSugerencias && sugerencias.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                    {sugerencias.map(c => (
                      <button
                        key={c.id}
                        type="button"
                        onMouseDown={() => seleccionarCliente(c)}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-50 last:border-0"
                      >
                        <p className="text-sm font-semibold text-gray-900">{c.nombre}</p>
                        <p className="text-xs text-gray-400">
                          {[c.vehiculo_marca, c.vehiculo_modelo, c.placas, c.telefono].filter(Boolean).join(' · ')}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Cliente seleccionado + historial */}
              {clienteSeleccionado && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
                    <div>
                      <p className="text-sm font-bold text-blue-900">{clienteSeleccionado.nombre}</p>
                      <p className="text-xs text-blue-600">
                        {[clienteSeleccionado.vehiculo_marca, clienteSeleccionado.vehiculo_modelo, clienteSeleccionado.placas].filter(Boolean).join(' · ')}
                      </p>
                    </div>
                    <button
                      onClick={() => { setClienteSeleccionado(null); setBusqueda('') }}
                      className="text-xs text-blue-500 hover:text-blue-700 font-medium"
                    >
                      Cambiar
                    </button>
                  </div>

                  {/* Historial rápido */}
                  <div className="bg-white border border-gray-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <History className="w-4 h-4 text-gray-400" />
                      <p className="text-xs font-bold text-gray-600 uppercase tracking-wide">Historial del cliente</p>
                    </div>
                    <HistorialCliente cliente={clienteSeleccionado} />
                  </div>
                </div>
              )}

              <div className="text-center">
                <span className="text-xs text-gray-400">¿Cliente nuevo?</span>
                <button
                  onClick={() => setModoNuevoCliente(true)}
                  className="ml-2 text-xs text-blue-600 font-semibold hover:text-blue-700"
                >
                  <UserPlus className="w-3.5 h-3.5 inline mr-1" />
                  Registrar aquí
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-3">
                <div>
                  <label className={LABEL}>Nombre del cliente <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={nuevoNombre}
                    onChange={e => setNuevoNombre(e.target.value)}
                    placeholder="Nombre completo"
                    className={INPUT}
                    autoFocus
                  />
                </div>
                <div>
                  <label className={LABEL}>Teléfono (WhatsApp)</label>
                  <input
                    type="tel"
                    value={nuevoTelefono}
                    onChange={e => setNuevoTelefono(e.target.value)}
                    placeholder="10 dígitos"
                    className={INPUT}
                  />
                </div>
              </div>
              <button
                onClick={() => setModoNuevoCliente(false)}
                className="text-xs text-gray-500 hover:text-gray-700 font-medium"
              >
                ← Buscar cliente existente
              </button>
            </>
          )}

          <button
            onClick={() => {
              if (!modoNuevoCliente && !clienteSeleccionado) {
                setError('Selecciona o registra un cliente')
                return
              }
              if (modoNuevoCliente && !nuevoNombre.trim()) {
                setError('El nombre del cliente es requerido')
                return
              }
              setError('')
              setPaso(2)
            }}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-3 rounded-lg transition-colors"
          >
            Siguiente <ChevronRight className="w-4 h-4" />
          </button>

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
      )}

      {/* ── PASO 2: VEHÍCULO Y PROBLEMA ── */}
      {paso === 2 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="text-base font-semibold text-gray-900">Vehículo y problema</h2>

          {/* Vehículo */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL}>Marca</label>
              <input
                type="text"
                value={marca}
                onChange={e => setMarca(e.target.value)}
                placeholder="Toyota"
                className={INPUT}
                autoFocus
              />
            </div>
            <div>
              <label className={LABEL}>Modelo</label>
              <input
                type="text"
                value={modelo}
                onChange={e => setModelo(e.target.value)}
                placeholder="Corolla"
                className={INPUT}
              />
            </div>
          </div>

          <div>
            <label className={LABEL}>Placas</label>
            <input
              type="text"
              value={placas}
              onChange={e => setPlacas(e.target.value.toUpperCase())}
              placeholder="ABC-123"
              className={INPUT}
            />
          </div>

          {/* Problema */}
          <div>
            <label className={LABEL}>¿Qué problema reporta? <span className="text-red-500">*</span></label>
            <textarea
              rows={3}
              value={problema}
              onChange={e => setProblema(e.target.value)}
              placeholder="Describe brevemente el problema que reporta el cliente..."
              className={`${INPUT} resize-none`}
            />
          </div>

          {/* Mecánico y fecha */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL}>Mecánico asignado</label>
<select
  value={mecanico}
  onChange={e => setMecanico(e.target.value)}
  className={INPUT}
>
  <option value="">Sin asignar</option>
  {mecanicos.map(m => (
    <option key={m.id} value={m.nombre}>{m.nombre}</option>
  ))}
</select>
              <label className={LABEL}>Fecha prometida</label>
              <input
                type="date"
                value={fechaPrometida}
                onChange={e => setFechaPrometida(e.target.value)}
                className={INPUT}
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

          <div className="flex gap-3">
            <button
              onClick={() => setPaso(1)}
              className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> Atrás
            </button>
            <button
              onClick={handleSubmit}
              disabled={cargando}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors"
            >
              {cargando
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Registrando...</>
                : 'Registrar orden'
              }
            </button>
          </div>
        </div>
      )}
    </div>
  )
}