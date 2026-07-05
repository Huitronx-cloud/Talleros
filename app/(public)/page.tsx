import type { Metadata } from 'next'
import HomeClient from './home-client'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  alternates: { canonical: '/' },
}

export default function HomePage() {
  return <HomeClient />
}
