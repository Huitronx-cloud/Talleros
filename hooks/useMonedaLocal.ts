import { useState, useEffect } from 'react'

const TASAS_APROXIMADAS: Record<string, { moneda: string; simbolo: string; tasa: number }> = {
  US: { moneda: 'USD', simbolo: '$',    tasa: 1     },
  MX: { moneda: 'MXN', simbolo: '$',   tasa: 17    },
  CO: { moneda: 'COP', simbolo: '$',   tasa: 4200  },
  AR: { moneda: 'ARS', simbolo: '$',   tasa: 1150  },
  CL: { moneda: 'CLP', simbolo: '$',   tasa: 960   },
  PE: { moneda: 'PEN', simbolo: 'S/',  tasa: 3.75  },
  EC: { moneda: 'USD', simbolo: '$',   tasa: 1     },
  GT: { moneda: 'GTQ', simbolo: 'Q',   tasa: 7.8   },
  CR: { moneda: 'CRC', simbolo: '₡',  tasa: 525   },
  DO: { moneda: 'DOP', simbolo: 'RD$', tasa: 61    },
  VE: { moneda: 'USD', simbolo: '$',   tasa: 1     },
  BO: { moneda: 'BOB', simbolo: 'Bs.', tasa: 6.9   },
  PY: { moneda: 'PYG', simbolo: '₲',  tasa: 7700  },
  UY: { moneda: 'UYU', simbolo: '$',   tasa: 41    },
  HN: { moneda: 'HNL', simbolo: 'L',   tasa: 25    },
  SV: { moneda: 'USD', simbolo: '$',   tasa: 1     },
  PA: { moneda: 'USD', simbolo: '$',   tasa: 1     },
  NI: { moneda: 'NIO', simbolo: 'C$',  tasa: 36.8  },
  CA: { moneda: 'CAD', simbolo: 'CA$', tasa: 1.38  },
  ES: { moneda: 'EUR', simbolo: '€',   tasa: 0.92  },
}

export function useMonedaLocal() {
  const [pais, setPais]           = useState<string>('US')
  const [cargando, setCargando]   = useState(true)

  useEffect(() => {
    fetch('/api/geo')
      .then(r => r.json())
      .then(d => {
        setPais(d.country ?? 'US')
        setCargando(false)
      })
      .catch(() => setCargando(false))
  }, [])

  const info = TASAS_APROXIMADAS[pais] ?? TASAS_APROXIMADAS['US']

  function convertir(usd: number): string {
    const local = Math.round(usd * info.tasa)
    const formateado = local.toLocaleString('es-MX')
    return `${info.simbolo}${formateado} ${info.moneda}`
  }
  return { pais, cargando, convertir, moneda: info.moneda, simbolo: info.simbolo }
}