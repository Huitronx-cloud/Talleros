export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import PeruClient from './peru-client'

export const metadata: Metadata = {
  title: 'Software para talleres mecánicos en Perú — TallerOS',
  description: 'Digitaliza tu taller mecánico en Perú con aprobaciones por WhatsApp, portal del cliente en tiempo real y reseñas automáticas en Google. 14 días gratis, sin tarjeta.',
  alternates: {
    canonical: '/peru',
    languages: {
      'es':    'https://www.tallerosapp.com/',
      'es-MX': 'https://www.tallerosapp.com/mexico',
      'es-CO': 'https://www.tallerosapp.com/colombia',
      'es-PE': 'https://www.tallerosapp.com/peru',
      'x-default': 'https://www.tallerosapp.com/',
    },
  },
  openGraph: {
    type: 'website',
    url: 'https://www.tallerosapp.com/peru',
    title: 'Software para talleres mecánicos en Perú — TallerOS',
    description: 'Digitaliza tu taller mecánico en Perú con aprobaciones por WhatsApp, portal del cliente en tiempo real y reseñas automáticas en Google.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Software para talleres mecánicos en Perú — TallerOS',
    description: 'Digitaliza tu taller mecánico en Perú con TallerOS. 14 días gratis.',
  },
}

export default function PeruPage() {
  return <PeruClient />
}
