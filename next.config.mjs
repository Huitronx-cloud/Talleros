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
      // Scripts: solo nuestro dominio + inline necesario para Next.js + GA.
      // unsafe-eval solo en dev: HMR/react-refresh lo requieren; producción no.
      `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV !== 'production' ? " 'unsafe-eval'" : ''} https://www.googletagmanager.com https://www.google-analytics.com https://connect.facebook.net`,
      // Estilos: self + inline (Tailwind lo necesita)
      "style-src 'self' 'unsafe-inline'",
      // Imágenes: self + Supabase storage + Google Analytics
      "img-src 'self' blob: data: https://kbtszjpqtoqhrfnqjaxv.supabase.co https://d8j0ntlcm91z4.cloudfront.net https://www.googletagmanager.com https://www.google-analytics.com https://www.facebook.com",
      // Fuentes: solo self
      "font-src 'self'",
      // Conexiones: self + Supabase + Twilio + Resend + Stripe + GA
      "connect-src 'self' https://kbtszjpqtoqhrfnqjaxv.supabase.co wss://kbtszjpqtoqhrfnqjaxv.supabase.co https://api.twilio.com https://api.resend.com https://api.stripe.com https://www.google-analytics.com https://www.googletagmanager.com https://connect.facebook.net https://www.facebook.com",
      // Frames: Stripe necesita iframes para el formulario de pago
      "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
      // Workers: para el service worker de PWA
      "worker-src 'self' blob:",
    ].join('; '),
  },
]

const nextConfig = {
  poweredByHeader: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'kbtszjpqtoqhrfnqjaxv.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'd8j0ntlcm91z4.cloudfront.net',
        port: '',
        pathname: '/**',
      },
    ],
  },
  async redirects() {
    return [
      // Cluster: retención
      { source: '/blog/clientes-recurrentes-taller-mecanico', destination: '/blog/fidelizar-clientes-taller-mecanico', permanent: true },
      { source: '/blog/clientes-regresen-taller-mecanico', destination: '/blog/fidelizar-clientes-taller-mecanico', permanent: true },

      // Cluster: clientes difíciles
      { source: '/blog/manejar-cliente-enojado-taller', destination: '/blog/clientes-dificiles-taller-mecanico', permanent: true },
      { source: '/blog/evitar-conflictos-clientes-taller-mecanico', destination: '/blog/clientes-dificiles-taller-mecanico', permanent: true },

      // Cluster: reseñas Google
      { source: '/blog/cuantas-resenas-google-taller-mecanico', destination: '/blog/resenas-google-talleres-mecanicos-latam', permanent: true },
      { source: '/blog/conseguir-resenas-google-taller-mecanico', destination: '/blog/resenas-google-talleres-mecanicos-latam', permanent: true },
      { source: '/blog/talleres-sin-resenas-pierden-competencia', destination: '/blog/resenas-google-talleres-mecanicos-latam', permanent: true },

      // Cluster: WhatsApp
      { source: '/blog/mensajes-whatsapp-clientes-taller', destination: '/blog/whatsapp-ventas-taller-mecanico', permanent: true },

      // Cluster: conseguir/perder clientes
      { source: '/blog/talleres-mecanicos-pierden-clientes', destination: '/blog/taller-no-consigue-clientes-nuevos', permanent: true },
      { source: '/blog/taller-mecanico-conseguir-clientes-tecnologia', destination: '/blog/taller-no-consigue-clientes-nuevos', permanent: true },
    ]
  },

  async headers() {
    return [
      {
        // Security headers para todas las rutas
        source: '/(.*)',
        headers: securityHeaders,
      },
      {
        // Imágenes de /public: cache de 30 días. No immutable porque los
        // nombres no llevan hash — si se reemplaza una imagen con el mismo
        // nombre, expira en máximo 30 días.
        source: '/:all*(svg|jpg|jpeg|png|webp|avif|ico)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=2592000, stale-while-revalidate=86400' },
        ],
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
