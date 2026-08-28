/**
 * Qué precio se le ENSEÑA a cada país y qué precio se le COBRA.
 *
 * Los dos salen de aquí, y ese es todo el punto de este archivo.
 *
 * ── El problema que resuelve ────────────────────────────────────────────────
 * Antes eran dos cosas separadas y no cuadraban:
 *   · La web calculaba el precio local multiplicando los dólares por una tasa
 *     escrita a mano en `hooks/useMonedaLocal.ts`.
 *   · Stripe cobraba en dólares, siempre.
 *
 * A un argentino le enseñábamos $27.600 ARS (24 × 1150) y le cobrábamos 24
 * dólares, que al cambio real de agosto de 2026 son $36.285 ARS: un **31% más**
 * de lo anunciado. La tasa de 1150 llevaba meses sin tocarse.
 *
 * Y no era solo Argentina: cobrando en una moneda distinta a la de la tarjeta,
 * el banco del cliente añade su comisión por divisa (2-3%), así que el importe
 * del estado de cuenta nunca era el de la web.
 *
 * ── Cómo funciona ahora ─────────────────────────────────────────────────────
 * Cada país tiene una entrada con la moneda en la que se le COBRA y los importes
 * exactos de esa moneda. La pantalla lee de aquí; el checkout lee de aquí. No
 * hay dos números que puedan separarse, hay uno.
 *
 *   México          → MXN → se muestra $449 MXN y se cobra $449 MXN
 *   Resto de países → USD → se muestra US$24 y se cobra US$24
 *
 * Para los países que aún no tienen precio propio, el número grande es el de
 * dólares —el que de verdad se va a cobrar— y debajo va una conversión
 * aproximada, en pequeño y etiquetada como referencia. Esa conversión puede
 * quedarse algo desfasada sin hacer daño, porque no es el precio.
 *
 * ── Para añadir un país nuevo ───────────────────────────────────────────────
 * 1. Crear los 4 precios en Stripe en esa moneda (mensual y anual, Esencial y
 *    Pro), como recurrentes.
 * 2. Añadir su entrada aquí con los importes y los price IDs.
 * 3. Añadir esos price IDs a `PRECIOS_A_PLAN` en `lib/stripe.ts`.
 * Nada más. La web se actualiza sola porque lee de esta tabla.
 *
 * Argentina se queda a propósito en dólares: con su inflación, un precio fijo
 * en pesos argentinos se queda viejo en semanas y el que pierde es el negocio,
 * no el cliente. Además allí el software se cobra en dólares por costumbre.
 */

/**
 * Cuando se revisaron por ultima vez los tipos de cambio de
 * `hooks/useMonedaLocal.ts`.
 *
 * Vive aqui y no en el hook porque `/admin` es un Server Component y no puede
 * importar un archivo que usa `useState`. Y vive en algun sitio, en vez de en
 * la cabeza de nadie, porque el panel avisa cuando pasa de 30 dias: esas tasas
 * llevaban meses sin tocarse y la argentina se habia desviado un 31%.
 */
export const TASAS_ACTUALIZADAS = '2026-08-28'

export type Ciclo = 'mensual' | 'anual'
export type Plan  = 'esencial' | 'pro'

export interface PreciosPais {
  moneda:  string
  simbolo: string
  /** Importes en la unidad de la moneda (no en centavos). Es lo que se muestra. */
  importes: Record<`${Plan}_${Ciclo}`, number>
  /** Los price IDs de Stripe que cobran exactamente esos importes. */
  precios:  Record<`${Plan}_${Ciclo}`, string>
}

/**
 * El precio por defecto, para todo país sin entrada propia.
 * Es el mismo que se venía cobrando: dólares.
 */
export const PRECIOS_USD: PreciosPais = {
  moneda:  'USD',
  simbolo: 'US$',
  importes: {
    esencial_mensual: 24,
    esencial_anual:   228,  // 19/mes facturados de una vez
    pro_mensual:      49,
    pro_anual:        468,  // 39/mes facturados de una vez
  },
  precios: {
    esencial_mensual: 'price_1TyjpIRFpmo4G9XHLwyeCvth',
    esencial_anual:   'price_1TyjplRFpmo4G9XHYkBdR8hc',
    pro_mensual:      'price_1TyjqERFpmo4G9XHEjasGmnq',
    pro_anual:        'price_1TyjqfRFpmo4G9XHL9pi6s3y',
  },
}

