'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Car, User, Phone, Calendar, Wrench, FileText, Loader2, MessageCircle, CheckCircle2, XCircle, Clock } from 'lucide-react'
import { Orden, EstadoOrden, Notificacion } from '@/types'
import { cambiarEstado, agregarNotaInterna } from '@/app/(dashboard)/ordenes/actions'
import BadgeEstado from './badge-estado'
import FotosDiagnostico from './fotos-diagnosticos'

const ESTADOS_SIGUIENTE: Record<EstadoOrden, EstadoOrden | null> = {
  recibido:   'en_proceso',
  en_proceso: 'listo',
  listo:      'entregado',
  entregado:  null,
}

const LABEL_SIGUIENTE: Record<EstadoOrden, string> = {
  recibido:   'Marcar en proceso',
  en_proceso: 'Marcar como listo',
  listo:      'Marcar como entregado',
  entregado:  '',
}

const TIPO_LABEL: Record<string, string> = {
  orden_lista:  'Orden lista',
  recordatorio: 'Recordatorio',
  seguimiento:  'Seguimiento',
}

const ESTADO_NOTIF = {
  enviada:  { icon: CheckCircle2, clase: 'text-green-500' },
  fallida:  { icon: XCircle,      clase: 'text-red-500'   },
  pendiente:{ icon: Clock,        clase: 'text-gray-400'  },
}

export default function DetalleOrden({ orden, notificaciones = [] }: { orden: Orden; notificaciones?: Notificacion[] }) {
  const [cambiando, setCambiando]   = useState(false)
  const [guardando, setGuardando]   = useState(false)
  const [nota, setNota]             = useState(orden.notas_internas ?? '')
  const [estadoActual, setEstadoActual] = useState<EstadoOrden>(orden.estado)
  const [historial, setHistorial]   = useState(orden.historial ?? [])
  const [enviandoWA, setEnviandoWA] = useState(false)
  const [enviandoAprobacion, setEnviandoAprobacion] = useState(false)
  const [enviandoPortal, setEnviandoPortal] = useState(false)
  const [enviandoGarantia, setEnviandoGarantia] = useState(false)
const [garantiaDias, setGarantiaDias] = useState(30)
const [garantiaKm, setGarantiaKm] = useState(1000)
const [tieneGarantia, setTieneGarantia] = useState(false)
const [mesesRecordatorio, setMesesRecordatorio] = useState(3)
const [programandoRecordatorio, setProgramandoRecordatorio] = useState(false)
const [recordatorioProgramado, setRecordatorioProgramado] = useState(false)
const [portalUrl, setPortalUrl] = useState('')
const [servicioExtra, setServicioExtra] = useState('')
const [costoExtra, setCostoExtra] = useState('')

const handleEnviarWhatsApp = async () => {
  setEnviandoWA(true)
  try {
    await fetch('/api/notificaciones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tipo: 'orden_lista', ordenId: orden.id }),
    })
  } catch (error) {
    console.error('Error WhatsApp:', error)
  } finally {
    setEnviandoWA(false)
  }
}
const handleSolicitarAprobacion = async () => {
  if (!servicioExtra || !costoExtra) return
  setEnviandoAprobacion(true)
  try {
    await fetch('/api/notificaciones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tipo: 'aprobacion_extra',
        ordenId: orden.id,
        servicioExtra,
        costoExtra,
      }),
    })
    setServicioExtra('')
    setCostoExtra('')
  } catch (error) {
    console.error('Error:', error)
  } finally {
    setEnviandoAprobacion(false)
  }
}

