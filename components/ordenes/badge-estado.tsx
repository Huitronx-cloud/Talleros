import { EstadoOrden } from '@/types'
import { cn } from '@/lib/utils'

const CONFIG: Record<EstadoOrden, { label: string; clase: string }> = {
  recibido:   { label: 'Recibido',    clase: 'bg-blue-100 text-blue-700'    },
  en_proceso: { label: 'En proceso',  clase: 'bg-yellow-100 text-yellow-700' },
  listo:      { label: 'Listo',       clase: 'bg-green-100 text-green-700'  },
  entregado:  { label: 'Entregado',   clase: 'bg-gray-100 text-gray-600'    },
}

export default function BadgeEstado({
  estado, className,
}: {
  estado: EstadoOrden
  className?: string
}) {
  const { label, clase } = CONFIG[estado] ?? CONFIG.recibido
  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold', clase, className)}>
      {label}
    </span>
  )
}
