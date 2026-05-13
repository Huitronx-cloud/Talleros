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
  EUR: { symbol: "€", locale: "es-ES", decimals: 2 },
}

export function formatMoney(amount: number, moneda?: string | null): string {
  const currency = moneda ?? "USD"
  const config = CURRENCY_CONFIG[currency] ?? CURRENCY_CONFIG["USD"]
  
  return new Intl.NumberFormat(config.locale, {
    minimumFractionDigits: config.decimals,
    maximumFractionDigits: config.decimals,
  }).format(amount) + " " + config.symbol
}
