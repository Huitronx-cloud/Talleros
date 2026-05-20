import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import GoogleAnalytics from '@/components/google-analytics'
import { JsonLd } from '@/components/json-ld'

const inter = Inter({ subsets: ['latin'] })

const TITLE       = 'TallerOS — Software para Talleres Mecánicos en LATAM'
const DESCRIPTION = 'TallerOS digitaliza tu taller mecánico con aprobaciones por WhatsApp, portal del cliente en tiempo real, reseñas automáticas en Google y recordatorios de mantenimiento. Usado en México, Colombia, Perú y toda LATAM. 14 días gratis, sin tarjeta.'
const URL         = 'https://www.tallerosapp.com'
const OG_IMAGE    = `${URL}/og-image.png`

export const metadata: Metadata = {
  title: {
    default: TITLE,
    template: '%s | TallerOS',
  },
  description: DESCRIPTION,
  keywords: [
    // Términos principales
    'software para talleres mecánicos',
    'sistema de gestión para taller automotriz',
    'app para talleres mecánicos',
    'programa para taller mecánico',
    // Por país
    'software para talleres mecánicos México',
    'software para talleres mecánicos Colombia',
    'software para talleres mecánicos Perú',
    'software para talleres mecánicos LATAM',
    // Funciones clave
    'aprobación por WhatsApp taller',
    'portal cliente taller en tiempo real',
    'reseñas automáticas Google taller',
    'recordatorios mantenimiento clientes',
    'órdenes de trabajo digitales',
    'cotizaciones taller mecánico',
    // Competencia de términos
    'alternativa Shopmonkey en español',
    'gestión taller automotriz digital',
    'digitalizar taller mecánico',
    'SaaS taller mecánico',
  ],
  authors: [{ name: 'TallerOS', url: URL }],
  creator: 'TallerOS',
  publisher: 'TallerOS',
  metadataBase: new URL(URL),
  alternates: {
    canonical: '/',
    languages: {
      'es-MX': '/mexico',
      'es-CO': '/colombia',
      'es-PE': '/peru',
    },
  },
  openGraph: {
    type: 'website',
    locale: 'es_MX',
    alternateLocale: ['es_CO', 'es_PE', 'es_ES'],
    url: URL,
    siteName: 'TallerOS',
    title: TITLE,
    description: DESCRIPTION,
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: TITLE }],
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
    images: [OG_IMAGE],
    creator: '@tallerosapp',
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'TallerOS',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: '', // Agrega tu Search Console verification ID aquí cuando lo tengas
  },
}
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <head>
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
  <link rel="manifest" href="/manifest.json" />
  <meta name="theme-color" content="#1d4ed8" />
  <meta name="mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="default" />
  <meta name="apple-mobile-web-app-title" content="TallerOS" />
  <link rel="apple-touch-icon" href="/icon-192.png" />
