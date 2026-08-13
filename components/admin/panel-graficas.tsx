// Gráficas en SVG puro, sin librería.
//
// El repositorio no tiene ninguna (ni recharts ni chart.js) y la CSP de
// next.config.mjs declara script-src 'self', así que un CDN se rechazaría en
// silencio. Dibujarlas a mano evita añadir dependencia y además permite que
// estos componentes sean de servidor: no hay estado ni interacción, así que no
// hace falta enviar JavaScript al navegador.

export type Punto = { fecha: string; valor: number }

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

function etiquetaFecha(iso: string): string {
  const d = new Date(iso + 'T12:00:00Z')
  return `${d.getUTCDate()} ${MESES[d.getUTCMonth()]}`
}

/** Tarjeta de número grande con etiqueta y pie opcional. */
export function Tarjeta({
  etiqueta, valor, pie, tono = 'neutro',
}: {
  etiqueta: string
  valor: string | number
  pie?: string
  tono?: 'neutro' | 'bueno' | 'alerta' | 'acento'
}) {
  const color = {
    neutro: 'text-white',
    bueno:  'text-emerald-400',
    alerta: 'text-amber-400',
    acento: 'text-blue-400',
  }[tono]

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">{etiqueta}</p>
      <p className={`text-3xl font-bold mt-1 tabular-nums ${color}`}>{valor}</p>
      {pie && <p className="text-xs text-gray-500 mt-1 leading-snug">{pie}</p>}
    </div>
  )
}

/**
 * Barras por día. Los días sin datos se dibujan igual, con altura cero: si se
 * omitieran, una racha sin registros se vería como un hueco y no como un cero,
 * que es justo el dato que importa.
 */
export function SerieDiaria({
  titulo, datos, color = '#3b82f6', pie,
}: {
  titulo: string
  datos: Punto[]
  color?: string
  pie?: string
}) {
  const total = datos.reduce((s, p) => s + p.valor, 0)
  const max   = Math.max(1, ...datos.map(p => p.valor))
  const An = 720, Al = 180, mIzq = 34, mAb = 26, mArr = 10
  const anchoUtil = An - mIzq
  const altoUtil  = Al - mAb - mArr
  const paso  = anchoUtil / Math.max(1, datos.length)
  const ancho = Math.max(2, paso * 0.62)

  // Tres marcas en el eje: 0, la mitad y el máximo. Más líneas ensucian sin añadir.
  const marcas = [0, Math.round(max / 2), max].filter((v, i, a) => a.indexOf(v) === i)

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
      <div className="flex items-baseline justify-between mb-3">
        <h3 className="text-sm font-semibold text-white">{titulo}</h3>
        <span className="text-xs text-gray-500 tabular-nums">{total} en {datos.length} días</span>
      </div>

      <svg viewBox={`0 0 ${An} ${Al}`} className="w-full h-auto" role="img" aria-label={titulo}>
        {marcas.map(m => {
          const y = mArr + altoUtil - (m / max) * altoUtil
          return (
            <g key={m}>
              <line x1={mIzq} y1={y} x2={An} y2={y} stroke="#1f2937" strokeWidth="1" />
              <text x={mIzq - 6} y={y + 3.5} textAnchor="end" fontSize="10" fill="#6b7280">{m}</text>
            </g>
          )
        })}

        {datos.map((p, i) => {
          const alto = (p.valor / max) * altoUtil
          const x = mIzq + i * paso + (paso - ancho) / 2
          return (
            <rect
              key={p.fecha}
              x={x} y={mArr + altoUtil - alto} width={ancho} height={Math.max(p.valor > 0 ? 2 : 0, alto)}
              rx="1.5" fill={color} opacity={p.valor > 0 ? 0.9 : 0}
            >
              <title>{`${etiquetaFecha(p.fecha)}: ${p.valor}`}</title>
            </rect>
          )
        })}

        {datos.length > 0 && (
          <>
            <text x={mIzq} y={Al - 8} fontSize="10" fill="#6b7280">{etiquetaFecha(datos[0].fecha)}</text>
            <text x={An} y={Al - 8} fontSize="10" fill="#6b7280" textAnchor="end">
              {etiquetaFecha(datos[datos.length - 1].fecha)}
            </text>
          </>
        )}
      </svg>

      {pie && <p className="text-xs text-gray-500 mt-2 leading-snug">{pie}</p>}
    </div>
  )
}

/**
 * Embudo. Cada paso se mide contra el primero, no contra el anterior: lo que
 * importa aquí es qué porcentaje del total llega hasta abajo.
 */
export function Embudo({
  titulo, pasos, pie,
}: {
  titulo: string
  pasos: { etiqueta: string; valor: number; detalle?: string }[]
  pie?: string
}) {
  const base = Math.max(1, pasos[0]?.valor ?? 1)

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
      <h3 className="text-sm font-semibold text-white mb-4">{titulo}</h3>
      <div className="space-y-3">
        {pasos.map((paso, i) => {
          const pct = (paso.valor / base) * 100
          const ultimo = i === pasos.length - 1
          return (
            <div key={paso.etiqueta}>
              <div className="flex items-baseline justify-between mb-1 gap-3">
                <span className="text-xs text-gray-400">{paso.etiqueta}</span>
                <span className="text-xs text-gray-500 tabular-nums flex-shrink-0">
                  <span className="text-white font-semibold">{paso.valor}</span>
                  {i > 0 && ` · ${pct.toFixed(0)}%`}
                </span>
              </div>
              <div className="h-7 rounded-lg bg-gray-800/60 overflow-hidden">
                <div
                  className={`h-full rounded-lg ${ultimo ? 'bg-emerald-500/70' : 'bg-blue-500/60'}`}
                  style={{ width: `${Math.max(pct, paso.valor > 0 ? 2 : 0)}%` }}
                />
              </div>
              {paso.detalle && <p className="text-[11px] text-gray-600 mt-1">{paso.detalle}</p>}
            </div>
          )
        })}
      </div>
      {pie && <p className="text-xs text-gray-500 mt-3 leading-snug">{pie}</p>}
    </div>
  )
}