/**
 * Países con precio propio. El importe NO es la conversión exacta: está
 * redondeado hacia arriba a un número vendible, y ese margen cubre la comisión
 * de cambio que Stripe cobra al liquidar en la moneda de la cuenta (~2%) más un
 * colchón para que un movimiento del peso no obligue a retocar precios.
 *
 * Comprobación con el tipo de cambio del 28/08/2026 (16.97 MXN/USD), ya
 * descontado el ~2% que Stripe cobra al convertir:
 *
 *   Esencial mensual  $449   → US$25.93 netos sobre US$24    (+8.0%)
 *   Esencial anual  $3.999   → US$230.94 netos sobre US$228  (+1.3%)
 *   Pro mensual       $899   → US$51.92 netos sobre US$49    (+6.0%)
 *   Pro anual       $8.199   → US$473.48 netos sobre US$468  (+1.2%)
 *
 * DECISIÓN DEL DUEÑO (28/08/2026): los dos anuales se quedan así, con el
 * colchón justo. Se le propuso subirlos a $4.399 y $8.999 para alinearlos con
 * el 6-10% de los demás y dijo que no. No están rotos —netean por encima del
 * objetivo— pero un movimiento del peso del 2% se lleva ese margen. Si en una
 * revisión futura estos números parecen un descuido, no lo son: no tocarlos
 * sin preguntarle.
 */
export const PRECIOS_POR_PAIS: Record<string, PreciosPais> = {
  MX: {
    moneda:  'MXN',
    simbolo: '$',
    importes: {
      esencial_mensual: 449,
      esencial_anual:   3999,
      pro_mensual:      899,
      pro_anual:        8199,
    },
    precios: {
      esencial_mensual: 'price_1U9SjlRFpmo4G9XHC7CiZXc7',
      esencial_anual:   'price_1U9SlhRFpmo4G9XHNAfuvTJW',
      pro_mensual:      'price_1U9SmqRFpmo4G9XHSCZngHCz',
      pro_anual:        'price_1U9SneRFpmo4G9XHnQBGl8OV',
    },
  },
}

/** Normaliza 'México', 'mexico', 'MX' → 'MX'. */
function codigoPais(pais?: string | null): string {
  if (!pais) return ''
  const limpio = pais.trim()
  if (limpio.length === 2) return limpio.toUpperCase()
  const sinAcentos = limpio.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  if (sinAcentos === 'mexico') return 'MX'
  return limpio.toUpperCase()
}

/**
 * Los precios que le tocan a un país. Si no tiene entrada propia, dólares.
 *
 * Nunca devuelve null: un país desconocido cae en USD, que es lo que se cobraba
 * antes de todo esto. Peor sería no poder enseñar precio.
 */
export function preciosDePais(pais?: string | null): PreciosPais {
  return PRECIOS_POR_PAIS[codigoPais(pais)] ?? PRECIOS_USD
}

/** true si a este país se le cobra en su propia moneda y no en dólares. */
export function tienePrecioLocal(pais?: string | null): boolean {
  return codigoPais(pais) in PRECIOS_POR_PAIS
}

/** Formatea un importe para enseñarlo: "$449 MXN", "US$24". */
export function formatearPrecio(importe: number, p: PreciosPais): string {
  const n = importe.toLocaleString('es-MX')
  return p.moneda === 'USD' ? `${p.simbolo}${n}` : `${p.simbolo}${n} ${p.moneda}`
}

/**
 * Los tres textos que necesita pintar una tarjeta de plan en la web.
 *
 * Existe para que las cuatro landings (home, méxico, colombia, perú) y la
 * pantalla de plan no repitan el cálculo cada una por su cuenta: son archivos
 * separados que comparten el mismo juego de clases, y un cambio de precio
 * hecho en tres de cuatro es exactamente cómo se acaba enseñando un número
 * distinto según por dónde entre la gente.
 *
 * `nombrePlan` es el que trae `lib/planes-web.ts` ('Esencial', 'Pro'); el plan
 * gratuito no pasa por aquí porque no tiene precio que cobrar.
 */
