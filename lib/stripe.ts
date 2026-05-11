import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2026-04-22.dahlia' as any,
})

export const PLANES = {
  esencial_mensual: 'price_1TVxQ1RFpmo4G9XHSD938Kyf',
  esencial_anual:   'price_1TVxQORFpmo4G9XHZjkw3iSc',
  pro_mensual:      'price_1TVxQgRFpmo4G9XHTVC0jRSB',
  pro_anual:        'price_1TVxR3RFpmo4G9XHtmdwzFAf',
}

export const PRECIOS_A_PLAN: Record<string, string> = {
  'price_1TVxQ1RFpmo4G9XHSD938Kyf': 'esencial',
  'price_1TVxQORFpmo4G9XHZjkw3iSc': 'esencial',
  'price_1TVxQgRFpmo4G9XHTVC0jRSB': 'pro',
  'price_1TVxR3RFpmo4G9XHtmdwzFAf': 'pro',
}