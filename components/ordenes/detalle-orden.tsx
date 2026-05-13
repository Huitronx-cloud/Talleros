'use client'

import InspeccionDanos from './inspeccion-danos'
import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, Car, User, Phone, Calendar, Wrench, FileText, FileDown,
  Loader2, MessageCircle, CheckCircle2, XCircle, Clock
} from 'lucide-react'
import { Orden, EstadoOrden, Notificacion } from '@/types'
import { cambiarEstado, agregarNotaInterna } from '@/app/(dashboard)/ordenes/actions'
import BadgeEstado from './badge-estado'
import FotosDiagnostico from './fotos-diagnosticos'
import PanelPagos from './panel-pagos'
import { formatMoney } from '@/lib/utils'

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
  enviada:   { icon: CheckCircle2, clase: 'text-green-500' },
  fallida:   { icon: XCircle,      clase: 'text-red-500'   },
  pendiente: { icon: Clock,        clase: 'text-gray-400'  },
}

type Tab = 'resumen' | 'comunicacion' | 'garantia' | 'historial'

const TABS: { id: Tab; label: string; activo: string; inactivo: string }[] = [
  { id: 'resumen',      label: 'Resumen',               activo: 'bg-blue-600 text-white',   inactivo: 'text-blue-600 hover:text-blue-700'   },
  { id: 'comunicacion', label: 'Comunicación',           activo: 'bg-green-600 text-white',  inactivo: 'text-green-600 hover:text-green-700'  },
  { id: 'garantia',     label: 'Garantía y seguimiento', activo: 'bg-amber-500 text-white',  inactivo: 'text-amber-500 hover:text-amber-600'  },
  { id: 'historial',    label: 'Historial',              activo: 'bg-purple-600 text-white', inactivo: 'text-purple-600 hover:text-purple-700' },
]

