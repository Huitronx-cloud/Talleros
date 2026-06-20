import dynamic from 'next/dynamic'

const SoporteWidget    = dynamic(() => import('@/components/soporte-widget'), { ssr: false })
const WhatsappFlotante = dynamic(() => import('@/components/whatsapp-flotante'), { ssr: false })

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <WhatsappFlotante />
      <SoporteWidget />
    </>
  )
}
