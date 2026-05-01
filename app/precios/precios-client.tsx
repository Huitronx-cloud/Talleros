'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'

const planes = [
  {
    id: 'basico',
    nombre: 'Básico',
    precioMXN: 299,
    precioCOP: 45000,
    descripcion: 'Para talleres pequeños',
    features: [
      '1 usuario',
      'Clientes ilimitados',
      'Órdenes de trabajo',
      'Cotizaciones en PDF',
    ],
  },
  {
    id: 'pro',
    nombre: 'Pro',
    precioMXN: 599,
    precioCOP: 90000,
    descripcion: 'El más popular',
    features: [
      '3 usuarios',
      'Todo lo del Básico',
      'Notificaciones WhatsApp',
      'Inventario de refacciones',
      'Reportes de ingresos',
    ],
    destacado: true,
  },
  {
    id: 'multi',
    nombre: 'Multi-taller',
    precioMXN: 999,
    precioCOP: 150000,
    descripcion: 'Para cadenas de talleres',
    features: [
      'Usuarios ilimitados',
      'Todo lo del Pro',
      'Múltiples sucursales',
      'Dashboard consolidado',
      'Soporte prioritario',
    ],
  },
]

export default function PreciosClient({ tallerId }: { tallerId: string }) {
  const [moneda, setMoneda] = useState<'MXN' | 'COP'>('MXN')
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handlePago = async (planId: string) => {
    setLoading(planId)
    setError(null)
    try {
      const res = await fetch('/api/stripe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tallerId,
          plan: planId,
          moneda,
        }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setError('No se pudo iniciar el pago. Intenta de nuevo.')
      }
    } catch (err) {
      console.error('Error Stripe:', err)
      setError('Error de conexión. Intenta de nuevo.')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">
          Planes y precios
        </h1>
        <p className="text-center text-gray-500 mb-8">
          Sin contratos. Cancela cuando quieras.
        </p>

        <div className="flex justify-center gap-2 mb-10">
          {(['MXN', 'COP'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMoneda(m)}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                moneda === m
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
              }`}
            >
              {m === 'MXN' ? '🇲🇽 MXN' : '🇨🇴 COP'}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 text-center">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {planes.map((plan) => (
            <div
              key={plan.id}
              className={`bg-white rounded-2xl p-6 border-2 transition-all ${
                plan.destacado ? 'border-blue-500 shadow-lg' : 'border-gray-200'
              }`}
            >
              {plan.destacado && (
                <span className="bg-blue-500 text-white text-xs font-semibold px-3 py-1 rounded-full mb-4 inline-block">
                  Más popular
                </span>
              )}
              <h2 className="text-xl font-bold text-gray-900">{plan.nombre}</h2>
              <p className="text-gray-400 text-sm mb-4">{plan.descripcion}</p>
              <div className="mb-6">
                <span className="text-3xl font-bold text-gray-900">
                  {moneda === 'MXN'
                    ? `$${plan.precioMXN}`
                    : `$${plan.precioCOP.toLocaleString()}`}
                </span>
                <span className="text-gray-400 text-sm ml-1">{moneda}/mes</span>
              </div>
              <ul className="space-y-2 mb-8">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="text-green-500 font-bold">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handlePago(plan.id)}
                disabled={loading === plan.id}
                className={`w-full py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                  plan.destacado
                    ? 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60'
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200 disabled:opacity-60'
                }`}
              >
                {loading === plan.id ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  'Empezar ahora'
                )}
              </button>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-gray-400 mt-10">
          Los pagos son procesados de forma segura por Stripe. Puedes cancelar en cualquier momento.
        </p>
      </div>
    </div>
  )
}