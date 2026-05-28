'use client'

import { useState } from 'react'
import { Loader2, Check, Zap, Shield, Star, MessageCircle, Camera, Bell, Globe, BarChart2, ChevronRight, Lock } from 'lucide-react'

const MONEDAS = [
  { codigo: 'USD', bandera: '🇺🇸', factor: 1 },
  { codigo: 'MXN', bandera: '🇲🇽', factor: 17.5 },
  { codigo: 'COP', bandera: '🇨🇴', factor: 4100 },
  { codigo: 'PEN', bandera: '🇵🇪', factor: 3.7 },
  { codigo: 'ARS', bandera: '🇦🇷', factor: 990 },
  { codigo: 'CLP', bandera: '🇨🇱', factor: 930 },
]

const BASE_MENSUAL = { esencial: 19, pro: 39 }
const BASE_ANUAL   = { esencial: 15, pro: 31 }

const PRICE_IDS = {
  esencial_mensual: 'price_1TVxQ1RFpmo4G9XHSD938Kyf',
  esencial_anual:   'price_1TVxQORFpmo4G9XHZjkw3iSc',
  pro_mensual:      'price_1TVxQgRFpmo4G9XHTVC0jRSB',
  pro_anual:        'price_1TVxR3RFpmo4G9XHtmdwzFAf',
}

const FEATURES_GRATIS = [
  '1 usuario',
  '10 órdenes de trabajo al mes',
  'Hasta 20 clientes',
  'Cotizaciones básicas',
  'Portal del cliente (vista limitada)',
]

const FEATURES_ESENCIAL = [
  { icono: Check,         texto: '2 usuarios incluidos' },
  { icono: Check,         texto: 'Órdenes de trabajo ilimitadas' },
  { icono: Check,         texto: 'Portal del cliente en tiempo real' },
  { icono: Check,         texto: 'Cotizaciones en PDF' },
  { icono: Check,         texto: 'Citas y calendario' },
  { icono: Check,         texto: 'Catálogo de servicios' },
  { icono: Check,         texto: 'Notificaciones WhatsApp básicas' },
]

const FEATURES_PRO = [
  { icono: MessageCircle, texto: 'Flujo de aprobación por WhatsApp' },
  { icono: Camera,        texto: 'Fotos diagnóstico con aprobación' },
  { icono: Globe,         texto: 'Portal cliente con Google Maps' },
  { icono: Shield,        texto: 'Garantía digital por servicio' },
  { icono: Bell,          texto: 'Recordatorios automáticos 3–6 meses' },
  { icono: Star,          texto: 'Solicitud automática de reseñas Google' },
  { icono: BarChart2,     texto: 'Reportes de ingresos y métricas' },
  { icono: Check,         texto: '5 usuarios incluidos' },
  { icono: Check,         texto: 'Inventario de refacciones' },
  { icono: Check,         texto: 'Todo lo del plan Esencial' },
]

function formatPrecio(usd: number, moneda: typeof MONEDAS[0]): string {
  const base = usd * moneda.factor
  const grande = moneda.codigo === 'COP' || moneda.codigo === 'ARS' || moneda.codigo === 'CLP'
  return base.toLocaleString('es', { maximumFractionDigits: grande ? 0 : 0 })
}

