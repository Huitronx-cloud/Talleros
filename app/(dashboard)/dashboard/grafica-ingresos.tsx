'use client'

interface Mes {
  key: string
  label: string
  total: number
}

export default function GraficaIngresos({ datos }: { datos: Mes[] }) {
  const maximo = Math.max(...datos.map(d => d.total), 1)

  return (
    <div className="flex items-end gap-3 h-40">
      {datos.map((mes) => {
        const altura = Math.max((mes.total / maximo) * 100, 2)
        const sinDatos = mes.total === 0
        return (
          <div key={mes.key} className="flex-1 flex flex-col items-center gap-2">
            <p className="text-xs font-semibold text-gray-700">
              {sinDatos ? '' : `$${mes.total >= 1000 ? (mes.total / 1000).toFixed(0) + 'k' : mes.total.toLocaleString()}`}
            </p>
            <div className="w-full flex items-end" style={{ height: '100px' }}>
              <div
                className={`w-full rounded-t-lg transition-all ${sinDatos ? 'bg-gray-100' : 'bg-blue-500'}`}
                style={{ height: `${altura}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 capitalize">{mes.label}</p>
          </div>
        )
      })}
    </div>
  )
}