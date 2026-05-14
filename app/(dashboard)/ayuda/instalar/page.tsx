import Link from 'next/link'
import { ArrowLeft, Smartphone, Download, Share, Plus, MoreVertical } from 'lucide-react'

const PASOS_IOS = [
  {
    paso: 1,
    titulo: 'Abre Safari',
    desc: 'La instalación solo funciona desde Safari. Si estás usando Chrome u otro navegador, cámbiate a Safari primero.',
    icono: '🧭',
  },
  {
    paso: 2,
    titulo: 'Toca el botón Compartir',
    desc: 'En la parte inferior de la pantalla verás el ícono de compartir — una caja con una flecha apuntando hacia arriba.',
    icono: '⬆️',
  },
  {
    paso: 3,
    titulo: 'Selecciona "Agregar a inicio"',
    desc: 'Desliza hacia abajo en el menú de opciones y toca "Agregar a pantalla de inicio".',
    icono: '➕',
  },
  {
    paso: 4,
    titulo: '¡Listo! Toca "Agregar"',
    desc: 'Confirma tocando "Agregar" en la esquina superior derecha. TallerOS aparecerá en tu pantalla de inicio como cualquier app.',
    icono: '✅',
  },
]

const PASOS_ANDROID = [
  {
    paso: 1,
    titulo: 'Abre Chrome',
    desc: 'Entra a tallerosapp.com desde Google Chrome en tu teléfono Android.',
    icono: '🌐',
  },
  {
    paso: 2,
    titulo: 'Toca el menú de opciones',
    desc: 'Toca los tres puntos (⋮) en la esquina superior derecha de Chrome.',
    icono: '⋮',
  },
  {
    paso: 3,
    titulo: 'Selecciona "Agregar a pantalla de inicio"',
    desc: 'En el menú desplegable busca la opción "Agregar a pantalla de inicio" y tócala.',
    icono: '➕',
  },
  {
    paso: 4,
    titulo: '¡Listo! Confirma la instalación',
    desc: 'Toca "Agregar" en el diálogo que aparece. TallerOS se instalará como una app nativa en tu Android.',
    icono: '✅',
  },
]

const BENEFICIOS = [
  { icono: '⚡', titulo: 'Más rápido', desc: 'Abre al instante sin esperar que cargue el navegador.' },
  { icono: '📵', titulo: 'Sin distracciones', desc: 'Pantalla completa sin barras del navegador.' },
  { icono: '🔔', titulo: 'Notificaciones push', desc: 'Recibe alertas de nuevas órdenes en tiempo real.' },
  { icono: '📱', titulo: 'Como una app nativa', desc: 'Ícono en tu pantalla de inicio, igual que cualquier app.' },
]

