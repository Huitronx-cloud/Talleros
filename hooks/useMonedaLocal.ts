import { useState, useEffect } from 'react'

const TASAS_APROXIMADAS: Record<string, { moneda: string; simbolo: string; tasa: number }> = {
  MX: { moneda: 'MXN', simbolo: '$',    tasa: 20  },
  CO: { moneda: 'COP', simbolo: '$',    tasa: 4100 },
  AR: { moneda: 'ARS', simbolo: '$',    tasa: 950  },
  CL: { moneda: 'CLP', simbolo: '$',    tasa: 950  },
  PE: { moneda: 'PEN', simbolo: 'S/',   tasa: 3.7  },
  EC: { moneda: 'USD', simbolo: '$',    tasa: 1    },
  GT: { moneda: 'GTQ', simbolo: 'Q',    tasa: 7.8  },
  CR: { moneda: 'CRC', simbolo: '₡',   tasa: 520  },
  DO: { moneda: 'DOP', simbolo: 'RD$',  tasa: 59   },
  VE: { moneda: 'USD', simbolo: '$',    tasa: 1    },
  BO: { moneda: 'BOB', simbolo: 'Bs.',  tasa: 6.9  },
  PY: { moneda: 'PYG', simbolo: '₲',   tasa: 7500 },
  UY: { moneda: 'UYU', simbolo: '$',    tasa: 39   },
  HN: { moneda: 'HNL', simbolo: 'L',    tasa: 24.7 },
  SV: { moneda: 'USD', simbolo: '$',    tasa: 1    },
  PA: { moneda: 'USD', simbolo: '$',    tasa: 1    },
  NI: { moneda: 'NIO', simbolo: 'C$',   tasa: 36.5 },
  CA: { moneda: 'CAD', simbolo: 'CA$',  tasa: 1.37 },
  US: { moneda: 'USD', simbolo: '$',    tasa: 1    },
  ES: { moneda: 'EUR', simbolo: '€',    tasa: 0.92 },
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