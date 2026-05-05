'use client'

import { useState } from 'react'
import { Orden, FormaPago } from '@/types'
import { createClient } from '@/lib/supabase/client'
import { DollarSign, Loader2, CheckCircle2 } from 'lucide-react'

interface Props {
  orden: Orden
  onCobrado: () => void
}

const FORMAS: { valor: FormaPago; label: string }[] = [
  { valor: 'efectivo',      label: '💵 Efectivo'      },
  { valor: 'transferencia', label: '🏦 Transferencia' },
  { valor: 'tarjeta',       label: '💳 Tarjeta'       },
]

export default function BotonCobrar({ orden, onCobrado }: Props) {
  const supabase = createClient()
  const [abierto, setAbierto]   = useState(false)
  const [formaPago, setFormaPago] = useState<FormaPago>(orden.forma_pago)
  const [cobrando, setCobrando] = useState(false)
  const [cobrado, setCobrado]   = useState(false)

  const handleCobrar = async () => {
    setCobrando(true)
    await supabase
      .from('ordenes')
      .update({
        cobrado:    true,
        fecha_cobro: new Date().toISOString(),
        forma_pago: formaPago,
      })
      .eq('id', orden.id)
    setCobrado(true)
    setCobrando(false)
    setTimeout(() => onCobrado(), 800)
  }

  if (cobrado) {
    return (
      <div className="flex-1 flex items-center justify-center gap-2 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-semibold">
        <CheckCircle2 className="w-4 h-4" /> Cobrado
      </div>
    )
  }

  if (!abierto) {
    return (
      <button
        onClick={() => setAbierto(true)}
        className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold transition-colors"
      >
        <DollarSign className="w-4 h-4" /> Cobrar
      </button>
    )
  }

  return (
    <div className="flex-1 space-y-2">
      <p className="text-xs font-semibold text-gray-600">Forma de pago:</p>
      <div className="grid grid-cols-3 gap-1.5">
        {FORMAS.map(f => (
          <button
            key={f.valor}
            onClick={() => setFormaPago(f.valor)}
            className={`py-1.5 px-2 rounded-lg text-xs font-semibold border-2 transition-all ${
              formaPago === f.valor
                ? 'border-green-500 bg-green-50 text-green-700'
                : 'border-gray-200 text-gray-600 hover:border-gray-300'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => setAbierto(false)}
          className="px-3 py-2 border border-gray-200 text-gray-500 text-xs font-medium rounded-lg hover:bg-gray-50"
        >
          Cancelar
        </button>
        <button
          onClick={handleCobrar}
          disabled={cobrando}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white rounded-lg text-xs font-bold transition-colors"
        >
          {cobrando
            ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Registrando...</>
            : <>Confirmar cobro ${orden.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</>
          }
        </button>
      </div>
    </div>
  )
}