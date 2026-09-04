import { describe, it, expect } from 'vitest'
import {
  PRECIOS_USD,
  PRECIOS_POR_PAIS,
  preciosDePais,
  resolverPrecio,
  todosLosPreciosVigentes,
  textosPlan,
  formatearPrecio,
  type PreciosPais,
} from '@/lib/precios'
import { PRECIOS_A_PLAN } from '@/lib/stripe'

/**
 * Lo que se ENSEÑA tiene que ser lo que se COBRA.
 *
 * Esta es la prueba que más falta hacía. Antes del 28/08/2026 el precio de la
 * web se calculaba multiplicando dólares por una tasa escrita a mano, y Stripe
 * cobraba en dólares: dos números para el mismo hecho. Se separaron sin que
 * nadie se enterara — a un argentino se le anunciaba un 31% menos de lo que se
 * le cobraba, y a un colombiano un 33% más de lo que costaba.
 *
 * La tabla de abajo es el único sitio donde vive "cuánto cobra cada price ID de
 * Stripe". Hay que actualizarla A MANO cuando se cree o cambie un precio en
 * Stripe, y ese es justo el punto: obliga a que alguien mire el panel de Stripe
 * y confirme el importe. Si el código y Stripe se separan, esta prueba falla.
 */
const COBRA_EN_STRIPE: Record<string, { importe: number; moneda: string }> = {
  // USD — para todo país sin precio propio
  'price_1TyjpIRFpmo4G9XHLwyeCvth': { importe: 24,      moneda: 'USD' },
  'price_1TyjplRFpmo4G9XHYkBdR8hc': { importe: 228,     moneda: 'USD' },
  'price_1TyjqERFpmo4G9XHEjasGmnq': { importe: 49,      moneda: 'USD' },
  'price_1TyjqfRFpmo4G9XHL9pi6s3y': { importe: 468,     moneda: 'USD' },
  // MXN
  'price_1U9SjlRFpmo4G9XHC7CiZXc7': { importe: 449,     moneda: 'MXN' },
  'price_1U9SlhRFpmo4G9XHNAfuvTJW': { importe: 3999,    moneda: 'MXN' },
  'price_1U9SmqRFpmo4G9XHSCZngHCz': { importe: 899,     moneda: 'MXN' },
  'price_1U9SneRFpmo4G9XHnQBGl8OV': { importe: 8199,    moneda: 'MXN' },
  // COP
  'price_1U9TrbRFpmo4G9XHcnQxrjWZ': { importe: 84900,   moneda: 'COP' },
  'price_1U9Tt7RFpmo4G9XHZH3pPEjA': { importe: 799900,  moneda: 'COP' },
  'price_1U9Tu4RFpmo4G9XHHRTK7hQb': { importe: 169900,  moneda: 'COP' },
  'price_1U9Tv0RFpmo4G9XHI0CYS9iW': { importe: 1599900, moneda: 'COP' },
  // PEN
  'price_1U9TxyRFpmo4G9XHesK00ug0': { importe: 89,      moneda: 'PEN' },
  'price_1U9TzERFpmo4G9XH6kRdHIUG': { importe: 849,     moneda: 'PEN' },
  'price_1U9U0BRFpmo4G9XHZ4keRuon': { importe: 179,     moneda: 'PEN' },
  'price_1U9U1ERFpmo4G9XHPfKHC6Jl': { importe: 1699,    moneda: 'PEN' },
}

/** Tipos de cambio del 28/08/2026, para comprobar que ningún precio pierde dinero. */
const TASAS: Record<string, number> = { USD: 1, MXN: 16.97, COP: 3156, PEN: 3.35 }
/** Lo que Stripe se queda al convertir a la moneda de la cuenta. */
const COMISION_CAMBIO = 0.02
/** El precio objetivo en dólares de cada plan. */
const OBJETIVO_USD = {
  esencial_mensual: 24,
  esencial_anual:   228,
  pro_mensual:      49,
  pro_anual:        468,
} as const

const CLAVES = Object.keys(OBJETIVO_USD) as (keyof typeof OBJETIVO_USD)[]
const TODAS: [string, PreciosPais][] = [
  ['USD (por defecto)', PRECIOS_USD],
  ...Object.entries(PRECIOS_POR_PAIS),
]

