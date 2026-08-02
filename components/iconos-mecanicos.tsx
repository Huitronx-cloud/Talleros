// Iconos de taller para las tarjetas de plan. Lucide no trae pistón ni turbo,
// así que van dibujados aquí con el mismo trazo (stroke 1.8, 24x24) para que
// convivan con el resto de iconos de la página sin desentonar.

type Props = { size?: number; className?: string; style?: React.CSSProperties }

const base = (size: number) => ({
  width: size, height: size, viewBox: '0 0 24 24',
  fill: 'none', stroke: 'currentColor',
  strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const,
})

/** Llave de cruz: la herramienta con la que se empieza. */
export function IconLlave({ size = 20, className, style }: Props) {
  return (
    <svg {...base(size)} className={className} style={style} aria-hidden="true">
      <path d="M12 2.5v19M2.5 12h19" />
      <circle cx="12" cy="12" r="3.1" />
      <path d="M12 2.5h-1.6M12 2.5h1.6M2.5 12v-1.6M2.5 12v1.6M21.5 12v-1.6M21.5 12v1.6M12 21.5h-1.6M12 21.5h1.6" />
    </svg>
  )
}

/** Pistón: la pieza que hace el trabajo. Va en el plan Esencial. */
export function IconPiston({ size = 20, className, style }: Props) {
  return (
    <svg {...base(size)} className={className} style={style} aria-hidden="true">
      {/* cabeza */}
      <rect x="6" y="2.5" width="12" height="7" rx="1.6" />
      <path d="M6 5.6h12M6 7.6h12" />
      {/* biela */}
      <path d="M10.4 9.5v4.2a1.6 1.6 0 0 0 .5 1.15L12 16l1.1-1.15a1.6 1.6 0 0 0 .5-1.15V9.5" />
      {/* muñón */}
      <circle cx="12" cy="18.6" r="2.9" />
      <circle cx="12" cy="18.6" r=".8" />
    </svg>
  )
}

/** Turbo: para el taller que ya va a otra escala. */
export function IconTurbo({ size = 20, className, style }: Props) {
  return (
    <svg {...base(size)} className={className} style={style} aria-hidden="true">
      <circle cx="10.5" cy="13" r="5.5" />
      <circle cx="10.5" cy="13" r="1.6" />
      <path d="M10.5 7.5V4h8.2a1.3 1.3 0 0 1 1.3 1.3v3.4a1.3 1.3 0 0 1-1.3 1.3H15" />
      <path d="M14.6 16.4l2.6 2.6" />
    </svg>
  )
}