export default function AyudaInstalarPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">

      {/* Header */}
      <div className="mb-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al dashboard
        </Link>

        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center flex-shrink-0">
            <Smartphone className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Instalar TallerOS</h1>
            <p className="text-gray-500 text-sm mt-0.5">Instala la app en tu teléfono o tablet en menos de 1 minuto</p>
          </div>
        </div>
      </div>

      {/* Beneficios */}
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 mb-8">
        <h2 className="text-sm font-semibold text-blue-800 uppercase tracking-wide mb-4">¿Por qué instalarla?</h2>
        <div className="grid grid-cols-2 gap-4">
          {BENEFICIOS.map(b => (
            <div key={b.titulo} className="flex items-start gap-3">
              <span className="text-xl">{b.icono}</span>
              <div>
                <p className="text-sm font-semibold text-gray-900">{b.titulo}</p>
                <p className="text-xs text-gray-500 mt-0.5">{b.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* iOS */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-6">
        <div className="bg-gray-900 px-6 py-4 flex items-center gap-3">
          <span className="text-2xl">🍎</span>
          <div>
            <h2 className="text-white font-bold">iPhone o iPad</h2>
            <p className="text-gray-400 text-xs">iOS — Safari</p>
          </div>
        </div>
        <div className="p-6 space-y-4">
          {PASOS_IOS.map((paso, i) => (
            <div key={paso.paso} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white text-sm font-bold flex items-center justify-center flex-shrink-0">
                  {paso.paso}
                </div>
                {i < PASOS_IOS.length - 1 && (
                  <div className="w-0.5 bg-gray-200 flex-1 mt-2 mb-0" style={{ minHeight: 24 }} />
                )}
              </div>
              <div className="pb-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{paso.icono}</span>
                  <h3 className="font-semibold text-gray-900 text-sm">{paso.titulo}</h3>
                </div>
                <p className="text-sm text-gray-500 leading-relaxed">{paso.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Visual hint iOS */}
        <div className="mx-6 mb-6 bg-gray-50 rounded-xl p-4 border border-gray-100">
          <p className="text-xs font-semibold text-gray-500 mb-3">Así se ve el botón de compartir en Safari:</p>
          <div className="flex items-center justify-center gap-2 bg-white rounded-lg border border-gray-200 py-3 px-4 w-fit mx-auto">
            <Share className="w-5 h-5 text-blue-500" />
            <span className="text-sm text-blue-500 font-medium">Compartir</span>
          </div>
        </div>
      </div>

      {/* Android */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-6">
        <div className="bg-green-700 px-6 py-4 flex items-center gap-3">
          <span className="text-2xl">🤖</span>
          <div>
            <h2 className="text-white font-bold">Android</h2>
            <p className="text-green-200 text-xs">Android — Chrome</p>
          </div>
        </div>
        <div className="p-6 space-y-4">
          {PASOS_ANDROID.map((paso, i) => (
            <div key={paso.paso} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-green-600 text-white text-sm font-bold flex items-center justify-center flex-shrink-0">
                  {paso.paso}
                </div>
                {i < PASOS_ANDROID.length - 1 && (
                  <div className="w-0.5 bg-gray-200 flex-1 mt-2" style={{ minHeight: 24 }} />
                )}
              </div>
              <div className="pb-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{paso.icono}</span>
                  <h3 className="font-semibold text-gray-900 text-sm">{paso.titulo}</h3>
                </div>
                <p className="text-sm text-gray-500 leading-relaxed">{paso.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Visual hint Android */}
        <div className="mx-6 mb-6 bg-gray-50 rounded-xl p-4 border border-gray-100">
          <p className="text-xs font-semibold text-gray-500 mb-3">Así se ve el menú de opciones en Chrome:</p>
          <div className="flex items-center justify-center">
            <div className="bg-white rounded-lg border border-gray-200 py-2 px-4 flex items-center gap-2 w-fit">
              <MoreVertical className="w-5 h-5 text-gray-600" />
              <span className="text-sm text-gray-600 font-medium">Menú de Chrome</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tablet */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-2xl">💻</span>
          <h2 className="font-bold text-gray-900">¿Tienes una tablet?</h2>
        </div>
        <p className="text-sm text-gray-500 leading-relaxed">
          El proceso es exactamente igual. En iPad usa Safari y sigue los pasos de iOS. En tablets Android usa Chrome y sigue los pasos de Android. TallerOS está optimizado para pantallas grandes — ¡se ve increíble en tablet!
        </p>
      </div>

      {/* ¿Problemas? */}
      <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6">
        <div className="flex items-start gap-3">
          <span className="text-xl">💬</span>
          <div>
            <h3 className="font-semibold text-amber-900 mb-1">¿Necesitas ayuda?</h3>
            <p className="text-sm text-amber-700 leading-relaxed mb-3">
              Si tienes problemas instalando TallerOS contáctanos por WhatsApp y te ayudamos en minutos.
            </p>
            <a
              href="mailto:hola@tallerosapp.com"
              className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              Contactar soporte
            </a>
          </div>
        </div>
      </div>

    </div>
  )
}