// Iconos de taller para las tarjetas de plan.
//
// Van dibujados aquí en vez de usar mapas de bits: escalan sin pixelarse en
// pantallas de alta densidad, pesan una fracción de un PNG y heredan el color
// del plan con currentColor.
//
// La progresión cuenta la historia de los planes: una herramienta suelta
// (Gratuito), el taller entero funcionando (Esencial) y un motor de alto
// rendimiento (Pro).

type Props = { size?: number; className?: string; style?: React.CSSProperties }

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: '0 0 48 48',
  fill: 'currentColor',
  xmlns: 'http://www.w3.org/2000/svg',
})

/** Llave y carro: lo mínimo para empezar a trabajar con sistema. */
export function IconLlaveCarro({ size = 24, className, style }: Props) {
  return (
    <svg {...base(size)} className={className} style={style} aria-hidden="true">
      {/* llave de boca: cabezas arriba y abajo, mango central */}
      <path d="M9.4 3.2v5.1a2.4 2.4 0 0 1-4.8 0V3.2A6.2 6.2 0 0 0 5.6 14.6c.5.3.8.8.8 1.4v16c0 .6-.3 1.1-.8 1.4A6.2 6.2 0 0 0 4.6 44.8v-5.1a2.4 2.4 0 0 1 4.8 0v5.1a6.2 6.2 0 0 0 1-11.4c-.5-.3-.8-.8-.8-1.4V16c0-.6.3-1.1.8-1.4a6.2 6.2 0 0 0 1-11.4Z" />
      {/* cofre y toldo del vehículo */}
      <path d="M16.6 12.6c9.6-.6 18.9-.2 27.6 1.3.7.1 1.2.5 1.4 1.1l2.4 6.4c-10.4-1.8-21-2.4-31.4-1.8v-3.1c1.7-1 3-2.3 3.6-3.9Z" opacity=".55" />
      {/* cuerpo */}
      <path d="M16.6 21.7c10.6-.7 21.4-.1 31.8 1.8.8.1 1.3.7 1.3 1.4v5.4H33.1c-.9-2.4-2.2-4.5-3.9-6.1-.5-.5-1.2-.8-1.9-.8H17.9c-.5 0-1 .2-1.3.6Z" />
      {/* parrilla y faros */}
      <rect x="21.4" y="25.6" width="6.4" height="2.1" rx="1.05" />
      <path d="M40.6 24.9h2.6a2.6 2.6 0 0 1 0 5.2h-2.6a2.6 2.6 0 0 1 0-5.2Zm.6 2.1a.9.9 0 0 0 0 1.8h1.7a.9.9 0 0 0 0-1.8Z" />
      {/* faldón inferior */}
      <path d="M16.6 32.4h33.1v2.4H16.6Zm0 4.4h33.1v1.8c0 .7-.6 1.3-1.3 1.3H20.9a11 11 0 0 0-3.6-2.6Z" />
      <rect x="36.6" y="41.6" width="9.4" height="4.2" rx="1" />
    </svg>
  )
}

/** Engrane y carro: el taller entero, funcionando solo. */
export function IconTallerCompleto({ size = 24, className, style }: Props) {
  return (
    <svg {...base(size)} className={className} style={style} aria-hidden="true">
      {/* engrane de ocho dientes, arriba a la derecha */}
      <path d="M31.4 2.6h5.6l.7 3.6c1 .3 2 .7 2.9 1.3l3.1-2 4 4-2 3.1c.6.9 1 1.9 1.3 2.9l3.6.7v5.6l-3.6.7c-.3 1-.7 2-1.3 2.9l2 3.1-4 4-3.1-2c-.9.6-1.9 1-2.9 1.3l-.7 3.6h-5.6l-.7-3.6a11 11 0 0 1-2.9-1.3l-3.1 2-4-4 2-3.1a11 11 0 0 1-1.3-2.9l-3.6-.7v-5.6l3.6-.7c.3-1 .7-2 1.3-2.9l-2-3.1 4-4 3.1 2c.9-.6 1.9-1 2.9-1.3Zm2.8 9.7a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13Z" />
      {/* carro de perfil, abajo a la izquierda */}
      <path d="M8.6 29.9h9.7c1.7 0 3.3.7 4.5 1.9l3.3 3.3c.5.5 1.1.8 1.8 1l5.9 1.3a3.4 3.4 0 0 1 2.7 3.3v2.4c0 .6-.5 1.1-1.1 1.1h-4.6a5.8 5.8 0 0 0-11.4 0h-6.3a5.8 5.8 0 0 0-11.4-.2l-2.6-.5A1.4 1.4 0 0 1 -.2 42v-4.2c0-.8.6-1.5 1.4-1.7l5.5-1.2 2.4-3c.5-.6 1.2-1 2-1Z" transform="translate(3 0)" />
      <circle cx="16.2" cy="43.6" r="4" />
      <circle cx="33" cy="43.6" r="4" />
    </svg>
  )
}

/** Dos pistones en V: más motor, más taller. */
export function IconPistonesV({ size = 24, className, style }: Props) {
  return (
    <svg {...base(size)} className={className} style={style} aria-hidden="true">
      {/* pistón izquierdo: cabeza, anillos y biela */}
      <path d="M6.9 8.5 15.6 3.5a1.8 1.8 0 0 1 2.5.7l2.6 4.5-11.3 6.5-2.6-4.5a1.8 1.8 0 0 1 .7-2.5Z" />
      <path d="m10.3 17.4 11.3-6.5 1.5 2.6-11.3 6.5Z" opacity=".5" />
      <path d="m13.1 22.2 11.3-6.5 6.4 11.2-3.6 2.1-4.9-8.5-6.1 3.5Z" />
      {/* pistón derecho */}
      <path d="M41.1 8.5 32.4 3.5a1.8 1.8 0 0 0-2.5.7l-2.6 4.5 11.3 6.5 2.6-4.5a1.8 1.8 0 0 0-.7-2.5Z" />
      <path d="m37.7 17.4-11.3-6.5-1.5 2.6 11.3 6.5Z" opacity=".5" />
      <path d="m34.9 22.2-11.3-6.5-6.4 11.2 3.6 2.1 4.9-8.5 6.1 3.5Z" />
      {/* cigüeñal */}
      <path d="M21.4 28.6h5.2v4.2h-5.2Z" />
      <circle cx="24" cy="38.2" r="7.6" />
      <circle cx="24" cy="38.2" r="2.6" fill="#fff" />
    </svg>
  )
}
