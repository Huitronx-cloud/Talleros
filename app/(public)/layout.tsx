import WhatsappFlotante from '@/components/whatsapp-flotante'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <WhatsappFlotante />
    </>
  )
}
