import type { Metadata } from 'next'
import RegistroClient from './registro-client'

export const metadata: Metadata = {
  title: 'Crea tu cuenta gratis — TallerOS',
  description: 'Regístrate gratis en TallerOS y digitaliza tu taller mecánico en minutos. 14 días de prueba, sin tarjeta de crédito.',
  alternates: { canonical: '/registro' },
  openGraph: {
    type: 'website',
    url: 'https://www.tallerosapp.com/registro',
    title: 'Crea tu cuenta gratis — TallerOS',
    description: 'Regístrate gratis en TallerOS y digitaliza tu taller mecánico en minutos. 14 días de prueba, sin tarjeta de crédito.',
  },
}

export default function RegistroPage() {
  return <RegistroClient />
}
