'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar, Clock, User, Car, Phone, CheckCircle2, XCircle, Loader2, ChevronLeft, ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type EstadoCita = 'pendiente' | 'confirmada' | 'cancelada' | 'completada'

interface Cita {
  id: string
  taller_id: string
  cliente_nombre: string
  cliente_telefono: string
  cliente_email: string | null
  vehiculo_marca: string | null
  vehiculo_modelo: string | null
  placas: string | null
  descripcion: string | null
  fecha: string
  hora: string
  estado: EstadoCita
  notas_internas: string | null
  created_at: string
}

const ESTADO_CONFIG: Record<EstadoCita, { label: string; color: string; bg: string }> = {
  pendiente:   { label: 'Pendiente',   color: 'text-yellow-700', bg: 'bg-yellow-100' },
  confirmada:  { label: 'Confirmada',  color: 'text-blue-700',   bg: 'bg-blue-100'   },
  cancelada:   { label: 'Cancelada',   color: 'text-red-700',    bg: 'bg-red-100'    },
  completada:  { label: 'Completada',  color: 'text-green-700',  bg: 'bg-green-100'  },
}

const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

export default function CalendarioCitas({ citas: citasIniciales, tallerId }: { citas: Cita[]; tallerId: string }) {
  const router = useRouter()
  const supabase = createClient()

  const hoy = new Date()
  const [mes, setMes]               = useState(hoy.getMonth())
  const [año, setAño]               = useState(hoy.getFullYear())
  const [citaSeleccionada, setCitaSeleccionada] = useState<Cita | null>(null)
  const [citas, setCitas]           = useState<Cita[]>(citasIniciales)
  const [actualizando, setActualizando] = useState(false)
  const [vista, setVista]           = useState<'mes' | 'lista'>('mes')

  // Días del mes actual
  const primerDia = new Date(año, mes, 1).getDay()
  const diasEnMes = new Date(año, mes + 1, 0).getDate()

  const citasDelMes = citas.filter(c => {
    const f = new Date(c.fecha + 'T12:00:00')
    return f.getMonth() === mes && f.getFullYear() === año
  })

  const citasPorDia = (dia: number) =>
    citasDelMes.filter(c => new Date(c.fecha + 'T12:00:00').getDate() === dia)

  const mesAnterior = () => {
    if (mes === 0) { setMes(11); setAño(a => a - 1) }
    else setMes(m => m - 1)
  }

  const mesSiguiente = () => {
    if (mes === 11) { setMes(0); setAño(a => a + 1) }
    else setMes(m => m + 1)
  }

  const cambiarEstado = async (citaId: string, nuevoEstado: EstadoCita) => {
    setActualizando(true)
    await supabase.from('citas').update({ estado: nuevoEstado }).eq('id', citaId)
    setCitas(prev => prev.map(c => c.id === citaId ? { ...c, estado: nuevoEstado } : c))
    if (citaSeleccionada?.id === citaId) setCitaSeleccionada(prev => prev ? { ...prev, estado: nuevoEstado } : null)
    setActualizando(false)
    router.refresh()
  }

  const citasProximas = citas
    .filter(c => new Date(c.fecha + 'T12:00:00') >= new Date(hoy.toDateString()) && c.estado !== 'cancelada')
    .sort((a, b) => a.fecha.localeCompare(b.fecha) || a.hora.localeCompare(b.hora))
    .slice(0, 10)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

      {/* Calendario */}
      <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button onClick={mesAnterior} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            </button>
            <h2 className="text-base font-bold text-gray-900">
              {MESES[mes]} {año}
            </h2>
            <button onClick={mesSiguiente} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </button>
          </div>
          <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
            {(['mes', 'lista'] as const).map(v => (
              <button
                key={v}
                onClick={() => setVista(v)}
                className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-all capitalize ${
                  vista === v ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
                }`}
              >
                {v === 'mes' ? 'Mes' : 'Lista'}
              </button>
            ))}
          </div>
        </div>

        {vista === 'mes' ? (
          <>
            {/* Días de la semana */}
            <div className="grid grid-cols-7 mb-2">
              {DIAS.map(d => (
                <div key={d} className="text-center text-xs font-semibold text-gray-400 py-1">{d}</div>
              ))}
            </div>

            {/* Días del mes */}
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: primerDia }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}
              {Array.from({ length: diasEnMes }).map((_, i) => {
                const dia = i + 1
                const citasDia = citasPorDia(dia)
                const esHoy = dia === hoy.getDate() && mes === hoy.getMonth() && año === hoy.getFullYear()
                return (
                  <div
                    key={dia}
                    className={`min-h-[60px] rounded-xl p-1.5 border transition-colors cursor-pointer hover:border-blue-200 ${
                      esHoy ? 'border-blue-500 bg-blue-50' : 'border-transparent hover:bg-gray-50'
                    }`}
                  >
                    <p className={`text-xs font-semibold mb-1 ${esHoy ? 'text-blue-600' : 'text-gray-700'}`}>
                      {dia}
                    </p>
                    <div className="space-y-0.5">
                      {citasDia.slice(0, 2).map(c => (
                        <button
                          key={c.id}
                          onClick={() => setCitaSeleccionada(c)}
                          className={`w-full text-left text-xs px-1 py-0.5 rounded truncate ${ESTADO_CONFIG[c.estado].bg} ${ESTADO_CONFIG[c.estado].color}`}
                        >
                          {c.hora.slice(0, 5)} {c.cliente_nombre.split(' ')[0]}
                        </button>
                      ))}
                      {citasDia.length > 2 && (
                        <p className="text-xs text-gray-400 px-1">+{citasDia.length - 2} más</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        ) : (
          <div className="space-y-3">
            {citasProximas.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                <p className="text-sm text-gray-400">No hay citas próximas</p>
              </div>
            ) : (
              citasProximas.map(c => (
                <button
                  key={c.id}
                  onClick={() => setCitaSeleccionada(c)}
                  className="w-full text-left bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl p-4 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-sm font-semibold text-gray-900">
                        {new Date(c.fecha + 'T12:00:00').toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' })}
                      </span>
                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-sm text-gray-600">{c.hora.slice(0, 5)}</span>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ESTADO_CONFIG[c.estado].bg} ${ESTADO_CONFIG[c.estado].color}`}>
                      {ESTADO_CONFIG[c.estado].label}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><User className="w-3 h-3" />{c.cliente_nombre}</span>
                    {(c.vehiculo_marca || c.placas) && (
                      <span className="flex items-center gap-1"><Car className="w-3 h-3" />{[c.vehiculo_marca, c.vehiculo_modelo].filter(Boolean).join(' ')} {c.placas && `(${c.placas})`}</span>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Panel derecho */}
      <div className="space-y-4">
        {/* Detalle de cita seleccionada */}
        {citaSeleccionada ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-gray-900">Detalle de cita</h3>
              <button onClick={() => setCitaSeleccionada(null)} className="text-gray-400 hover:text-gray-600 text-xs">
                ✕
              </button>
            </div>

            <div className="space-y-3 text-sm mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-gray-900 font-medium">
                  {new Date(citaSeleccionada.fecha + 'T12:00:00').toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}
                  {' '}a las {citaSeleccionada.hora.slice(0, 5)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-gray-400" />
                <span className="text-gray-900">{citaSeleccionada.cliente_nombre}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-400" />
                <a href={`https://wa.me/${citaSeleccionada.cliente_telefono.replace(/\D/g,'')}`} target="_blank" rel="noreferrer" className="text-green-600 hover:underline">
                  {citaSeleccionada.cliente_telefono}
                </a>
              </div>
              {(citaSeleccionada.vehiculo_marca || citaSeleccionada.placas) && (
                <div className="flex items-center gap-2">
                  <Car className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-900">
                    {[citaSeleccionada.vehiculo_marca, citaSeleccionada.vehiculo_modelo].filter(Boolean).join(' ')}
                    {citaSeleccionada.placas && ` (${citaSeleccionada.placas})`}
                  </span>
                </div>
              )}
              {citaSeleccionada.descripcion && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-400 mb-1">Motivo</p>
                  <p className="text-sm text-gray-700">{citaSeleccionada.descripcion}</p>
                </div>
              )}
            </div>

            <div className="mb-4">
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${ESTADO_CONFIG[citaSeleccionada.estado].bg} ${ESTADO_CONFIG[citaSeleccionada.estado].color}`}>
                {ESTADO_CONFIG[citaSeleccionada.estado].label}
              </span>
            </div>

            {/* Acciones */}
            <div className="space-y-2">
              {citaSeleccionada.estado === 'pendiente' && (
                <button
                  onClick={() => cambiarEstado(citaSeleccionada.id, 'confirmada')}
                  disabled={actualizando}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium py-2 rounded-lg transition-colors"
                >
                  {actualizando ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  Confirmar cita
                </button>
              )}
              {citaSeleccionada.estado === 'confirmada' && (
                <button
                  onClick={() => cambiarEstado(citaSeleccionada.id, 'completada')}
                  disabled={actualizando}
                  className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white text-sm font-medium py-2 rounded-lg transition-colors"
                >
                  {actualizando ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  Marcar como completada
                </button>
              )}
              {citaSeleccionada.estado !== 'cancelada' && citaSeleccionada.estado !== 'completada' && (
                <button
                  onClick={() => cambiarEstado(citaSeleccionada.id, 'cancelada')}
                  disabled={actualizando}
                  className="w-full flex items-center justify-center gap-2 border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-60 text-sm font-medium py-2 rounded-lg transition-colors"
                >
                  {actualizando ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                  Cancelar cita
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 p-5 text-center">
            <Calendar className="w-8 h-8 text-gray-200 mx-auto mb-2" />
            <p className="text-sm text-gray-400">Selecciona una cita para ver sus detalles</p>
          </div>
        )}

        {/* Resumen del día */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <h3 className="text-sm font-bold text-gray-900 mb-3">Hoy</h3>
          {(() => {
            const citasHoy = citas.filter(c => c.fecha === hoy.toISOString().split('T')[0] && c.estado !== 'cancelada')
            return citasHoy.length === 0 ? (
              <p className="text-xs text-gray-400">Sin citas para hoy</p>
            ) : (
              <div className="space-y-2">
                {citasHoy.sort((a,b) => a.hora.localeCompare(b.hora)).map(c => (
                  <button
                    key={c.id}
                    onClick={() => setCitaSeleccionada(c)}
                    className="w-full text-left flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <span className="text-xs font-mono font-bold text-gray-500 w-10 flex-shrink-0">{c.hora.slice(0,5)}</span>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-gray-900 truncate">{c.cliente_nombre}</p>
                      <p className="text-xs text-gray-400 truncate">{[c.vehiculo_marca, c.vehiculo_modelo].filter(Boolean).join(' ') || 'Sin vehículo'}</p>
                    </div>
                  </button>
                ))}
              </div>
            )
          })()}
        </div>
      </div>
    </div>
  )
}