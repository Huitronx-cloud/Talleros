import { describe, it, expect } from 'vitest'
import { LIMITES, BLOQUEO_POR_RUTA, planMinimoPara, getLimites } from '@/lib/plan-limits'

describe('etiquetas de plan', () => {
  it('cada etiqueta dice el plan más barato que de verdad incluye la función', () => {
    // Esta es la prueba que importa. La pantalla de Recordatorios se titulaba
    // "Feature Pro" y mandaba a "Upgrade a Pro" cuando basta con Esencial: le
    // vendía el plan caro a quien no lo necesita, o lo espantaba.
    for (const [ruta, { flag, etiqueta }] of Object.entries(BLOQUEO_POR_RUTA)) {
      expect(etiqueta, `la etiqueta de ${ruta} no coincide con su plan real`)
        .toBe(planMinimoPara(flag))
    }
  })

  it('no se etiqueta como de pago nada que el plan gratis ya tenga', () => {
    // Reseñas llevaba un PRO escrito a mano en la cabecera y está incluida en
    // los tres planes. Marcar de pago algo gratis es la forma más tonta de
    // perder a alguien.
    for (const [ruta, { flag }] of Object.entries(BLOQUEO_POR_RUTA)) {
      expect(LIMITES.trial[flag], `${ruta} está en el mapa pero el plan gratis ya la tiene`)
        .toBe(false)
    }
  })

  it('reseñas y exportar no llevan puerta: los tres planes las tienen', () => {
    for (const plan of ['trial', 'esencial', 'pro'] as const) {
      expect(LIMITES[plan].resenas).toBe(true)
      expect(LIMITES[plan].exportar).toBe(true)
    }
    expect(BLOQUEO_POR_RUTA['/resenas']).toBeUndefined()
  })

  it('lo que Esencial incluye, Pro también', () => {
    // Un plan más caro no puede tener menos. Si algún día alguien mueve un
    // flag, esto lo para.
    const flags = ['recordatorios', 'promociones', 'inventario', 'resenas', 'reportes', 'exportar'] as const
    for (const f of flags) {
      if (LIMITES.esencial[f]) {
        expect(LIMITES.pro[f], `pro perdió ${f} que esencial sí tiene`).toBe(true)
      }
    }
  })

  it('durante la prueba de 14 días se ve todo, y al vencer se cae al gratis', () => {
    const enCurso = new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString()
    const vencida = new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString()

    expect(getLimites('trial', enCurso).reportes).toBe(true)
    expect(getLimites('trial', vencida).reportes).toBe(false)
    // Sin fecha, los límites del gratis: quedarse corto nunca regala acceso.
    expect(getLimites('trial').reportes).toBe(false)
  })

  it('las rutas del mapa son rutas de verdad', () => {
    for (const ruta of Object.keys(BLOQUEO_POR_RUTA)) {
      expect(ruta.startsWith('/')).toBe(true)
    }
  })
})
