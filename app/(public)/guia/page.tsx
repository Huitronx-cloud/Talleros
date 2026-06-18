import type { Metadata } from 'next'
import GuiaClient from './guia-client'

export const metadata: Metadata = {
  title: '5 errores que le cuestan clientes a tu taller mecánico — Guía gratis | TallerOS',
  description: 'Descarga gratis la guía de los 5 errores más comunes que le cuestan clientes a los talleres mecánicos en LATAM, y cómo solucionarlos con tecnología.',
  alternates: { canonical: '/guia' },
  openGraph: {
    type: 'website',
    url: 'https://www.tallerosapp.com/guia',
    title: '5 errores que le cuestan clientes a tu taller mecánico',
    description: 'Guía gratuita: los 5 errores más comunes que le cuestan clientes a los talleres mecánicos en LATAM, y cómo solucionarlos con tecnología.',
  },
  twitter: {
    card: 'summary_large_image',
    title: '5 errores que le cuestan clientes a tu taller mecánico',
    description: 'Guía gratuita para dueños de talleres mecánicos en LATAM.',
  },
}

export default function GuiaPage() {
  return <GuiaClient />
}
