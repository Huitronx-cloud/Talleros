import dynamic from 'next/dynamic'

const WhatsappFlotante = dynamic(() => import('@/components/whatsapp-flotante'), { ssr: false })

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <WhatsappFlotante />
    </>
  )
}