const handleEnviarPortal = async () => {
  setEnviandoPortal(true)
  try {
    const res = await fetch('/api/portal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ordenId: orden.id }),
    })
    const data = await res.json()
    if (data.url) setPortalUrl(data.url)
  } catch (error) {
    console.error('Error:', error)
  } finally {
    setEnviandoPortal(false)
  }
}
const handleEnviarGarantia = async () => {
  setEnviandoGarantia(true)
  try {
    await fetch('/api/notificaciones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tipo: 'garantia',
        ordenId: orden.id,
        garantiaDias,
        garantiaKm,
      }),
    })
  } catch (error) {
    console.error('Error:', error)
  } finally {
    setEnviandoGarantia(false)
  }
}
const handleProgramarRecordatorio = async () => {
  setProgramandoRecordatorio(true)
  try {
    await fetch('/api/recordatorio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ordenId: orden.id,
        meses: mesesRecordatorio,
      }),
    })
    setRecordatorioProgramado(true)
  } catch (error) {
    console.error('Error:', error)
  } finally {
    setProgramandoRecordatorio(false)
  }
}
  const siguienteEstado = ESTADOS_SIGUIENTE[estadoActual]

  const handleCambiarEstado = async () => {
    if (!siguienteEstado) return
    setCambiando(true)
    const resultado = await cambiarEstado(orden.id, siguienteEstado)
    if (!resultado.error) {
      setHistorial(prev => [...prev, { estado: siguienteEstado, fecha: new Date().toISOString() }])
      setEstadoActual(siguienteEstado)
    }
    setCambiando(false)
  }

  const handleGuardarNota = async () => {
    setGuardando(true)
    await agregarNotaInterna(orden.id, nota)
    setGuardando(false)
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <Link href="/ordenes" className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 mb-3 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Volver a órdenes
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold text-gray-900">
              Orden #{String(orden.numero_orden).padStart(4, '0')}
            </span>
            <BadgeEstado estado={estadoActual} />
          </div>
          <p className="text-sm text-gray-400 mt-1">
            Creada el {new Date(orden.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

        {/* Botón cambio de estado */}
        {siguienteEstado && (
          <div className="flex items-center gap-2">
            <p className="text-xs text-gray-400">Estado: {estadoActual}</p>
            {estadoActual === 'en_proceso' && (
              <button
                onClick={handleEnviarWhatsApp}
                disabled={enviandoWA}
                className="flex items-center gap-2 bg-green-500 hover:bg-green-600 disabled:opacity-60 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
              >
                {enviandoWA
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <MessageCircle className="w-4 h-4" />
                }
                Avisar por WhatsApp
              </button>
            )}
            <button
              onClick={handleCambiarEstado}
              disabled={cambiando}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
            >
              {cambiando && <Loader2 className="w-4 h-4 animate-spin" />}
              {LABEL_SIGUIENTE[estadoActual]}
            </button>
          </div>
        )}
      </div>
      <div className="space-y-5">
        {/* Fotos del diagnóstico */}
{estadoActual !== 'entregado' && (
  <FotosDiagnostico ordenId={orden.id} tallerId={orden.taller_id as string} />
)}
        {/* Cliente y vehículo */}
        <div className="grid grid-cols-2 gap-5">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-2 mb-3">
              <User className="w-4 h-4 text-gray-400" />
              <h3 className="text-sm font-semibold text-gray-900">Cliente</h3>
            </div>
            {orden.clientes ? (
              <>
                <p className="text-base font-semibold text-gray-900">{orden.clientes.nombre}</p>
                {orden.clientes.telefono && (
                  <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-1">
                    <Phone className="w-3.5 h-3.5" />
                    {orden.clientes.telefono}
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-gray-400">Sin cliente asignado</p>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Car className="w-4 h-4 text-gray-400" />
              <h3 className="text-sm font-semibold text-gray-900">Vehículo</h3>
            </div>
            <p className="text-base font-semibold text-gray-900">
              {[orden.vehiculo_marca, orden.vehiculo_modelo, orden.vehiculo_año].filter(Boolean).join(' ') || 'No especificado'}
            </p>
            <div className="flex items-center gap-3 mt-1">
              {orden.placas && (
                <span className="font-mono text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-semibold">
                  {orden.placas}
                </span>
              )}
              {orden.kilometraje && (
                <span className="text-sm text-gray-500">{orden.kilometraje.toLocaleString()} km</span>
              )}
            </div>
          </div>
        </div>

        {/* Fechas y mecánico */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-4 h-4 text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-900">Fechas y asignación</h3>
          </div>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-gray-400 mb-1">Entrada</p>
              <p className="font-medium text-gray-900">
                {new Date(orden.fecha_entrada + 'T12:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>
            <div>
              <p className="text-gray-400 mb-1">Prometida</p>
              <p className="font-medium text-gray-900">
                {orden.fecha_prometida
                  ? new Date(orden.fecha_prometida + 'T12:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })
                  : '—'}
              </p>
            </div>
            <div>
              <p className="text-gray-400 mb-1">Entrega</p>
              <p className="font-medium text-gray-900">
                {orden.fecha_entrega
                  ? new Date(orden.fecha_entrega + 'T12:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })
                  : '—'}
              </p>
            </div>
          </div>
          {orden.mecanico_asignado && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <Wrench className="w-3.5 h-3.5 text-gray-400" />
                <p className="text-sm text-gray-600">Mecánico: <span className="font-semibold text-gray-900">{orden.mecanico_asignado}</span></p>
              </div>
            </div>
          )}
        </div>

        {/* Problema y diagnóstico */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h3 className="text-sm font-semibold text-gray-900">Descripción</h3>
          {orden.descripcion_problema && (
            <div>
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-1">Problema reportado</p>
              <p className="text-sm text-gray-700">{orden.descripcion_problema}</p>
            </div>
          )}
          {orden.diagnostico && (
            <div>
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-1">Diagnóstico</p>
              <p className="text-sm text-gray-700">{orden.diagnostico}</p>
            </div>
          )}
        </div>

        {/* Servicios */}
        {orden.servicios_realizados?.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900">Servicios realizados</h3>
            </div>
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left px-5 py-2.5 text-xs font-semibold text-gray-500">Descripción</th>
                  <th className="text-center px-4 py-2.5 text-xs font-semibold text-gray-500">Cant.</th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500">Precio unit.</th>
                  <th className="text-right px-5 py-2.5 text-xs font-semibold text-gray-500">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {orden.servicios_realizados.map((s, i) => (
                  <tr key={i}>
                    <td className="px-5 py-3 text-sm text-gray-900">{s.descripcion}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 text-center">{s.cantidad}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 text-right">${s.precio_unitario.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                    <td className="px-5 py-3 text-sm font-semibold text-gray-900 text-right">${s.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-5 py-4 border-t border-gray-100 bg-gray-50 space-y-1.5">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Subtotal</span>
                <span>${orden.subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
              </div>
              {orden.descuento > 0 && (
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Descuento</span>
                  <span>-${orden.descuento.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold text-gray-900 pt-1 border-t border-gray-200">
                <span>Total</span>
                <span>${orden.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
              </div>
              <p className="text-xs text-gray-400 capitalize">Forma de pago: {orden.forma_pago}</p>
            </div>
          </div>
        )}
        {/* Fotos del diagnóstico */}
{estadoActual !== 'entregado' && (
  <FotosDiagnostico ordenId={orden.id} tallerId={orden.taller_id as string} />
)}
{/* Garantía digital */}
{estadoActual === 'entregado' && (
  <div className="bg-white rounded-xl border border-gray-200 p-5">
    <div className="flex items-center gap-2 mb-3">
      <CheckCircle2 className="w-4 h-4 text-blue-500" />
      <h3 className="text-sm font-semibold text-gray-900">Garantía digital</h3>
    </div>
    <p className="text-xs text-gray-400 mb-4">Envía el comprobante de garantía al cliente por WhatsApp.</p>
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="tieneGarantia"
          checked={tieneGarantia}
          onChange={e => setTieneGarantia(e.target.checked)}
          className="w-4 h-4 rounded"
        />
        <label htmlFor="tieneGarantia" className="text-sm text-gray-700">Ofrecer garantía</label>
      </div>
      {tieneGarantia && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Días de garantía</label>
              <input
                type="number"
                value={garantiaDias}
                onChange={e => setGarantiaDias(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Kilómetros</label>
              <input
                type="number"
                value={garantiaKm}
                onChange={e => setGarantiaKm(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <button
            onClick={handleEnviarGarantia}
            disabled={enviandoGarantia}
            className="flex items-center gap-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-4 py-2 rounded-lg transition-colors"
          >
            {enviandoGarantia
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
              : <CheckCircle2 className="w-3.5 h-3.5" />
            }
            Enviar garantía por WhatsApp
          </button>
        </div>
      )}
    </div>
  </div>
)}
{/* Recordatorio de mantenimiento */}
{estadoActual === 'entregado' && (
  <div className="bg-white rounded-xl border border-gray-200 p-5">
    <div className="flex items-center gap-2 mb-3">
      <Clock className="w-4 h-4 text-amber-500" />
      <h3 className="text-sm font-semibold text-gray-900">Recordatorio de mantenimiento</h3>
    </div>
    <p className="text-xs text-gray-400 mb-4">
      Programa un WhatsApp automático para recordarle al cliente su próximo servicio.
    </p>
    {recordatorioProgramado ? (
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
        <p className="text-xs text-amber-600 font-medium">
          ✅ Recordatorio programado para {mesesRecordatorio} meses después de la entrega.
        </p>
      </div>
    ) : (
      <div className="space-y-3">
        <div>
          <label className="text-xs text-gray-400 mb-1 block">Enviar recordatorio en</label>
          <select
            value={mesesRecordatorio}
            onChange={e => setMesesRecordatorio(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value={1}>1 mes</option>
            <option value={2}>2 meses</option>
            <option value={3}>3 meses</option>
            <option value={6}>6 meses</option>
            <option value={12}>12 meses</option>
          </select>
        </div>
        <button
          onClick={handleProgramarRecordatorio}
          disabled={programandoRecordatorio}
          className="flex items-center gap-2 text-sm font-medium bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white px-4 py-2 rounded-lg transition-colors"
        >
          {programandoRecordatorio
            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
            : <Clock className="w-3.5 h-3.5" />
          }
          Programar recordatorio
        </button>
      </div>
    )}
  </div>
)}
{/* Portal del cliente */}
<div className="bg-white rounded-xl border border-gray-200 p-5">
  <div className="flex items-center gap-2 mb-3">
    <MessageCircle className="w-4 h-4 text-purple-500" />
    <h3 className="text-sm font-semibold text-gray-900">Portal del cliente</h3>
  </div>
  <p className="text-xs text-gray-400 mb-3">
    Envía al cliente un link para que vea el estado de su carro en tiempo real.
  </p>
  {portalUrl ? (
    <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
      <p className="text-xs text-purple-600 font-medium mb-1">✅ Link enviado al cliente</p>
      <p className="text-xs text-purple-500 break-all">{portalUrl}</p>
    </div>
  ) : (
    <button
      onClick={handleEnviarPortal}
      disabled={enviandoPortal}
      className="flex items-center gap-2 text-sm font-medium bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white px-4 py-2 rounded-lg transition-colors"
    >
      {enviandoPortal
        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
        : <MessageCircle className="w-3.5 h-3.5" />
      }
      Enviar portal por WhatsApp
    </button>
  )}
</div>

{/* Solicitar aprobación de trabajo adicional */}
{estadoActual !== 'entregado' && (
  <div className="bg-white rounded-xl border border-gray-200 p-5">
    <div className="flex items-center gap-2 mb-3">
      <MessageCircle className="w-4 h-4 text-green-500" />
      <h3 className="text-sm font-semibold text-gray-900">Solicitar aprobación de trabajo adicional</h3>
    </div>
    <p className="text-xs text-gray-400 mb-3">El cliente recibirá un WhatsApp con los detalles y podrá responder SÍ o NO.</p>
    <div className="space-y-3">
      <input
        type="text"
        value={servicioExtra}
        onChange={e => setServicioExtra(e.target.value)}
        placeholder="Descripción del trabajo adicional (ej. Cambio de balatas traseras)"
        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 placeholder:text-gray-400"
      />
      <input
        type="number"
        value={costoExtra}
        onChange={e => setCostoExtra(e.target.value)}
        placeholder="Costo adicional (ej. 850)"
        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 placeholder:text-gray-400"
      />
      <button
        onClick={handleSolicitarAprobacion}
        disabled={enviandoAprobacion || !servicioExtra || !costoExtra}
        className="flex items-center gap-2 text-sm font-medium bg-green-500 hover:bg-green-600 disabled:opacity-60 text-white px-4 py-2 rounded-lg transition-colors"
      >
        {enviandoAprobacion
          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
          : <MessageCircle className="w-3.5 h-3.5" />
        }
        Enviar solicitud por WhatsApp
      </button>
    </div>
  </div>
)}
        {/* Notas internas */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-4 h-4 text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-900">Notas internas</h3>
          </div>
          <textarea
            rows={3}
            value={nota}
            onChange={e => setNota(e.target.value)}
            placeholder="Notas para el equipo..."
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400 resize-none mb-3"
          />
          <button
            onClick={handleGuardarNota}
            disabled={guardando}
            className="flex items-center gap-2 text-sm font-medium bg-gray-900 hover:bg-gray-700 disabled:opacity-60 text-white px-4 py-2 rounded-lg transition-colors"
          >
            {guardando && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Guardar nota
          </button>
        </div>

        {/* Historial */}
        {historial.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Historial de cambios</h3>
            <div className="space-y-3">
              {[...historial].reverse().map((h, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                  <div>
                    <div className="flex items-center gap-2">
                      <BadgeEstado estado={h.estado} />
                      <span className="text-xs text-gray-400">
                        {new Date(h.fecha).toLocaleString('es-MX', {
                          day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                        })}
                      </span>
                    </div>
                    {h.nota && <p className="text-xs text-gray-500 mt-0.5">{h.nota}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notificaciones WhatsApp */}
        {notificaciones.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-2 mb-4">
              <MessageCircle className="w-4 h-4 text-green-500" />
              <h3 className="text-sm font-semibold text-gray-900">Notificaciones WhatsApp</h3>
            </div>
            <div className="space-y-3">
              {notificaciones.map(n => {
                const cfg = ESTADO_NOTIF[n.estado] ?? ESTADO_NOTIF.pendiente
                const Icono = cfg.icon
                return (
                  <div key={n.id} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100">
                    <Icono className={`w-4 h-4 mt-0.5 flex-shrink-0 ${cfg.clase}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-gray-700">{TIPO_LABEL[n.tipo] ?? n.tipo}</span>
                        <span className="text-xs text-gray-400 flex-shrink-0">
                          {new Date(n.created_at).toLocaleString('es-MX', {
                            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{n.mensaje}</p>
                      {n.estado === 'fallida' && n.error_mensaje && (
                        <p className="text-xs text-red-500 mt-1">Error: {n.error_mensaje}</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
