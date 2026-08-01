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

/** ¿Sigue vigente la prueba de 14 días? (trial_fin en el futuro) */
export function enTrial(trialFin?: string | null): boolean {
  if (!trialFin) return false
  const fin = new Date(trialFin).getTime()
  return Number.isFinite(fin) && fin > Date.now()
}

/**
 * Límites vigentes de un taller.
 *
 * Durante los 14 días de prueba el plan gratis corre con acceso Pro completo;
 * al vencer cae al plan gratis con sus topes (10 órdenes/mes, 1 usuario, 20
 * clientes) sin bloquear nada ni borrar datos — lo que ya está registrado se
 * sigue viendo, solo no se puede crear de más.
 *
 * Sin trialFin se devuelven los límites del plan gratis: si un call site no
 * pasa la fecha, el peor caso es quedarse corto, nunca regalar acceso.
 */
export function getLimites(plan: string, trialFin?: string | null) {
  if (plan === 'trial' && enTrial(trialFin)) return LIMITES.pro
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