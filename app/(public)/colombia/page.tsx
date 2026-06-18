export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import ColombiaClient from './colombia-client'

export const metadata: Metadata = {
  title: 'Software para talleres mecánicos en Colombia — TallerOS',
  description: 'Digitaliza tu taller mecánico en Colombia con aprobaciones por WhatsApp, portal del cliente en tiempo real y reseñas automáticas en Google. 14 días gratis, sin tarjeta.',
  alternates: { canonical: '/colombia' },
  openGraph: {
    type: 'website',
    url: 'https://www.tallerosapp.com/colombia',
    title: 'Software para talleres mecánicos en Colombia — TallerOS',
    description: 'Digitaliza tu taller mecánico en Colombia con aprobaciones por WhatsApp, portal del cliente en tiempo real y reseñas automáticas en Google.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Software para talleres mecánicos en Colombia — TallerOS',
    description: 'Digitaliza tu taller mecánico en Colombia con TallerOS. 14 días gratis.',
  },
}

export default function ColombiaPage() {
  return <ColombiaClient />
}
