import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import CookieConsent from '@/components/cookie-consent'
import RegistrarSW from '@/components/registrar-sw'
import SplashScreen from '@/components/splash-screen'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'TallerOS — Gestión inteligente para talleres mecánicos',
  description: 'TallerOS digitaliza tu taller mecánico con aprobaciones por WhatsApp, portal del cliente en tiempo real, reseñas automáticas en Google y recordatorios de mantenimiento. 14 días gratis.',
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
        url: '/og-image.jpg',
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
    images: ['/og-image.jpg'],
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'TallerOS',
    // Imágenes de arranque iOS: sin ellas, la PWA muestra pantalla blanca
    // mientras el servidor responde. Con ellas, el logo aparece al instante
    // del tap (mismo diseño que el splash HTML para una transición continua).
    startupImage: [
      { url: '/splash/apple-splash-750x1334.png',  media: '(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)' },
      { url: '/splash/apple-splash-1242x2208.png', media: '(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)' },
      { url: '/splash/apple-splash-1125x2436.png', media: '(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)' },
      { url: '/splash/apple-splash-828x1792.png',  media: '(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)' },
      { url: '/splash/apple-splash-1242x2688.png', media: '(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)' },
      { url: '/splash/apple-splash-1170x2532.png', media: '(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)' },
      { url: '/splash/apple-splash-1284x2778.png', media: '(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)' },
      { url: '/splash/apple-splash-1179x2556.png', media: '(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)' },
      { url: '/splash/apple-splash-1290x2796.png', media: '(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)' },
      { url: '/splash/apple-splash-1206x2622.png', media: '(device-width: 402px) and (device-height: 874px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)' },
      { url: '/splash/apple-splash-1320x2868.png', media: '(device-width: 440px) and (device-height: 956px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)' },
      { url: '/splash/apple-splash-1536x2048.png', media: '(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)' },
      { url: '/splash/apple-splash-1668x2388.png', media: '(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)' },
      { url: '/splash/apple-splash-2048x2732.png', media: '(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)' },
    ],
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
  themeColor: '#2563eb',
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
  <meta name="mobile-web-app-capable" content="yes" />
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
        <CookieConsent />
        <RegistrarSW />
        <SplashScreen />
        {children}
      </body>
    </html>
  )
}