// Fuente única de los planes que se muestran en la web pública.
//
// Antes cada landing (home, méxico, colombia, perú) tenía su propia copia de
// esta tabla, y por eso se desincronizaron del producto: la web seguía
// vendiendo los recordatorios y las reseñas como exclusivos de Pro cuando el
// plan Esencial ya los incluía, y el inventario no aparecía en ningún plan.
//
// Las funciones listadas aquí deben corresponder con lib/plan-limits.ts, que
// es lo que la app aplica de verdad.

import { IconLlave, IconPiston, IconTurbo } from '@/components/iconos-mecanicos'

type IconoPlan = (props: { size?: number; className?: string; style?: React.CSSProperties }) => JSX.Element

export type PlanWeb = {
  nombre:                  string
  precio_mensual:          number
  precio_anual:            number
  total_anual:             number
  precio_original_mensual: number
  precio_original_anual:   number
  icono:                   IconoPlan
  popular:                 boolean
  gratis:                  boolean
  ideal:                   string
  features:                string[]
}

export const PLANES_WEB: PlanWeb[] = [
  {
    nombre: 'Gratuito',
    precio_mensual: 0, precio_anual: 0, total_anual: 0,
    precio_original_mensual: 0, precio_original_anual: 0,
    icono: IconLlave,  popular: false, gratis: true,
    ideal: 'Para arrancar y ver cómo se siente trabajar con sistema.',
    features: [
      '10 órdenes de trabajo al mes',
      'Hasta 20 clientes',
      '1 usuario',
      'Portal del cliente en tiempo real',
      'Aprobación de cotizaciones por WhatsApp',
    ],
  },
  {
    // El plan al que queremos llevar a la mayoría: un taller que ya opera
    // todos los días cabe entero aquí.
    nombre: 'Esencial',
    precio_mensual: 24, precio_anual: 19, total_anual: 228,
    precio_original_mensual: 48, precio_original_anual: 38,
    icono: IconPiston, popular: true,  gratis: false,
    ideal: 'Para el taller que ya trabaja todos los días. Sin topes.',
    features: [
      'Órdenes de trabajo ilimitadas',
      'Clientes y vehículos ilimitados',
      'Hasta 5 usuarios',
      'Recordatorios automáticos de mantenimiento',
      'Reseñas automáticas en Google',
      'Control de inventario',
      'Garantía digital firmada',
      'Soporte por WhatsApp',
    ],
  },
  {
    // Pro no se vende por funciones sueltas sino por escala: varias
    // sucursales, equipo grande, volumen que ya no cabe en Esencial.
    nombre: 'Pro',
    precio_mensual: 49, precio_anual: 39, total_anual: 468,
    precio_original_mensual: 98, precio_original_anual: 78,
    icono: IconTurbo,  popular: false, gratis: false,
    ideal: 'Para talleres con varias sucursales o equipos grandes.',
    features: [
      'Todo lo del plan Esencial',
      'Usuarios ilimitados',
      'Reportes de ingresos y rendimiento por mecánico',
      'Campañas de promociones a toda tu cartera',
      'Soporte prioritario',
    ],
  },
]
