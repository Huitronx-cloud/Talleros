// ── IVA / impuesto de venta por país ──────────────────────────────────────────
// Fuente única para el formulario de nueva orden y el de edición. Los precios
// que se capturan son SIN IVA; el sistema lo agrega encima para el total.
export const IVA_POR_PAIS: Record<string, { tasa: number; etiqueta: string }> = {
  'México':               { tasa: 0.16, etiqueta: 'IVA 16%'   },
  'Colombia':             { tasa: 0.19, etiqueta: 'IVA 19%'   },
  'Argentina':            { tasa: 0.21, etiqueta: 'IVA 21%'   },
  'Chile':                { tasa: 0.19, etiqueta: 'IVA 19%'   },
  'Perú':                 { tasa: 0.18, etiqueta: 'IGV 18%'   },
  'Ecuador':              { tasa: 0.15, etiqueta: 'IVA 15%'   },
  'Venezuela':            { tasa: 0.16, etiqueta: 'IVA 16%'   },
  'Bolivia':              { tasa: 0.13, etiqueta: 'IVA 13%'   },
  'Paraguay':             { tasa: 0.10, etiqueta: 'IVA 10%'   },
  'Uruguay':              { tasa: 0.22, etiqueta: 'IVA 22%'   },
  'Guatemala':            { tasa: 0.12, etiqueta: 'IVA 12%'   },
  'Costa Rica':           { tasa: 0.13, etiqueta: 'IVA 13%'   },
  'Panamá':               { tasa: 0.07, etiqueta: 'ITBMS 7%'  },
  'Honduras':             { tasa: 0.15, etiqueta: 'ISV 15%'   },
  'El Salvador':          { tasa: 0.13, etiqueta: 'IVA 13%'   },
  'Nicaragua':            { tasa: 0.15, etiqueta: 'IVA 15%'   },
  'República Dominicana': { tasa: 0.18, etiqueta: 'ITBIS 18%' },
}

export function getIva(pais: string) {
  return IVA_POR_PAIS[pais] ?? { tasa: 0.16, etiqueta: 'IVA 16%' }
}

export function getMoneda(moneda: string) {
  if (moneda === 'COP') return 'COP $'
  return '$'
}
