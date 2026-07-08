import type { Metadata } from 'next'
import HomeClient from './home-client'

export const dynamic = 'force-dynamic'

const HREFLANG = {
  'es':    'https://www.tallerosapp.com/',
  'es-MX': 'https://www.tallerosapp.com/mexico',
  'es-CO': 'https://www.tallerosapp.com/colombia',
  'es-PE': 'https://www.tallerosapp.com/peru',
  'x-default': 'https://www.tallerosapp.com/',
}

export const metadata: Metadata = {
  alternates: {
    canonical: '/',
    languages: HREFLANG,
  },
}

// Datos estructurados para rich results en Google (Organization + producto
// con rango de precios de los planes).
const JSON_LD = [
  {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'TallerOS',
    url: 'https://www.tallerosapp.com',
    logo: 'https://www.tallerosapp.com/icon-512.png',
    email: 'hola@tallerosapp.com',
    description: 'Software de gestión para talleres mecánicos en Latinoamérica: aprobaciones por WhatsApp, portal del cliente en tiempo real, reseñas automáticas y recordatorios de mantenimiento.',
    areaServed: ['MX', 'CO', 'PE', 'AR', 'CL', 'EC'],
  },
  {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'TallerOS',
    url: 'https://www.tallerosapp.com',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    inLanguage: 'es',
    description: 'Digitaliza tu taller mecánico: órdenes de trabajo, aprobaciones por WhatsApp, portal del cliente en tiempo real, garantía digital y reseñas automáticas en Google.',
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'USD',
      lowPrice: '0',
      highPrice: '49',
      offerCount: 3,
    },
  },
]

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
      />
      <HomeClient />
    </>
  )
}
