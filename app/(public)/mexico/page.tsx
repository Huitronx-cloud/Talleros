export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import MexicoClient from './mexico-client'

export const metadata: Metadata = {
  title: 'Software para talleres mecánicos en México — TallerOS',
  description: 'Digitaliza tu taller mecánico en México con aprobaciones por WhatsApp, portal del cliente en tiempo real y reseñas automáticas en Google. 14 días gratis, sin tarjeta.',
  alternates: { canonical: '/mexico' },
  openGraph: {
    type: 'website',
    url: 'https://www.tallerosapp.com/mexico',
    title: 'Software para talleres mecánicos en México — TallerOS',
    description: 'Digitaliza tu taller mecánico en México con aprobaciones por WhatsApp, portal del cliente en tiempo real y reseñas automáticas en Google.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Software para talleres mecánicos en México — TallerOS',
    description: 'Digitaliza tu taller mecánico en México con TallerOS. 14 días gratis.',
  },
}

export default function MexicoPage() {
  return <MexicoClient />
}
