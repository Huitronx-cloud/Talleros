/** @type {import('next').NextConfig} */

const ALLOWED_ORIGINS = [
  'https://www.tallerosapp.com',
  'https://tallerosapp.com',
]

const securityHeaders = [
  // Evita que la app se cargue dentro de un iframe de otro sitio (clickjacking)
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  // Evita que el navegador adivine el tipo de contenido (MIME sniffing)
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Activa protección XSS en navegadores legacy
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  // Controla qué info se manda en el Referer header
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Solo HTTPS, por 1 año, incluye subdominios
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
  // Restringe acceso a features del navegador (cámara, micrófono, etc.)
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
  // Content Security Policy
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      // Scripts: solo nuestro dominio + inline necesario para Next.js + GA
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com",
      // Estilos: self + inline (Tailwind lo necesita)
      "style-src 'self' 'unsafe-inline'",
      // Imágenes: self + Supabase storage + Google Analytics
      "img-src 'self' blob: data: https://kbtszjpqtoqhrfnqjaxv.supabase.co https://d8j0ntlcm91z4.cloudfront.net https://www.googletagmanager.com https://www.google-analytics.com",
      // Fuentes: solo self
      "font-src 'self'",
      // Conexiones: self + Supabase + Twilio + Resend + Stripe + GA
      "connect-src 'self' https://kbtszjpqtoqhrfnqjaxv.supabase.co wss://kbtszjpqtoqhrfnqjaxv.supabase.co https://api.twilio.com https://api.resend.com https://api.stripe.com https://www.google-analytics.com https://www.googletagmanager.com",
      // Frames: Stripe necesita iframes para el formulario de pago
      "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
      // Workers: para el service worker de PWA
      "worker-src 'self' blob:",
    ].join('; '),
  },
]

const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'kbtszjpqtoqhrfnqjaxv.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  async headers() {
    return [
      {
        // Security headers para todas las rutas
        source: '/(.*)',
        headers: securityHeaders,
      },
      {
        // CORS para las API routes — solo acepta peticiones de tallerosapp.com
        source: '/api/(.*)',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: 'https://www.tallerosapp.com',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization, X-Requested-With',
          },
          {
            key: 'Access-Control-Max-Age',
            value: '86400', // 24 horas de preflight cache
          },
        ],
      },
    ]
  },
}

export default nextConfig

