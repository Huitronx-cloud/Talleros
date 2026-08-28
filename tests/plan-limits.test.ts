import { describe, it, expect } from 'vitest'
import { LIMITES, getLimites, enTrial, puedeCrear, esIlimitado, porcentajeUso } from '@/lib/plan-limits'
import { PLANES_WEB } from '@/lib/planes-web'

const enDias = (n: number) => new Date(Date.now() + n * 86400000).toISOString()

describe('los topes del plan gratis son los que promete la web', () => {
  // Si alguien cambia los topes en el código y no en la web —o al revés—, el
  // taller se encuentra con un límite distinto del que se le anunció. Esta
  // prueba ata las dos cosas.
  it('coinciden con lo que dice la tarjeta del plan Gratuito', () => {
    const gratis = PLANES_WEB.find(p => p.gratis)
    expect(gratis, 'no hay ningún plan marcado como gratis en planes-web.ts').toBeDefined()

    const texto = gratis!.features.join(' · ').toLowerCase()
    expect(texto).toContain(`${LIMITES.trial.ordenes_mes} órdenes`)
    expect(texto).toContain(`${LIMITES.trial.clientes} clientes`)
    expect(texto).toContain(`${LIMITES.trial.usuarios} usuario`)
  })
})

describe('durante los 14 días de prueba se tiene acceso Pro', () => {
  it('un trial vigente da los límites de Pro', () => {
    expect(getLimites('trial', enDias(7))).toEqual(LIMITES.pro)
  })

  it('al vencer cae al plan gratis, sin bloquear nada', () => {
    expect(getLimites('trial', enDias(-1))).toEqual(LIMITES.trial)
  })

  it('sin fecha de fin se asume vencido: nunca se regala acceso', () => {
    expect(getLimites('trial')).toEqual(LIMITES.trial)
    expect(getLimites('trial', null)).toEqual(LIMITES.trial)
    expect(getLimites('trial', 'no-es-una-fecha')).toEqual(LIMITES.trial)
  })

  it('un plan desconocido cae al gratis, no al Pro', () => {
    // Si el webhook de Stripe escribe un plan que no conocemos, el peor caso
    // debe ser quedarse corto — nunca abrir el producto entero.
    expect(getLimites('plan_que_no_existe')).toEqual(LIMITES.trial)
    expect(getLimites('')).toEqual(LIMITES.trial)
  })

  it('los planes de pago no dependen de la fecha del trial', () => {
    expect(getLimites('esencial', enDias(-100))).toEqual(LIMITES.esencial)
    expect(getLimites('pro', enDias(-100))).toEqual(LIMITES.pro)
  })
})

describe('enTrial', () => {
  it('futuro sí, pasado no, vacío no', () => {
    expect(enTrial(enDias(1))).toBe(true)
    expect(enTrial(enDias(-1))).toBe(false)
    expect(enTrial(null)).toBe(false)
    expect(enTrial(undefined)).toBe(false)
    expect(enTrial('')).toBe(false)
    expect(enTrial('cualquier cosa')).toBe(false)
  })
})

describe('puedeCrear', () => {
  it('-1 es ilimitado', () => {
    expect(esIlimitado(-1)).toBe(true)
    expect(puedeCrear(999999, -1)).toBe(true)
  })

  it('se puede crear hasta el tope, y en el tope ya no', () => {
    expect(puedeCrear(4, 5)).toBe(true)
    expect(puedeCrear(5, 5)).toBe(false)
    expect(puedeCrear(6, 5)).toBe(false)
  })

  it('con cero de tope no se puede crear nada', () => {
    expect(puedeCrear(0, 0)).toBe(false)
  })
})

describe('porcentajeUso', () => {
  it('lo ilimitado no llena la barra', () => {
    expect(porcentajeUso(500, -1)).toBe(0)
  })

  it('no se pasa del 100 aunque se haya superado el tope', () => {
    // Un taller que bajó de plan puede tener más filas que su tope nuevo.
    expect(porcentajeUso(20, 5)).toBe(100)
    expect(porcentajeUso(3, 5)).toBe(60)
  })
})

describe('coherencia entre planes', () => {
  it('cada plan de pago da al menos lo mismo que el gratis', () => {
    for (const plan of ['esencial', 'pro'] as const) {
      for (const campo of ['ordenes_mes', 'usuarios', 'clientes'] as const) {
        const gratis = LIMITES.trial[campo]
        const pago   = LIMITES[plan][campo]
        const mejor  = pago === -1 || (gratis !== -1 && pago >= gratis)
        expect(mejor, `${plan}.${campo} (${pago}) es peor que el del plan gratis (${gratis})`).toBe(true)
      }
      for (const campo of ['recordatorios', 'inventario', 'resenas', 'exportar'] as const) {
        expect(LIMITES[plan][campo] || !LIMITES.trial[campo],
          `${plan}.${campo} está apagado y en el plan gratis está encendido`).toBe(true)
      }
    }
  })

  it('Pro lo tiene todo encendido y sin topes', () => {
    expect(LIMITES.pro.ordenes_mes).toBe(-1)
    expect(LIMITES.pro.usuarios).toBe(-1)
    expect(LIMITES.pro.clientes).toBe(-1)
    for (const campo of ['recordatorios', 'promociones', 'inventario', 'resenas', 'reportes', 'exportar'] as const) {
      expect(LIMITES.pro[campo], `Pro debería tener ${campo}`).toBe(true)
    }
  })
})
