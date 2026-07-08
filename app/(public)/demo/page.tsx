import Link from 'next/link'
import {
  Car, Clock, CheckCircle2, Package, Wrench, Phone,
  Shield, Star, ArrowRight, Eye
} from 'lucide-react'

export const metadata = {
  title: 'Demo en vivo — TallerOS',
  description: 'Así ve tu cliente el estado de su vehículo en tiempo real. Sin llamadas, sin WhatsApps de ida y vuelta.',
  alternates: { canonical: '/demo' },
}

const DEMO_TALLER = {
  nombre:  'Taller Mecánico Reyes',
  horario: 'Lun–Sáb 8am–7pm',
  telefono: '5215512345678',
  instagram: 'tallerreyes',
}

const DEMO_ORDEN = {
  vehiculo:    'Toyota Corolla 2020',
  placas:      'ABC-123-D',
  problema:    'Cambio de aceite y revisión de frenos delanteros + balanceo de llantas',
  total:       1950,
  moneda:      'MXN',
  estado:      'en_proceso',
  fechaEntrega: (() => {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'long' })
  })(),
}

const DEMO_SERVICIOS = [
  { descripcion: 'Cambio de aceite sintético 5W-30',  cantidad: 1, precio: 650,  total: 650  },
  { descripcion: 'Filtro de aceite',                   cantidad: 1, precio: 150,  total: 150  },
  { descripcion: 'Revisión y ajuste de frenos',        cantidad: 1, precio: 800,  total: 800  },
  { descripcion: 'Balanceo de 4 llantas',              cantidad: 1, precio: 350,  total: 350  },
]

