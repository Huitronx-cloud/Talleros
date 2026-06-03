import dynamic from 'next/dynamic'

const SoporteWidget = dynamic(() => import('@/components/soporte-widget'), { ssr: false })

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <SoporteWidget />
    </>
  )
}