</head>
      <body className={`${inter.className} has-offer-bar`}>
        <GoogleAnalytics />
        <JsonLd data={{
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'SoftwareApplication',
              name: 'TallerOS',
              applicationCategory: 'BusinessApplication',
              operatingSystem: 'Web, iOS, Android',
              url: 'https://www.tallerosapp.com',
              logo: 'https://www.tallerosapp.com/icon-512.png',
              description: 'Software de gestión para talleres mecánicos. Aprobaciones por WhatsApp, portal del cliente en tiempo real, reseñas automáticas en Google y recordatorios de mantenimiento.',
              inLanguage: 'es',
              offers: [
                { '@type': 'Offer', name: 'Plan Esencial', price: '24', priceCurrency: 'USD', priceValidUntil: '2026-12-31', availability: 'https://schema.org/InStock', url: 'https://www.tallerosapp.com/registro' },
                { '@type': 'Offer', name: 'Plan Pro', price: '49', priceCurrency: 'USD', priceValidUntil: '2026-12-31', availability: 'https://schema.org/InStock', url: 'https://www.tallerosapp.com/registro' },
              ],
              aggregateRating: { '@type': 'AggregateRating', ratingValue: '4.9', reviewCount: '47', bestRating: '5', worstRating: '1' },
            },
            {
              '@type': 'Organization',
              name: 'TallerOS',
              url: 'https://www.tallerosapp.com',
              logo: 'https://www.tallerosapp.com/icon-512.png',
              contactPoint: { '@type': 'ContactPoint', contactType: 'customer support', availableLanguage: 'Spanish', email: 'hola@tallerosapp.com' },
            },
            {
              '@type': 'WebSite',
              url: 'https://www.tallerosapp.com',
              name: 'TallerOS',
              description: 'Software de gestión para talleres mecánicos en LATAM',
            },
          ],
        }} />
        {children}
      </body>
              '@context': 'https://schema.org',
              '@graph': [
                {
                  '@type': 'SoftwareApplication',
                  name: 'TallerOS',
                  applicationCategory: 'BusinessApplication',
                  operatingSystem: 'Web, iOS, Android',
                  url: 'https://www.tallerosapp.com',
                  logo: 'https://www.tallerosapp.com/icon-512.png',
                  description: 'Software de gestión para talleres mecánicos. Aprobaciones por WhatsApp, portal del cliente en tiempo real, reseñas automáticas en Google y recordatorios de mantenimiento.',
                  inLanguage: 'es',
                  offers: [
                    {
                      '@type': 'Offer',
                      name: 'Plan Esencial',
                      price: '24',
                      priceCurrency: 'USD',
                      priceValidUntil: '2026-12-31',
                      availability: 'https://schema.org/InStock',
                      url: 'https://www.tallerosapp.com/registro',
                    },
                    {
                      '@type': 'Offer',
                      name: 'Plan Pro',
                      price: '49',
                      priceCurrency: 'USD',
                      priceValidUntil: '2026-12-31',
                      availability: 'https://schema.org/InStock',
                      url: 'https://www.tallerosapp.com/registro',
                    },
                  ],
                  aggregateRating: {
                    '@type': 'AggregateRating',
                    ratingValue: '4.9',
                    reviewCount: '47',
                    bestRating: '5',
                    worstRating: '1',
                  },
                  review: [
                    {
                      '@type': 'Review',
                      author: { '@type': 'Person', name: 'Roberto Garza' },
                      reviewRating: { '@type': 'Rating', ratingValue: '5' },
                      reviewBody: 'Desde que usamos TallerOS los clientes ya no llaman a preguntar cómo va su carro. El portal en tiempo real nos ahorró horas de atención telefónica.',
                    },
                    {
                      '@type': 'Review',
                      author: { '@type': 'Person', name: 'Camila Restrepo' },
                      reviewRating: { '@type': 'Rating', ratingValue: '5' },
                      reviewBody: 'Las aprobaciones por WhatsApp cambiaron todo. Antes perdíamos trabajos porque el cliente no contestaba. Ahora aprueba en segundos.',
                    },
                  ],
                  featureList: [
                    'Aprobación de reparaciones por WhatsApp',
                    'Portal del cliente en tiempo real',
                    'Fotos del diagnóstico',
                    'Garantía digital',
                    'Recordatorios automáticos de mantenimiento',
                    'Reseñas automáticas en Google',
                    'Cotizaciones profesionales',
                    'Control de inventario',
                    'Reportes avanzados',
                    'Agenda de citas',
                  ],
                },
                {
                  '@type': 'Organization',
                  name: 'TallerOS',
                  url: 'https://www.tallerosapp.com',
                  logo: 'https://www.tallerosapp.com/icon-512.png',
                  contactPoint: {
                    '@type': 'ContactPoint',
                    contactType: 'customer support',
                    availableLanguage: 'Spanish',
                    email: 'hola@tallerosapp.com',
                  },
                  sameAs: [
                    'https://www.instagram.com/tallerosapp',
                    'https://www.facebook.com/tallerosapp',
                  ],
                },
                {
                  '@type': 'WebSite',
                  url: 'https://www.tallerosapp.com',
                  name: 'TallerOS',
                  description: 'Software de gestión para talleres mecánicos en LATAM',
                  potentialAction: {
                    '@type': 'SearchAction',
                    target: 'https://www.tallerosapp.com/registro',
                    'query-input': 'required name=search_term_string',
                  },
                },
              ],
            }),
          }}
        />
        {children}
      </body>
    </html>
  )
}