export default function DemoPage() {
  const pasos = [
    { label: 'Recibido',   icono: Package      },
    { label: 'En proceso', icono: Wrench       },
    { label: 'Listo',      icono: CheckCircle2 },
    { label: 'Entregado',  icono: Car          },
  ]

  const total = DEMO_SERVICIOS.reduce((s, i) => s + i.total, 0)

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Banner de demo */}
      <div className="bg-blue-600 text-white px-4 py-3">
        <div className="max-w-lg mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-center sm:text-left">
          <p className="text-sm font-medium flex items-center justify-center sm:justify-start gap-2">
            <Eye className="w-4 h-4 shrink-0" />
            Vista previa — así ve <strong>tu cliente</strong> el estado de su vehículo
          </p>
          <Link
            href="/registro"
            className="inline-flex items-center justify-center gap-1.5 bg-white text-blue-700 text-xs font-bold px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors shrink-0"
          >
            Crear mi taller gratis <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-8 space-y-4">

        {/* Header del taller */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-3">
            <Wrench className="w-6 h-6 text-white" />
          </div>
          <p className="text-sm font-semibold text-gray-700">{DEMO_TALLER.nombre}</p>
          <div className="flex items-center justify-center gap-1.5 mt-1.5">
            <Clock className="w-3.5 h-3.5 text-gray-400" />
            <p className="text-xs text-gray-400">{DEMO_TALLER.horario}</p>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mt-3">Hola, Carlos 👋</h1>
          <p className="text-sm text-gray-500 mt-1">
            Aquí puedes seguir el estado de tu {DEMO_ORDEN.vehiculo}
            {' '}({DEMO_ORDEN.placas})
          </p>
        </div>

        {/* Estado actual */}
        <div className="rounded-2xl border border-transparent p-6 bg-blue-50">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center flex-shrink-0 shadow-sm">
              <Wrench className="w-7 h-7 text-blue-600" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-0.5">Estado actual</p>
              <p className="text-xl font-bold text-blue-600">En proceso</p>
              <p className="text-sm text-gray-600 mt-0.5">Estamos trabajando en tu vehículo.</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-white/50 flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-500 flex-shrink-0" />
            <p className="text-sm text-gray-700">
              Fecha prometida:{' '}
              <span className="font-semibold">{DEMO_ORDEN.fechaEntrega}</span>
              {' '}(mañana)
            </p>
          </div>
        </div>

        {/* Progreso */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-5">Progreso</h2>
          <div className="flex items-start justify-between">
            {pasos.map((paso, i) => {
              const completado = i + 1 <= 2
              const Icono = paso.icono
              return (
                <div key={paso.label} className="flex flex-col items-center gap-2 flex-1">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                    completado ? 'bg-blue-600' : 'bg-gray-100'
                  }`}>
                    <Icono className={`w-5 h-5 ${completado ? 'text-white' : 'text-gray-400'}`} />
                  </div>
                  <span className={`text-xs text-center leading-tight ${completado ? 'text-gray-900 font-semibold' : 'text-gray-400'}`}>
                    {paso.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Detalles del servicio con desglose */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">Detalles de tu servicio</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {DEMO_SERVICIOS.map((s, i) => (
              <div key={i} className="flex items-center justify-between px-6 py-3 gap-4">
                <span className="text-sm text-gray-700">{s.descripcion}</span>
                <span className="text-sm font-medium text-gray-900 shrink-0">
                  ${s.total.toLocaleString()}
                </span>
              </div>
            ))}
            <div className="flex items-center justify-between px-6 py-4 bg-gray-50">
              <span className="text-sm font-bold text-gray-900">TOTAL</span>
              <span className="text-base font-bold text-gray-900">
                ${total.toLocaleString()} {DEMO_ORDEN.moneda}
              </span>
            </div>
          </div>
          <div className="px-6 py-3 bg-green-50 border-t border-green-100 flex items-center gap-2">
            <Shield className="w-4 h-4 text-green-600 shrink-0" />
            <p className="text-xs text-green-700 font-medium">
              Sin cargos sorpresa — aprobaste este presupuesto antes de comenzar el trabajo
            </p>
          </div>
        </div>

        {/* Fotos del diagnóstico (placeholders) */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-1">Fotos del diagnóstico</h2>
          <p className="text-xs text-gray-400 mb-3">Tu mecánico tomó estas fotos al revisar tu vehículo.</p>
          <div className="grid grid-cols-2 gap-2">
            {['Disco de freno desgastado', 'Aceite — cambio necesario'].map((desc, i) => (
              <div key={i} className="rounded-xl overflow-hidden bg-gray-100 aspect-video flex flex-col items-center justify-center gap-2">
                <Wrench className="w-8 h-8 text-gray-300" />
                <p className="text-xs text-gray-400 px-2 text-center">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Contacto */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center">
          <p className="text-sm text-gray-500 mb-3">¿Tienes alguna pregunta?</p>
          <a
            href={`https://wa.me/${DEMO_TALLER.telefono}?text=Hola, quiero preguntar sobre mi Toyota Corolla`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors"
          >
            <Phone className="w-4 h-4" />
            Contactar al taller por WhatsApp
          </a>
        </div>

        {/* CTA de conversión */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 text-center text-white">
          <Star className="w-8 h-8 text-yellow-300 mx-auto mb-3" />
          <h2 className="text-lg font-bold mb-2">
            Tus clientes merecen esta experiencia
          </h2>
          <p className="text-blue-100 text-sm mb-5 leading-relaxed">
            63% de los clientes desconfían de los talleres.<br />
            Con TallerOS, ven el estado en tiempo real y aprueban cada gasto antes de que empieces.
          </p>
          <Link
            href="/registro"
            className="inline-flex items-center gap-2 bg-white text-blue-700 font-bold text-sm px-6 py-3 rounded-xl hover:bg-blue-50 transition-colors"
          >
            Crear mi taller gratis — 14 días sin tarjeta
            <ArrowRight className="w-4 h-4" />
          </Link>
          <p className="text-blue-300 text-xs mt-3">Sin tarjeta de crédito · Cancela cuando quieras</p>
        </div>

        {/* Footer */}
        <div className="text-center py-2">
          <p className="text-xs text-gray-300">
            Portal en tiempo real por{' '}
            <span className="font-semibold text-gray-400">TallerOS</span>
          </p>
        </div>

      </div>
    </div>
  )
}
