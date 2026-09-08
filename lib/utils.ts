import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const CURRENCY_CONFIG: Record<string, { symbol: string; locale: string; decimals: number }> = {
  USD: { symbol: "$", locale: "en-US", decimals: 2 },
  MXN: { symbol: "MX$", locale: "es-MX", decimals: 2 },
  COP: { symbol: "COP$", locale: "es-CO", decimals: 0 },
  ARS: { symbol: "AR$", locale: "es-AR", decimals: 2 },
  CLP: { symbol: "CLP$", locale: "es-CL", decimals: 0 },
  PEN: { symbol: "S/", locale: "es-PE", decimals: 2 },
  GTQ: { symbol: "Q", locale: "es-GT", decimals: 2 },
  BOB: { symbol: "Bs", locale: "es-BO", decimals: 2 },
  PYG: { symbol: "₲", locale: "es-PY", decimals: 0 },
  UYU: { symbol: "UY$", locale: "es-UY", decimals: 2 },
  DOP: { symbol: "RD$", locale: "es-DO", decimals: 2 },
  HNL: { symbol: "L", locale: "es-HN", decimals: 2 },
  CRC: { symbol: "₡", locale: "es-CR", decimals: 0 },
  NIO: { symbol: "C$", locale: "es-NI", decimals: 2 },
  CAD: { symbol: "CA$", locale: "en-CA", decimals: 2 },
  EUR: { symbol: "€", locale: "es-ES", decimals: 2 },
}

/**
 * El importe con su símbolo DELANTE: "$2,141.36", no "2,141.36 $".
 *
 * Lo pilló un taller mirando el total en el mensaje al cliente. En todo
 * Latinoamérica el símbolo va delante —$1,500, MX$1,500, S/350— y verlo detrás
 * hace dudar de si es una cantidad o una nota al pie. En un mensaje que dice
 * cuánto hay que pagar, esa duda no puede estar.
 *
 * El euro es la excepción y se queda detrás, que es como se escribe en España.
 *
 * El espacio solo aparece cuando el símbolo acaba en letra ("Bs 350", "L 350"),
 * porque pegado se lee como una palabra. Con $ o con glifo va pegado.
 */
export function formatMoney(amount: number, moneda?: string | null): string {
  const currency = moneda ?? "USD"
  const config = CURRENCY_CONFIG[currency] ?? CURRENCY_CONFIG["USD"]

  const numero = new Intl.NumberFormat(config.locale, {
    minimumFractionDigits: config.decimals,
    maximumFractionDigits: config.decimals,
  }).format(amount)

  if (currency === "EUR") return `${numero} ${config.symbol}`

  const separador = /[A-Za-z]$/.test(config.symbol) ? " " : ""
  return `${config.symbol}${separador}${numero}`
}

/**
 * Solo el símbolo, para los sitios que arman el importe a mano (los PDF, los
 * mensajes de WhatsApp). Sale de la misma tabla que formatMoney: antes cada uno
 * tenía su propio `moneda === 'COP' ? ... : '$'` y por eso las cotizaciones de
 * un taller argentino salían etiquetadas en pesos colombianos.
 */
export function simboloMoneda(moneda?: string | null): string {
  return (CURRENCY_CONFIG[moneda ?? 'USD'] ?? CURRENCY_CONFIG['USD']).symbol
}
