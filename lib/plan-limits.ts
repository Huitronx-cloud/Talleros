export type Plan = 'trial' | 'esencial' | 'pro'

export const LIMITES: Record<Plan, {
  ordenes_mes:   number
  usuarios:      number
  clientes:      number
  recordatorios: boolean
  promociones:   boolean
  resenas:       boolean
  reportes:      boolean
  exportar:      boolean
}> = {
  // 'trial' es el plan gratis para siempre (el nombre quedó de cuando era una
  // prueba de 14 días). Los topes deben coincidir con lo que promete la web:
  // 10 órdenes al mes, 1 usuario, 20 clientes.
  trial: {
    ordenes_mes:   10,
    usuarios:      1,
    clientes:      20,
    recordatorios: false,
    promociones:   false,
    resenas:       true,
    reportes:      false,
    exportar:      true,
  },
  esencial: {
    ordenes_mes:   -1,
    usuarios:      5,
    clientes:      -1,
    recordatorios: true,
    promociones:   false,
    resenas:       true,
    reportes:      false,
    exportar:      true,
  },
  pro: {
    ordenes_mes:   -1,
    usuarios:      -1,
    clientes:      -1,
    recordatorios: true,
    promociones:   true,
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