export default function DetalleOrden({
  orden,
  notificaciones = [],
}: {
  orden: Orden
  notificaciones?: Notificacion[]
}) {
  const [tabActivo, setTabActivo]               = useState<Tab>('resumen')
  const [cambiando, setCambiando]               = useState(false)
  const [guardando, setGuardando]               = useState(false)
  const [nota, setNota]                         = useState(orden.notas_internas ?? '')
  const [estadoActual, setEstadoActual]         = useState<EstadoOrden>(orden.estado)
  const [historial, setHistorial]               = useState(orden.historial ?? [])
  const [enviandoWA, setEnviandoWA]             = useState(false)
  const [enviandoAprobacion, setEnviandoAprobacion] = useState(false)
  const [enviandoPortal, setEnviandoPortal]     = useState(false)
  const [enviandoGarantia, setEnviandoGarantia] = useState(false)
  const [garantiaDias, setGarantiaDias]         = useState(30)
  const [garantiaKm, setGarantiaKm]             = useState(1000)
  const [tieneGarantia, setTieneGarantia]       = useState(false)
  const [mesesRecordatorio, setMesesRecordatorio]           = useState(3)
  const [programandoRecordatorio, setProgramandoRecordatorio] = useState(false)
  const [recordatorioProgramado, setRecordatorioProgramado] = useState(false)
  const [portalUrl, setPortalUrl]               = useState('')
  const [servicioExtra, setServicioExtra]       = useState('')
  const [costoExtra, setCostoExtra]             = useState('')
  const [enviandoPdf, setEnviandoPdf] = useState(false)
const [pdfEnviado, setPdfEnviado]   = useState(false)

  const siguienteEstado = ESTADOS_SIGUIENTE[estadoActual]

  const handleCambiarEstado = async () => {
  if (!siguienteEstado) return
  setCambiando(true)
  const resultado = await cambiarEstado(orden.id, siguienteEstado)
  if (!resultado.error) {
    setHistorial(prev => [...prev, { estado: siguienteEstado, fecha: new Date().toISOString() }])
    setEstadoActual(siguienteEstado)
    // Envío automático de PDF al entregar
    if (siguienteEstado === 'entregado') {
      fetch(`/api/ordenes/${orden.id}/pdf-whatsapp`, { method: 'POST' })
        .catch(console.error)
    }
  }
  setCambiando(false)
}

  const handleGuardarNota = async () => {
    setGuardando(true)
    await agregarNotaInterna(orden.id, nota)
    setGuardando(false)
  }

  const handleEnviarWhatsApp = async () => {
    setEnviandoWA(true)
    try {
      await fetch('/api/notificaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo: 'orden_lista', ordenId: orden.id }),
      })
    } finally { setEnviandoWA(false) }
  }

  const handleEnviarPdfWhatsApp = async () => {
  setEnviandoPdf(true)
  try {
    const res = await fetch(`/api/ordenes/${orden.id}/pdf-whatsapp`, { method: 'POST' })
    if (res.ok) setPdfEnviado(true)
  } catch (e) {
    console.error(e)
  } finally {
    setEnviandoPdf(false)
  }
}

  const handleSolicitarAprobacion = async () => {
    if (!servicioExtra || !costoExtra) return
    setEnviandoAprobacion(true)
    try {
      await fetch('/api/notificaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo: 'aprobacion_extra', ordenId: orden.id, servicioExtra, costoExtra }),
      })
      setServicioExtra('')
      setCostoExtra('')
    } finally { setEnviandoAprobacion(false) }
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
    } finally { setEnviandoPortal(false) }
  }

  const handleEnviarGarantia = async () => {
    setEnviandoGarantia(true)
    try {
      await fetch('/api/notificaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo: 'garantia', ordenId: orden.id, garantiaDias, garantiaKm }),
      })
    } finally { setEnviandoGarantia(false) }
  }

  const handleProgramarRecordatorio = async () => {
    setProgramandoRecordatorio(true)
    try {
      await fetch('/api/recordatorio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ordenId: orden.id, meses: mesesRecordatorio }),
      })
      setRecordatorioProgramado(true)
    } finally { setProgramandoRecordatorio(false) }
  }

  return (
    <div className="max-w-3xl lg:max-w-4xl mx-auto">

      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <Link
            href="/ordenes"
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 mb-3 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Volver a órdenes
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold text-gray-900">
              Orden #{String(orden.numero_orden).padStart(4, '0')}
            </span>
            <BadgeEstado estado={estadoActual} />
          </div>
          <p className="text-sm text-gray-400 mt-1">
            Creada el {new Date(orden.created_at).toLocaleDateString('es-MX', {
              day: 'numeric', month: 'long', year: 'numeric',
            })}
          </p>
        </div>

        {/* Botón cambio de estado — siempre visible y prominente */}
        {siguienteEstado && (
          <button
            onClick={handleCambiarEstado}
            disabled={cambiando}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors shadow-sm"
          >
            {cambiando && <Loader2 className="w-4 h-4 animate-spin" />}
            {LABEL_SIGUIENTE[estadoActual]}
          </button>
        )}
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1.5 mb-6 overflow-x-auto pb-1">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setTabActivo(tab.id)}
            className={`flex-1 text-sm font-semibold py-2.5 px-3 rounded-lg transition-all whitespace-nowrap border-2 ${
              tabActivo === tab.id
                ? `${tab.activo} border-transparent shadow-sm`
                : `bg-white ${tab.inactivo} border-gray-200 hover:border-gray-300`
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════
          TAB 1 — RESUMEN
      ══════════════════════════════════════════ */}
      {tabActivo === 'resumen' && (
        <div className="space-y-5">

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

          {/* Botón historial del vehículo */}
{(orden.placas || (orden as any).vin) && (
  <Link
    href={`/vehiculos/${encodeURIComponent((orden as any).vin ?? orden.placas ?? '')}`}
    className="mt-3 flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
  >
    <Car className="w-3.5 h-3.5" />
    Ver historial completo del vehículo
  </Link>
)}

          {/* Fechas y mecánico */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-4 h-4 text-gray-400" />
              <h3 className="text-sm font-semibold text-gray-900">Fechas y asignación</h3>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              {[
                { label: 'Entrada',   fecha: orden.fecha_entrada   },
                { label: 'Prometida', fecha: orden.fecha_prometida },
                { label: 'Entrega',   fecha: orden.fecha_entrega   },
              ].map(({ label, fecha }) => (
                <div key={label}>
                  <p className="text-gray-400 mb-1">{label}</p>
                  <p className="font-medium text-gray-900">
                    {fecha
                      ? new Date(fecha + 'T12:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })
                      : '—'}
                  </p>
                </div>
              ))}
            </div>
            {orden.mecanico_asignado && (
              <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2">
                <Wrench className="w-3.5 h-3.5 text-gray-400" />
                <p className="text-sm text-gray-600">
                  Mecánico: <span className="font-semibold text-gray-900">{orden.mecanico_asignado}</span>
                </p>
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

          {/* Inspección de daños */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Inspección de daños</h3>
            <InspeccionDanos
              ordenId={orden.id}
              tallerId={orden.taller_id as string}
            />
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
                      <td className="px-4 py-3 text-sm text-gray-600 text-right">{formatMoney(s.precio_unitario, orden.moneda)}</td>
                      <td className="px-5 py-3 text-sm font-semibold text-gray-900 text-right">{formatMoney(s.total, orden.moneda)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="px-5 py-4 border-t border-gray-100 bg-gray-50 space-y-1.5">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal</span>
                  <span>{formatMoney(orden.subtotal, orden.moneda)}</span>
                </div>
                <p className="text-xs text-gray-400 capitalize">Forma de pago: {orden.forma_pago}</p>
                {(orden as any).numero_factura && (
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-400">Factura:</span>
                    <span className="text-xs font-mono font-semibold text-gray-700">
                      {(orden as any).numero_factura}
                    </span>
                  </div>
                )}
                {orden.descuento > 0 && (
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Descuento</span>
                    <span>-{formatMoney(orden.descuento, orden.moneda)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-bold text-gray-900 pt-1 border-t border-gray-200">
                  <span>Total</span>
                  <span>{formatMoney(orden.total, orden.moneda)}</span>
                </div>
                <p className="text-xs text-gray-400 capitalize">Forma de pago: {orden.forma_pago}</p>
              </div>
            </div>
          )}
          {/* Pagos y anticipos */}
          <PanelPagos orden={orden} tallerId={orden.taller_id as string} />

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
        </div>
      )}

      {/* ══════════════════════════════════════════
          TAB 2 — COMUNICACIÓN
      ══════════════════════════════════════════ */}
      {tabActivo === 'comunicacion' && (
        <div className="space-y-5">

          {/* Fotos de diagnóstico */}
          <FotosDiagnostico ordenId={orden.id} tallerId={orden.taller_id as string} />

          {/* Avisar que está listo */}
          {estadoActual === 'en_proceso' && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-2 mb-3">
                <MessageCircle className="w-4 h-4 text-green-500" />
                <h3 className="text-sm font-semibold text-gray-900">Avisar al cliente</h3>
              </div>
              <p className="text-xs text-gray-400 mb-4">
                Envía un WhatsApp al cliente avisando que su vehículo está listo para recoger.
              </p>
              <button
                onClick={handleEnviarWhatsApp}
                disabled={enviandoWA}
                className="flex items-center gap-2 bg-green-500 hover:bg-green-600 disabled:opacity-60 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
              >
                {enviandoWA ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageCircle className="w-4 h-4" />}
                Avisar por WhatsApp
              </button>
            </div>
          )}

          {/* Portal del cliente */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-2 mb-3">
              <MessageCircle className="w-4 h-4 text-purple-500" />
              <h3 className="text-sm font-semibold text-gray-900">Portal del cliente</h3>
            </div>
            <p className="text-xs text-gray-400 mb-4">
              Envía al cliente un link para que vea el estado de su vehículo en tiempo real.
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
                {enviandoPortal ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MessageCircle className="w-3.5 h-3.5" />}
                Enviar portal por WhatsApp
              </button>
            )}
          </div>

          {/* Reporte PDF por WhatsApp */}
<div className="bg-white rounded-xl border border-gray-200 p-5">
  <div className="flex items-center gap-2 mb-3">
    <FileDown className="w-4 h-4 text-blue-500" />
    <h3 className="text-sm font-semibold text-gray-900">Reporte PDF de servicio</h3>
  </div>
  <p className="text-xs text-gray-400 mb-4">
    Envía el reporte completo del servicio al cliente por WhatsApp como archivo PDF.
    {estadoActual === 'entregado' && ' Se envía automáticamente al marcar como entregado.'}
  </p>
  <div className="flex items-center gap-3">
    {pdfEnviado ? (
      <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
        <CheckCircle2 className="w-4 h-4" /> PDF enviado correctamente
      </div>
    ) : (
      <button
        onClick={handleEnviarPdfWhatsApp}
        disabled={enviandoPdf}
        className="flex items-center gap-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-4 py-2.5 rounded-lg transition-colors"
      >
        {enviandoPdf
          ? <><Loader2 className="w-4 h-4 animate-spin" /> Enviando PDF...</>
          : <><FileDown className="w-4 h-4" /> Enviar PDF por WhatsApp</>
        }
      </button>
    )}
    <a
      href={`/api/ordenes/${orden.id}/pdf`}
      target="_blank"
      className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 font-medium underline underline-offset-2"
    >
      Ver PDF
    </a>
  </div>
</div>

          {/* Solicitar aprobación de trabajo adicional */}
          {estadoActual !== 'entregado' && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-2 mb-3">
                <MessageCircle className="w-4 h-4 text-green-500" />
                <h3 className="text-sm font-semibold text-gray-900">Solicitar aprobación de trabajo adicional</h3>
              </div>
              <p className="text-xs text-gray-400 mb-4">
                El cliente recibirá un WhatsApp con los detalles y podrá responder SÍ o NO.
              </p>
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
                  {enviandoAprobacion ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MessageCircle className="w-3.5 h-3.5" />}
                  Enviar solicitud por WhatsApp
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════
          TAB 3 — GARANTÍA Y SEGUIMIENTO
      ══════════════════════════════════════════ */}
      {tabActivo === 'garantia' && (
        <div className="space-y-5">

          {/* Garantía digital */}
          {estadoActual === 'entregado' ? (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-4 h-4 text-blue-500" />
                <h3 className="text-sm font-semibold text-gray-900">Garantía digital</h3>
              </div>
              <p className="text-xs text-gray-400 mb-4">
                Envía el comprobante de garantía al cliente por WhatsApp.
              </p>
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
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-400 mb-1 block">Kilómetros</label>
                        <input
                          type="number"
                          value={garantiaKm}
                          onChange={e => setGarantiaKm(Number(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <button
                      onClick={handleEnviarGarantia}
                      disabled={enviandoGarantia}
                      className="flex items-center gap-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      {enviandoGarantia ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                      Enviar garantía por WhatsApp
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-5 text-center">
              <CheckCircle2 className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">La garantía estará disponible cuando la orden sea entregada.</p>
            </div>
          )}

          {/* Recordatorio de mantenimiento */}
          {estadoActual === 'entregado' ? (
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
                      {[1, 2, 3, 6, 12].map(m => (
                        <option key={m} value={m}>{m} {m === 1 ? 'mes' : 'meses'}</option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={handleProgramarRecordatorio}
                    disabled={programandoRecordatorio}
                    className="flex items-center gap-2 text-sm font-medium bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    {programandoRecordatorio ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Clock className="w-3.5 h-3.5" />}
                    Programar recordatorio
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-5 text-center">
              <Clock className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">El recordatorio estará disponible cuando la orden sea entregada.</p>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════
          TAB 4 — HISTORIAL
      ══════════════════════════════════════════ */}
      {tabActivo === 'historial' && (
        <div className="space-y-5">

          {/* Historial de cambios */}
          {historial.length > 0 ? (
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
          ) : (
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-8 text-center">
              <p className="text-sm text-gray-400">Aún no hay cambios registrados.</p>
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
                  const cfg  = ESTADO_NOTIF[n.estado] ?? ESTADO_NOTIF.pendiente
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
      )}

    </div>
  )
}