describe('lo que se enseña es lo que se cobra', () => {
  for (const [nombre, tabla] of TODAS) {
    for (const clave of CLAVES) {
      it(`${nombre} · ${clave}: el importe en pantalla coincide con el del price ID`, () => {
        const priceId = tabla.precios[clave]
        const enStripe = COBRA_EN_STRIPE[priceId]

        expect(enStripe, `el price ID ${priceId} no está en la tabla de esta prueba — si acabas de crearlo en Stripe, añádelo aquí con su importe real`).toBeDefined()
        expect(enStripe.importe).toBe(tabla.importes[clave])
        expect(enStripe.moneda).toBe(tabla.moneda)
      })
    }
  }

  it('ningún price ID se repite entre países', () => {
    const todos = todosLosPreciosVigentes()
    expect(new Set(todos).size).toBe(todos.length)
  })
})

describe('ningún precio pierde dinero', () => {
  for (const [nombre, tabla] of TODAS) {
    for (const clave of CLAVES) {
      it(`${nombre} · ${clave}: neto por encima del objetivo en dólares`, () => {
        const tasa = TASAS[tabla.moneda]
        expect(tasa, `falta el tipo de cambio de ${tabla.moneda} en esta prueba`).toBeDefined()

        const neto = (tabla.importes[clave] / tasa) * (tabla.moneda === 'USD' ? 1 : 1 - COMISION_CAMBIO)
        expect(neto).toBeGreaterThanOrEqual(OBJETIVO_USD[clave])
      })
    }
  }

  for (const [nombre, tabla] of TODAS) {
    for (const plan of ['esencial', 'pro'] as const) {
      it(`${nombre} · ${plan}: el plan anual sale más barato que el mensual`, () => {
        const porMes = tabla.importes[`${plan}_anual`] / 12
        expect(porMes).toBeLessThan(tabla.importes[`${plan}_mensual`])
      })
    }
  }
})

describe('resolverPrecio decide el precio en el servidor', () => {
  const usdMensual = PRECIOS_USD.precios.esencial_mensual
  const mxnMensual = PRECIOS_POR_PAIS.MX.precios.esencial_mensual
  const copMensual = PRECIOS_POR_PAIS.CO.precios.esencial_mensual

  it('un mexicano acaba en pesos aunque su pantalla mande el precio en dólares', () => {
    expect(resolverPrecio(usdMensual, 'MX')).toBe(mxnMensual)
  })

  it('acepta el país escrito como nombre, con acento y sin él', () => {
    // Las altas viejas guardaron 'México'; las nuevas, 'MX'. Sin esto, los
    // talleres antiguos se quedarían en dólares teniendo precio propio.
    expect(resolverPrecio(usdMensual, 'México')).toBe(mxnMensual)
    expect(resolverPrecio(usdMensual, 'mexico')).toBe(mxnMensual)
    expect(resolverPrecio(usdMensual, 'Colombia')).toBe(copMensual)
    expect(resolverPrecio(usdMensual, 'Perú')).toBe(PRECIOS_POR_PAIS.PE.precios.esencial_mensual)
  })

  it('un argentino se queda en dólares aunque pida el precio en pesos mexicanos', () => {
    expect(resolverPrecio(mxnMensual, 'AR')).toBe(usdMensual)
  })

  it('un país desconocido o vacío cae en dólares, nunca en null', () => {
    expect(resolverPrecio(usdMensual, 'ZZ')).toBe(usdMensual)
    expect(resolverPrecio(usdMensual, null)).toBe(usdMensual)
    expect(resolverPrecio(usdMensual, '')).toBe(usdMensual)
  })

  it('respeta la moneda con la que el taller ya trató con Stripe', () => {
    // Stripe no admite dos monedas en un mismo cliente. Ese rechazo dejó a
    // FASTCAR sin poder pagar tres semanas en julio de 2026.
    expect(resolverPrecio(mxnMensual, 'MX', usdMensual)).toBe(usdMensual)
    expect(resolverPrecio(usdMensual, 'MX', mxnMensual)).toBe(mxnMensual)
  })

  it('conserva la moneda al cambiar de plan o de ciclo', () => {
    expect(resolverPrecio(PRECIOS_USD.precios.pro_mensual, 'MX', mxnMensual))
      .toBe(PRECIOS_POR_PAIS.MX.precios.pro_mensual)
    expect(resolverPrecio(PRECIOS_POR_PAIS.MX.precios.esencial_anual, 'MX', usdMensual))
      .toBe(PRECIOS_USD.precios.esencial_anual)
  })

  it('si el precio anterior ya no está en ninguna tabla, decide el país', () => {
    expect(resolverPrecio(usdMensual, 'MX', 'price_de_hace_dos_generaciones')).toBe(mxnMensual)
  })

  it('rechaza un precio que no es nuestro', () => {
    expect(resolverPrecio('price_inventado', 'MX')).toBeNull()
  })
})