export default function PreciosClient({ tallerId }: { tallerId: string }) {
  const [moneda,  setMoneda]  = useState(MONEDAS[1])
  const [anual,   setAnual]   = useState(false)
  const [loading, setLoading] = useState<string | null>(null)
  const [error,   setError]   = useState<string | null>(null)

  const handlePago = async (priceId: string) => {
    setLoading(priceId)
    setError(null)
    try {
      const res = await fetch('/api/stripe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ precio_id: priceId }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setError(data.error ?? 'No se pudo iniciar el pago. Intenta de nuevo.')
      }
    } catch {
      setError('Error de conexión. Intenta de nuevo.')
    } finally {
      setLoading(null)
    }
  }

  const precioEsencial  = anual ? BASE_ANUAL.esencial : BASE_MENSUAL.esencial
  const precioPro       = anual ? BASE_ANUAL.pro      : BASE_MENSUAL.pro
  const priceIdEsencial = anual ? PRICE_IDS.esencial_anual : PRICE_IDS.esencial_mensual
  const priceIdPro      = anual ? PRICE_IDS.pro_anual      : PRICE_IDS.pro_mensual

  return (
    <div className="min-h-screen bg-gray-950 text-white">

      <div className="relative overflow-hidden">
        <div className="absolute inset-0 opacity-20"
          style={{ backgroundImage: 'radial-gradient(ellipse at 20% 0%, #3b82f6 0%, transparent 60%), radial-gradient(ellipse at 80% 0%, #6366f1 0%, transparent 60%)' }}
        />
        <div className="relative max-w-3xl mx-auto px-4 pt-14 pb-12 text-center">
          <span className="inline-flex items-center gap-1.5 bg-blue-500/20 border border-blue-500/30 text-blue-300 text-xs font-semibold px-3 py-1.5 rounded-full mb-5">
            <Zap className="w-3 h-3" />
            Empieza gratis · Sin tarjeta de crédito
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold leading-tight mb-3">
            Un precio justo para cada taller
          </h1>
          <p className="text-gray-400 text-sm sm:text-base max-w-xl mx-auto">
            Sin contratos. Sin sorpresas. Cancela cuando quieras.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 pb-20">

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
          <div className="flex items-center gap-3 bg-gray-900 border border-gray-800 rounded-xl px-4 py-2">
            <button
              onClick={() => setAnual(false)}
              className={`text-sm font-semibold px-3 py-1.5 rounded-lg transition-all ${!anual ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              Mensual
            </button>
            <button
              onClick={() => setAnual(true)}
              className={`text-sm font-semibold px-3 py-1.5 rounded-lg transition-all flex items-center gap-2 ${anual ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              Anual
              <span className="text-[10px] font-bold bg-green-500 text-white px-1.5 py-0.5 rounded-full leading-none">-20%</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5 bg-gray-900 border border-gray-800 rounded-xl p-1.5 flex-wrap justify-center">
            {MONEDAS.map(m => (
              <button
                key={m.codigo}
                onClick={() => setMoneda(m)}
                className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-all ${moneda.codigo === m.codigo ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-white'}`}
              >
                {m.bandera} {m.codigo}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3 text-center max-w-md mx-auto">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl mx-auto">

          {/* GRATIS */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-7 flex flex-col">
            <div className="mb-6">
              <h2 className="text-lg font-bold text-white mb-1">Gratuito</h2>
              <p className="text-gray-500 text-sm">Para conocer TallerOS sin compromiso</p>
            </div>
            <div className="mb-6">
              <div className="flex items-end gap-2">
                <span className="text-4xl font-black text-white">$0</span>
                <span className="text-gray-500 text-sm mb-1">{moneda.codigo}/mes</span>
              </div>
              <p className="text-gray-600 text-xs mt-1">Para siempre gratis</p>
            </div>
            <ul className="space-y-3 flex-1 mb-8">
              {FEATURES_GRATIS.map(texto => (
                <li key={texto} className="flex items-start gap-3 text-sm text-gray-400">
                  <div className="w-5 h-5 rounded-full bg-gray-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-gray-500" />
                  </div>
                  {texto}
                </li>
              ))}
              <li className="flex items-start gap-3 text-sm text-gray-600">
                <div className="w-5 h-5 rounded-full bg-gray-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Lock className="w-3 h-3 text-gray-600" />
                </div>
                WhatsApp, reportes y más — solo en planes de pago
              </li>
            </ul>
            <a
              href="/registro"
              className="w-full py-3 rounded-xl font-semibold text-sm bg-gray-800 hover:bg-gray-700 text-white transition-all flex items-center justify-center gap-2"
            >
              Empezar gratis <ChevronRight className="w-4 h-4" />
            </a>
          </div>

          {/* ESENCIAL */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-7 flex flex-col">
            <div className="mb-6">
              <h2 className="text-lg font-bold text-white mb-1">Esencial</h2>
              <p className="text-gray-500 text-sm">Para talleres que empiezan a digitalizarse</p>
            </div>
            <div className="mb-6">
              <div className="flex items-end gap-2">
                <span className="text-4xl font-black text-white">{formatPrecio(precioEsencial, moneda)}</span>
                <span className="text-gray-500 text-sm mb-1">{moneda.codigo}/mes</span>
              </div>
              {anual && (
                <p className="text-green-400 text-xs font-semibold mt-1">
                  Cobrado anualmente · Ahorras {formatPrecio((BASE_MENSUAL.esencial - BASE_ANUAL.esencial) * 12, moneda)} {moneda.codigo}
                </p>
              )}
            </div>
            <ul className="space-y-3 flex-1 mb-8">
              {FEATURES_ESENCIAL.map(({ icono: Icono, texto }) => (
                <li key={texto} className="flex items-start gap-3 text-sm text-gray-300">
                  <div className="w-5 h-5 rounded-full bg-gray-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icono className="w-3 h-3 text-gray-400" />
                  </div>
                  {texto}
                </li>
              ))}
            </ul>
            <button
              onClick={() => handlePago(priceIdEsencial)}
              disabled={loading === priceIdEsencial}
              className="w-full py-3 rounded-xl font-semibold text-sm bg-gray-800 hover:bg-gray-700 text-white transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading === priceIdEsencial ? (
                <><Loader2 className="w-4 h-4 animate-spin" />Redirigiendo...</>
              ) : (
                <>Empezar con Esencial <ChevronRight className="w-4 h-4" /></>
              )}
            </button>
          </div>

          {/* PRO */}
          <div className="relative bg-blue-600 rounded-2xl p-7 flex flex-col shadow-xl shadow-blue-900/30">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="bg-white text-blue-700 text-xs font-black px-4 py-1.5 rounded-full shadow-sm uppercase tracking-wide">
                Más popular
              </span>
            </div>
            <div className="mb-6">
              <h2 className="text-lg font-bold text-white mb-1">Pro</h2>
              <p className="text-blue-200 text-sm">Para talleres que quieren destacarse y crecer</p>
            </div>
            <div className="mb-6">
              <div className="flex items-end gap-2">
                <span className="text-4xl font-black text-white">{formatPrecio(precioPro, moneda)}</span>
                <span className="text-blue-200 text-sm mb-1">{moneda.codigo}/mes</span>
              </div>
              {anual && (
                <p className="text-blue-200 text-xs font-semibold mt-1">
                  Cobrado anualmente · Ahorras {formatPrecio((BASE_MENSUAL.pro - BASE_ANUAL.pro) * 12, moneda)} {moneda.codigo}
                </p>
              )}
            </div>
            <ul className="space-y-3 flex-1 mb-8">
              {FEATURES_PRO.map(({ icono: Icono, texto }) => (
                <li key={texto} className="flex items-start gap-3 text-sm text-white">
                  <div className="w-5 h-5 rounded-full bg-blue-500/50 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icono className="w-3 h-3 text-white" />
                  </div>
                  {texto}
                </li>
              ))}
            </ul>
            <button
              onClick={() => handlePago(priceIdPro)}
              disabled={loading === priceIdPro}
              className="w-full py-3 rounded-xl font-black text-sm bg-white text-blue-700 hover:bg-blue-50 transition-all flex items-center justify-center gap-2 disabled:opacity-60 shadow-lg"
            >
              {loading === priceIdPro ? (
                <><Loader2 className="w-4 h-4 animate-spin text-blue-600" />Redirigiendo...</>
              ) : (
                <>Empezar con Pro <ChevronRight className="w-4 h-4" /></>
              )}
            </button>
          </div>
        </div>

        <div className="mt-12 bg-gray-900 border border-gray-800 rounded-2xl p-6 max-w-5xl mx-auto">
          <p className="text-center text-gray-500 text-xs uppercase tracking-widest font-semibold mb-6">
            Por qué los talleres Pro consiguen más clientes
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
            {[
              { stat: '63%', desc: 'de clientes desconfía de talleres que no muestran su proceso' },
              { stat: '97%', desc: 'lee reseñas en Google antes de elegir un taller mecánico' },
              { stat: '#1',  desc: 'queja en LATAM: cobros no autorizados sin aprobación previa' },
            ].map(({ stat, desc }) => (
              <div key={stat}>
                <p className="text-3xl font-black text-blue-400 mb-2">{stat}</p>
                <p className="text-gray-400 text-xs leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 text-center max-w-md mx-auto">
          <p className="text-gray-600 text-xs leading-relaxed">
            Pagos procesados de forma segura con{' '}
            <span className="text-gray-400 font-semibold">Stripe</span>.
            Cancela en cualquier momento. Si no quedas satisfecho en los primeros 7 días, te devolvemos tu dinero.
          </p>
        </div>
      </div>
    </div>
  )
}