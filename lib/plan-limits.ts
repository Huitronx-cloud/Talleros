export type Plan = 'trial' | 'esencial' | 'pro'

export const LIMITES: Record<Plan, {
  ordenes_mes:   number
  usuarios:      number
  clientes:      number
  recordatorios: boolean
  resenas:       boolean
  reportes:      boolean
  exportar:      boolean
}> = {
  trial: {
    ordenes_mes:   15,
    usuarios:      2,
    clientes:      50,
    recordatorios: true,
    resenas:       true,
    reportes:      true,
    exportar:      true,
  },
  esencial: {
    ordenes_mes:   -1,
    usuarios:      5,
    clientes:      -1,
    recordatorios: true,
    resenas:       true,
    reportes:      false,
    exportar:      true,
  },
  pro: {
    ordenes_mes:   -1,
    usuarios:      -1,
    clientes:      -1,
    recordatorios: true,
    resenas:       true,
    reportes:      true,
    exportar:      true,
  },
}

export function getLimites(plan: string) {
  return LIMITES[(plan as Plan)] ?? LIMITES.trial
}

export function esIlimitado(valor: number) {
  return valor === -1
}

export function puedeCrear(actual: number, limite: number) {
  if (limite === -1) return true
  return actual < limite
}

export function porcentajeUso(actual: number, limite: number) {
  if (limite === -1) return 0
  return Math.min(100, Math.round((actual / limite) * 100))
}