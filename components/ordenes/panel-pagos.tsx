'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { DollarSign, Plus, CheckCircle2, Loader2, X } from 'lucide-react'
import { Orden, FormaPago } from '@/types'
import { formatMoney } from '@/lib/utils'

interface Pago {
  id: string
  monto: number
  forma_pago: string
  concepto: string
  nota: string | null
  created_at: string
}

interface Props {
  orden: Orden
  tallerId: string
}

const FORMAS: { valor: FormaPago; label: string }[] = [
  { valor: 'efectivo',      label: '💵 Efectivo'      },
  { valor: 'transferencia', label: '🏦 Transferencia' },
  { valor: 'tarjeta',       label: '💳 Tarjeta'       },
]

const CONCEPTOS = [
  { valor: 'anticipo', label: 'Anticipo'     },
  { valor: 'pago',     label: 'Pago parcial' },
  { valor: 'saldo',    label: 'Saldo final'  },
]

export default function PanelPagos({ orden, tallerId }: Props) {
  const supabase = createClient()
  const [pagos, setPagos]         = useState<Pago[]>([])
  const [cargando, setCargando]   = useState(true)
  const [modal, setModal]         = useState(false)
  const [guardando, setGuardando] = useState(false)

  const [monto, setMonto]         = useState('')
  const [forma, setForma]         = useState<FormaPago>('efectivo')
  const [concepto, setConcepto]   = useState<'anticipo' | 'pago' | 'saldo'>('pago')
  const [nota, setNota]           = useState('')

  useEffect(() => { cargarPagos() }, [])

  const cargarPagos = async () => {
    setCargando(true)
    const { data } = await supabase
      .from('pagos')
      .select('*')
      .eq('orden_id', orden.id)
      .order('created_at', { ascending: true })
    setPagos(data ?? [])
    setCargando(false)
  }

  const totalPagado  = pagos.reduce((a, p) => a + p.monto, 0)
  const saldoPendiente = Math.max(0, orden.total - totalPagado)
  const pagadoCompleto = saldoPendiente <= 0

  const handleAgregarPago = async () => {
    const montoNum = parseFloat(monto)
    if (!montoNum || montoNum <= 0) return
    setGuardando(true)

    const { data } = await supabase.from('pagos').insert({
      taller_id:  tallerId,
      orden_id:   orden.id,
      monto:      montoNum,
      forma_pago: forma,
      concepto,
      nota:       nota.trim() || null,
    }).select().single()

    if (data) {
      setPagos(prev => [...prev, data as Pago])
      // Marcar cobrado si ya está liquidado
      const nuevoTotal = totalPagado + montoNum
      if (nuevoTotal >= orden.total) {
        await supabase.from('ordenes').update({ cobrado: true }).eq('id', orden.id)
      }
    }

    setMonto('')
    setNota('')
    setModal(false)
    setGuardando(false)
  }

  const fmt = (n: number) => formatMoney(n, orden?.moneda)

  const CONCEPTO_COLOR: Record<string, string> = {
    anticipo: 'bg-blue-100 text-blue-700',
    pago:     'bg-gray-100 text-gray-700',
    saldo:    'bg-green-100 text-green-700',
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-green-500" />
          <h3 className="text-sm font-semibold text-gray-900">Pagos y anticipos</h3>
        </div>
        {!pagadoCompleto && (
          <button
            onClick={() => setModal(true)}
            className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700"
          >
            <Plus className="w-3.5 h-3.5" /> Registrar pago
          </button>
        )}
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <p className="text-xs text-gray-500 mb-0.5">Total orden</p>
          <p className="text-sm font-bold text-gray-900">{fmt(orden.total)}</p>
        </div>
        <div className="bg-green-50 rounded-lg p-3 text-center">
          <p className="text-xs text-gray-500 mb-0.5">Pagado</p>
          <p className="text-sm font-bold text-green-700">{fmt(totalPagado)}</p>
        </div>
        <div className={`rounded-lg p-3 text-center ${pagadoCompleto ? 'bg-green-50' : 'bg-amber-50'}`}>
          <p className="text-xs text-gray-500 mb-0.5">Saldo</p>
          <p className={`text-sm font-bold ${pagadoCompleto ? 'text-green-700' : 'text-amber-700'}`}>
            {pagadoCompleto ? '✓ Liquidado' : fmt(saldoPendiente)}
          </p>
        </div>
      </div>

      {/* Barra de progreso */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
        <div
          className="bg-green-500 h-2 rounded-full transition-all"
          style={{ width: `${Math.min(100, (totalPagado / orden.total) * 100)}%` }}
        />
      </div>

      {/* Lista de pagos */}
      {cargando ? (
        <div className="flex justify-center py-4">
          <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
        </div>
      ) : pagos.length === 0 ? (
        <p className="text-xs text-gray-400 text-center py-3">Sin pagos registrados</p>
      ) : (
        <div className="space-y-2">
          {pagos.map(p => (
            <div key={p.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${CONCEPTO_COLOR[p.concepto]}`}>
                  {CONCEPTOS.find(c => c.valor === p.concepto)?.label}
                </span>
                <span className="text-xs text-gray-400 capitalize">{p.forma_pago}</span>
                {p.nota && <span className="text-xs text-gray-400">· {p.nota}</span>}
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-gray-900">{fmt(p.monto)}</p>
                <p className="text-xs text-gray-400">
                  {new Date(p.created_at).toLocaleDateString('es-MX', {
                    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal nuevo pago */}
      {modal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-900">Registrar pago</h3>
              <button onClick={() => setModal(false)}>
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            <div className="px-5 py-4 space-y-4">
              {/* Concepto */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de pago</label>
                <div className="grid grid-cols-3 gap-2">
                  {CONCEPTOS.map(c => (
                    <button
                      key={c.valor}
                      onClick={() => setConcepto(c.valor as any)}
                      className={`py-2 text-xs font-semibold rounded-lg border-2 transition-all ${
                        concepto === c.valor
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Monto */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Monto
                  {saldoPendiente > 0 && (
                    <button
                      onClick={() => setMonto(String(saldoPendiente))}
                      className="ml-2 text-xs text-blue-600 hover:text-blue-700"
                    >
                      (saldo completo: {fmt(saldoPendiente)})
                    </button>
                  )}
                </label>
                <input
                  type="number"
                  value={monto}
                  onChange={e => setMonto(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>

              {/* Forma de pago */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Forma de pago</label>
                <div className="grid grid-cols-3 gap-2">
                  {FORMAS.map(f => (
                    <button
                      key={f.valor}
                      onClick={() => setForma(f.valor)}
                      className={`py-2 text-xs font-semibold rounded-lg border-2 transition-all ${
                        forma === f.valor
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Nota */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nota (opcional)</label>
                <input
                  type="text"
                  value={nota}
                  onChange={e => setNota(e.target.value)}
                  placeholder="Ej. Anticipo inicial"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-3 pt-1">
                <button onClick={() => setModal(false)}
                  className="px-4 py-2.5 border border-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50">
                  Cancelar
                </button>
                <button
                  onClick={handleAgregarPago}
                  disabled={guardando || !monto || parseFloat(monto) <= 0}
                  className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors"
                >
                  {guardando
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Registrando...</>
                    : <><CheckCircle2 className="w-4 h-4" /> Confirmar pago</>
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}