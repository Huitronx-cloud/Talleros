import { EstadoCotizacion } from '@/types'
import { cn } from '@/lib/utils'

const CONFIG: Record<EstadoCotizacion, { label: string; clase: string }> = {
  borrador:  { label: 'Borrador',  clase: 'bg-gray-100 text-gray-600'    },
  enviada:   { label: 'Enviada',   clase: 'bg-blue-100 text-blue-700'    },
  aprobada:  { label: 'Aprobada',  clase: 'bg-green-100 text-green-700'  },
  rechazada: { label: 'Rechazada', clase: 'bg-red-100 text-red-700'      },
}

export default function BadgeEstadoCotizacion({
  estado, className,
}: {
  estado: EstadoCotizacion
  className?: string
}) {
  const { label, clase } = CONFIG[estado] ?? CONFIG.borrador
  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold', clase, className)}>
      {label}
    </span>
  )
}
