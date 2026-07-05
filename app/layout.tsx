import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import GoogleAnalytics from '@/components/google-analytics'
import MetaPixel from '@/components/meta-pixel'
import SplashScreen from '@/components/splash-screen'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'TallerOS — Gestión inteligente para talleres mecánicos',
  description: 'TallerOS digitaliza tu taller mecánico con aprobaciones por WhatsApp, portal del cliente en tiempo real, reseñas automáticas en Google y recordatorios de mantenimiento. 14 días gratis.',
  keywords: ['taller mecánico', 'software taller', 'gestión taller', 'SaaS taller', 'taller LATAM', 'órdenes de trabajo', 'WhatsApp taller', 'portal cliente taller'],
  authors: [{ name: 'TallerOS' }],
  
  creator: 'TallerOS',
  publisher: 'TallerOS',
  metadataBase: new URL('https://www.tallerosapp.com'),
  verification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION }
    : undefined,
  openGraph: {
    type: 'website',
    locale: 'es_MX',
    url: 'https://www.tallerosapp.com',
    siteName: 'TallerOS',
    title: 'TallerOS — Gestión inteligente para talleres mecánicos',
    description: 'Digitaliza tu taller con aprobaciones por WhatsApp, portal del cliente en tiempo real y reseñas automáticas en Google. 14 días gratis, sin tarjeta.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'TallerOS — Gestión inteligente para talleres mecánicos',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TallerOS — Gestión inteligente para talleres mecánicos',
    description: 'Digitaliza tu taller con aprobaciones por WhatsApp, portal del cliente en tiempo real y reseñas automáticas en Google. 14 días gratis.',
    images: ['/og-image.png'],
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
        <script dangerouslySetInnerHTML={{ __html: `
          window.addEventListener('load', function() {
            setTimeout(function() {
              var s = document.getElementById('splash-screen');
              if (s) s.classList.add('hidden');
            }, 800);
          });
        `}} />
        <meta name="facebook-domain-verification" content="qrpg7ptwpcrr7anrjz6zr8foz38az" />
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
        <div id="splash-screen">
          <div id="splash-logo">
            <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="40" height="40" rx="10" fill="#2563eb"/>
              <path d="M12 20h6l2-6 4 12 2-6h6" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <p id="splash-text">Actualizando tu taller...</p>
        </div>
        <GoogleAnalytics />
        <MetaPixel />
        <SplashScreen />
        {children}
      </body>
    </html>
  )
}