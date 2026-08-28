import Stripe from 'stripe'

export function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY as string, {
    apiVersion: '2026-04-22.dahlia' as any,
  })
}

// Los precios en dólares, que son los que se le ofrecen a quien contrata HOY
// desde un país sin precio propio. Para saber qué precio le toca a cada país
// —incluido el que se le ENSEÑA— usar `preciosDePais()` de `lib/precios.ts`.
export const PLANES = {
  esencial_mensual: 'price_1TyjpIRFpmo4G9XHLwyeCvth',
  esencial_anual:   'price_1TyjplRFpmo4G9XHYkBdR8hc',
  pro_mensual:      'price_1TyjqERFpmo4G9XHEjasGmnq',
  pro_anual:        'price_1TyjqfRFpmo4G9XHL9pi6s3y',
}

// Este mapa NO es la lista de precios vigentes: es el traductor de "cualquier
// precio que Stripe nos pueda mandar" → plan. Por eso incluye los precios
// retirados y NUNCA se debe borrar una entrada de aquí.
//
// De dónde viene la regla: en julio se cambiaron los 4 precios de CAD a USD y
// se sacaron los viejos de este mapa. Las suscripciones que ya corrían sobre
// los precios viejos siguieron cobrando bien en Stripe, pero el siguiente
// webhook de `customer.subscription.updated` ya no encontraba su precio aquí y
// las degradaba al plan gratis. Un cliente que pagaba puntualmente se quedó con
// los topes del plan gratis y sin poder crear órdenes.
export const PRECIOS_A_PLAN: Record<string, string> = {
  // Vigentes (USD) — para todo país sin precio propio
  'price_1TyjpIRFpmo4G9XHLwyeCvth': 'esencial',
  'price_1TyjplRFpmo4G9XHYkBdR8hc': 'esencial',
  'price_1TyjqERFpmo4G9XHEjasGmnq': 'pro',
  'price_1TyjqfRFpmo4G9XHL9pi6s3y': 'pro',

  // Vigentes (MXN) — México cobra en pesos desde el 28/08/2026. El importe es
  // el mismo que ve en la web, sin conversión de por medio. Ver lib/precios.ts.
  'price_1U9SjlRFpmo4G9XHC7CiZXc7': 'esencial',
  'price_1U9SlhRFpmo4G9XHNAfuvTJW': 'esencial',
  'price_1U9SmqRFpmo4G9XHSCZngHCz': 'pro',
  'price_1U9SneRFpmo4G9XHnQBGl8OV': 'pro',

  // Vigentes (COP) — Colombia cobra en pesos colombianos desde el 28/08/2026.
  'price_1U9TrbRFpmo4G9XHcnQxrjWZ': 'esencial',
  'price_1U9Tt7RFpmo4G9XHZH3pPEjA': 'esencial',
  'price_1U9Tu4RFpmo4G9XHHRTK7hQb': 'pro',
  'price_1U9Tv0RFpmo4G9XHI0CYS9iW': 'pro',

  // Retirados en julio de 2026 (CAD). Siguen activos en Stripe para quien los
  // contrató antes del cambio.
  'price_1TVxQ1RFpmo4G9XHSD938Kyf': 'esencial',
  'price_1TVxQORFpmo4G9XHZjkw3iSc': 'esencial',
  'price_1TVxQgRFpmo4G9XHTVC0jRSB': 'pro',
  'price_1TVxR3RFpmo4G9XHtmdwzFAf': 'pro',

  // Generación anterior, todavía presente en filas de `suscripciones`.
  'price_1TVAoRRFpmo4G9XHOUNFQDGJ': 'esencial',
  'price_1TVAq3RFpmo4G9XHKh2QHkjK': 'esencial',
  'price_1TVApeRFpmo4G9XHUD6EDGbQ': 'pro',
}
