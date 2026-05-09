import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2026-04-22.dahlia' as any,
})

export const PLANES = {
  esencial_mensual: 'price_1TVAoRRFpmo4G9XHOUNFQDGJ',
  esencial_anual:   'price_1TVApHRFpmo4G9XHrbpflGrA',
  pro_mensual:      'price_1TVApeRFpmo4G9XHUD6EDGbQ',
  pro_anual:        'price_1TVAq3RFpmo4G9XHKh2QHkjK',
}

export const PRECIOS_A_PLAN: Record<string, string> = {
  'price_1TVAoRRFpmo4G9XHOUNFQDGJ': 'esencial',
  'price_1TVApHRFpmo4G9XHrbpflGrA': 'esencial',
  'price_1TVApeRFpmo4G9XHUD6EDGbQ': 'pro',
  'price_1TVAq3RFpmo4G9XHKh2QHkjK': 'pro',
}