export type Plan = 'trial' | 'esencial' | 'pro'

export const LIMITES: Record<Plan, {
  ordenes_mes:   number
  usuarios:      number
  clientes:      number
  recordatorios: boolean
  promociones:   boolean
  inventario:    boolean
  resenas:       boolean
  reportes:      boolean
  exportar:      boolean
}> = {
  // 'trial' es el plan gratis para siempre (el nombre quedó de cuando era una
  // prueba de 14 días). Los topes deben coincidir con lo que promete la web:
  // 5 órdenes al mes, 1 usuario, 15 clientes.
  //
  // Bajados de 10/20 el 25/08/2026. La razón NO es que alguien estuviera
  // topándose: de las 58 órdenes reales que existían, 41 eran de un solo taller
  // que ya paga, así que ningún taller gratis andaba cerca ni de 3 al mes. Se
  // hizo justamente por eso — hoy el cambio no afecta a nadie, y dentro de un
  // año, con talleres trabajando de verdad, bajarlo sería romperles una promesa.
  //
  // El tope de clientes es el que de verdad llega, porque es acumulativo y no
  // se reinicia cada mes: un taller que suma tres clientes al mes topa a los
  // cinco meses, cuando ya le tomó cariño al producto.
  trial: {
    ordenes_mes:   5,
    usuarios:      1,
    clientes:      15,
    recordatorios: false,
    promociones:   false,
    inventario:    false,
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
    inventario:    true,
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
    inventario:    true,
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
 * al vencer cae al plan gratis con sus topes (5 órdenes/mes, 1 usuario, 15
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