export function textosPlan(
  nombrePlan: string,
  pais: string | null | undefined,
  anual: boolean,
): { principal: string; tachado: string; anualTotal: string; enDolares: boolean } | null {
  const clave = nombrePlan.toLowerCase() === 'pro' ? 'pro'
              : nombrePlan.toLowerCase() === 'esencial' ? 'esencial'
              : null
  if (!clave) return null

  const p = preciosDePais(pais)
  const totalAnual = p.importes[`${clave}_anual`]
  // En anual el cargo es uno al año, pero en pantalla se enseña por mes porque
  // así es como la gente compara.
  const porMes = anual ? Math.round(totalAnual / 12) : p.importes[`${clave}_mensual`]

  return {
    principal:  formatearPrecio(porMes, p),
    tachado:    formatearPrecio(porMes * 2, p),
    anualTotal: formatearPrecio(totalAnual, p),
    enDolares:  p.moneda === 'USD',
  }
}

/** Todas las tablas, la de dólares incluida. */
function todasLasTablas(): PreciosPais[] {
  return [PRECIOS_USD, ...Object.values(PRECIOS_POR_PAIS)]
}

/** De un price ID a qué plan y ciclo es. null si no es de esta tabla. */
function claveDePrecio(precioId: string): `${Plan}_${Ciclo}` | null {
  for (const tabla of todasLasTablas()) {
    for (const [clave, id] of Object.entries(tabla.precios)) {
      if (id === precioId) return clave as `${Plan}_${Ciclo}`
    }
  }
  return null
}

/** La tabla a la que pertenece un price ID. null si no es de ninguna. */
function tablaDePrecio(precioId: string): PreciosPais | null {
  return todasLasTablas().find(t => Object.values(t.precios).includes(precioId)) ?? null
}

/**
 * Decide el price ID definitivo que se le manda a Stripe.
 *
 * Lo decide el SERVIDOR, no el navegador. El cliente manda el precio que vio en
 * pantalla, pero aquí se traduce al que de verdad le toca — así nadie puede
 * elegirse una moneda mandando otro id, y sobre todo así no se puede dar el
 * caso de enseñar un importe y cobrar otro.
 *
 * `precioAnterior` es `suscripciones.precio_id`, el último precio con el que
 * este taller trató con Stripe. Si existe, **manda su moneda**: Stripe no
 * permite que un mismo cliente tenga suscripciones en dos monedas distintas, y
 * ese es exactamente el error que dejó a FASTCAR sin poder pagar durante tres
 * semanas en julio ("You cannot combine currencies on a single customer").
 * Un taller mexicano que ya pagó en dólares se queda en dólares, y no pasa
 * nada: sigue pagando lo mismo que pagaba.
 *
 * Devuelve null si el precio pedido no es de ninguna tabla — quien llama debe
 * rechazar la petición, no inventarse uno.
 */
export function resolverPrecio(
  precioSolicitado: string,
  pais?: string | null,
  precioAnterior?: string | null,
): string | null {
  const clave = claveDePrecio(precioSolicitado)
  if (!clave) return null

  if (precioAnterior) {
    const tablaVieja = tablaDePrecio(precioAnterior)
    if (tablaVieja) return tablaVieja.precios[clave]
  }

  return preciosDePais(pais).precios[clave]
}

/**
 * Todos los price IDs que esta tabla puede llegar a mandarle a Stripe.
 * `api/stripe/checkout` valida contra esta lista, así que se genera de la
 * tabla en vez de escribirse a mano: añadir un país no puede olvidarse de
 * actualizar la validación.
 */
export function todosLosPreciosVigentes(): string[] {
  const tablas = [PRECIOS_USD, ...Object.values(PRECIOS_POR_PAIS)]
  return tablas.flatMap(t => Object.values(t.precios))
}
