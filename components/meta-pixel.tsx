import Script from 'next/script'

const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID

export default function MetaPixel() {
  if (!META_PIXEL_ID) return null

  return (
    <>
      <Script id="meta-pixel" strategy="afterInteractive">
        {`
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${META_PIXEL_ID}');
          fbq('track', 'PageView');
        `}
      </Script>
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: 'none' }}
          src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  )
}

// Funciones helper para trackear eventos importantes
export function trackEvent(eventName: string, params?: Record<string, any>) {
  if (typeof window !== 'undefined' && (window as any).fbq) {
    (window as any).fbq('track', eventName, params)
  }
}

// Eventos clave para TallerOS
export const MetaEvents = {
  // Cuando alguien ve la landing
  viewContent: () => trackEvent('ViewContent', {
    content_name: 'Landing TallerOS',
    content_category: 'Software',
  }),

  // Cuando alguien llena el formulario de la guía
  lead: (email?: string) => trackEvent('Lead', {
    content_name: 'Guía 5 errores',
    content_category: 'Lead Magnet',
  }),

  // Cuando alguien hace click en "Prueba gratis"
  initiateCheckout: () => trackEvent('InitiateCheckout', {
    content_name: 'TallerOS Plan',
    currency: 'USD',
  }),

  // Cuando alguien se registra
  completeRegistration: () => trackEvent('CompleteRegistration', {
    content_name: 'Registro TallerOS',
  }),

  // Cuando alguien se suscribe a un plan (compra)
  purchase: (value: number, plan: string) => trackEvent('Purchase', {
    value,
    currency: 'USD',
    content_name: plan,
    content_type: 'product',
  }),
}