describe('PRECIOS_A_PLAN es un mapa histórico y no se le quita nada', () => {
  it('conoce todos los precios que la app puede mandar a Stripe', () => {
    // El fallo de julio de 2026: se cambiaron los precios de CAD a USD y se
    // sacaron los viejos de este mapa. La siguiente renovación de FASTCAR
    // —cobrada sin problema— llegó por webhook, no encontró su precio aquí, y
    // degradó al único cliente de pago a los topes del plan gratis.
    for (const priceId of todosLosPreciosVigentes()) {
      expect(PRECIOS_A_PLAN[priceId], `el price ID ${priceId} se ofrece pero el webhook no sabría a qué plan corresponde`).toBeDefined()
    }
  })

  it('sigue reconociendo los precios retirados de CAD', () => {
    // Suscripciones vivas contratadas antes del cambio de moneda.
    expect(PRECIOS_A_PLAN['price_1TVxQ1RFpmo4G9XHSD938Kyf']).toBe('esencial')
    expect(PRECIOS_A_PLAN['price_1TVxR3RFpmo4G9XHtmdwzFAf']).toBe('pro')
  })

  it('cada precio apunta al plan correcto', () => {
    for (const [, tabla] of TODAS) {
      expect(PRECIOS_A_PLAN[tabla.precios.esencial_mensual]).toBe('esencial')
      expect(PRECIOS_A_PLAN[tabla.precios.esencial_anual]).toBe('esencial')
      expect(PRECIOS_A_PLAN[tabla.precios.pro_mensual]).toBe('pro')
      expect(PRECIOS_A_PLAN[tabla.precios.pro_anual]).toBe('pro')
    }
  })
})

describe('lo que se pinta en la web sale de la misma tabla', () => {
  it('a un mexicano se le enseña el importe en pesos que se le va a cobrar', () => {
    const t = textosPlan('Esencial', 'MX', false)
    expect(t?.principal).toContain('449')
    expect(t?.principal).toContain('MXN')
    expect(t?.enDolares).toBe(false)
  })

  it('a un argentino se le enseña el importe en dólares, marcado como tal', () => {
    const t = textosPlan('Esencial', 'AR', false)
    expect(t?.principal).toBe('US$24')
    expect(t?.enDolares).toBe(true)
  })

  it('el plan gratuito no pasa por aquí', () => {
    expect(textosPlan('Gratuito', 'MX', false)).toBeNull()
  })

  it('el anual se enseña por mes y siempre más barato que el mensual', () => {
    for (const pais of ['MX', 'CO', 'PE', 'AR']) {
      const mensual = textosPlan('Esencial', pais, false)!
      const anual   = textosPlan('Esencial', pais, true)!
      const num = (s: string) => Number(s.replace(/[^\d]/g, ''))
      expect(num(anual.principal)).toBeLessThan(num(mensual.principal))
    }
  })

  it('el ahorro anual es la resta exacta, no un porcentaje inventado', () => {
    // Hasta el 04/09/2026 la web enseñaba un precio tachado que era el doble
    // del real: un "antes" que nunca se cobró. Ahora el único descuento que se
    // anuncia es este, y tiene que cuadrar con la tabla que cobra Stripe.
    const num = (s: string) => Number(s.replace(/[^\d]/g, ''))

    for (const [pais, plan, esperado] of [
      ['MX', 'Esencial', 449 * 12 - 3999],
      ['MX', 'Pro',      899 * 12 - 8199],
      ['AR', 'Esencial',  24 * 12 - 228],
      ['AR', 'Pro',       49 * 12 - 468],
    ] as const) {
      const t = textosPlan(plan, pais, true)!
      expect(num(t.ahorroAnual), `${plan} en ${pais}`).toBe(esperado)
    }
  })

  it('en todos los países pagar al año sale a cuenta', () => {
    // Si en algún país el anual saliera igual o más caro, la web estaría
    // prometiendo un ahorro que no existe.
    for (const pais of ['MX', 'CO', 'PE', 'AR']) {
      for (const plan of ['Esencial', 'Pro']) {
        const t = textosPlan(plan, pais, true)!
        const ahorro = Number(t.ahorroAnual.replace(/[^\d]/g, ''))
        expect(ahorro, `${plan} en ${pais}`).toBeGreaterThan(0)
      }
    }
  })

  it('el mensual suelto se enseña tal cual, sin dividir nada', () => {
    expect(textosPlan('Esencial', 'MX', true)!.mensualSolo).toContain('449')
    expect(textosPlan('Esencial', 'MX', false)!.mensualSolo).toContain('449')
  })
})

describe('formato', () => {
  it('los dólares no repiten la moneda, las demás sí', () => {
    expect(formatearPrecio(24, PRECIOS_USD)).toBe('US$24')
    expect(formatearPrecio(449, preciosDePais('MX'))).toContain('MXN')
  })
})
