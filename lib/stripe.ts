import Stripe from 'stripe'

export function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY as string, {
    apiVersion: '2026-04-22.dahlia' as any,
  })
}

export const PLANES = {
  esencial_mensual: 'price_1TyjpIRFpmo4G9XHLwyeCvth',
  esencial_anual:   'price_1TyjplRFpmo4G9XHYkBdR8hc',
  pro_mensual:      'price_1TyjqERFpmo4G9XHEjasGmnq',
  pro_anual:        'price_1TyjqfRFpmo4G9XHL9pi6s3y',
}

export const PRECIOS_A_PLAN: Record<string, string> = {
  'price_1TyjpIRFpmo4G9XHLwyeCvth': 'esencial',
  'price_1TyjplRFpmo4G9XHYkBdR8hc': 'esencial',
  'price_1TyjqERFpmo4G9XHEjasGmnq': 'pro',
  'price_1TyjqfRFpmo4G9XHL9pi6s3y': 'pro',
}