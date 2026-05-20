import { Metadata } from 'next'
import Link from 'next/link'
import { Check, ArrowRight, MessageCircle, Star, Monitor, Bell, Shield, Camera } from 'lucide-react'


// Schema.org structured data for Colombia
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'TallerOS',
  applicationCategory: 'BusinessApplication',
  description: 'Software para talleres mecánicos en Colombia con aprobaciones por WhatsApp, portal del cliente en tiempo real y reseñas automáticas en Google.',
  url: 'https://www.tallerosapp.com/colombia',
  inLanguage: 'es-CO',
  offers: { '@type': 'Offer', price: '24', priceCurrency: 'USD', availability: 'https://schema.org/InStock' },
  areaServed: { '@type': 'Country', name: 'Colombia' },
}
export const metadata: Metadata = {
  title: 'Software para Talleres Mecánicos en Colombia — TallerOS',
  description: 'TallerOS es el software #1 para talleres mecánicos en Colombia. Aprobaciones por WhatsApp, portal del cliente, reseñas automáticas en Google y recordatorios de mantenimiento. Precios en COP. 14 días gratis.',
  keywords: [
    'software para talleres mecánicos Colombia',
    'programa para taller mecánico Colombia',
    'sistema gestión taller automotriz Colombia',
    'app taller mecánico Colombia',
    'software taller Bogotá',
    'software taller Medellín',
    'software taller Cali',
    'gestión órdenes trabajo mecánico Colombia',
  ],
  alternates: { canonical: '/colombia' },
  openGraph: {
    title: 'Software para Talleres Mecánicos en Colombia — TallerOS',
    description: 'El software que usan los mejores talleres mecánicos en Colombia. Aprobaciones por WhatsApp, portal del cliente y reseñas automáticas en Google. 14 días gratis.',
    url: 'https://www.tallerosapp.com/colombia',
    locale: 'es_CO',
  },
}

const FEATURES = [
  { icon: MessageCircle, titulo: 'Aprobación por WhatsApp',   desc: 'Tu cliente aprueba reparaciones desde su celular. Todo queda registrado con fecha y hora.' },
  { icon: Camera,        titulo: 'Fotos del diagnóstico',     desc: 'Documenta el estado del vehículo antes de tocarlo. Elimina disputas sobre daños preexistentes.' },
  { icon: Monitor,       titulo: 'Portal en tiempo real',     desc: 'Tu cliente ve el avance de su vehículo en vivo. Sin llamadas al taller.' },
  { icon: Shield,        titulo: 'Garantía digital',          desc: 'Garantías digitales firmadas en cada entrega. Diferénciate de cualquier competidor en Colombia.' },
  { icon: Bell,          titulo: 'Recordatorios automáticos', desc: 'TallerOS contacta a tus clientes cada 3-6 meses. Ingresos recurrentes sin esfuerzo.' },
  { icon: Star,          titulo: 'Reseñas en Google',         desc: 'Solicita reseñas automáticamente al entregar. El 97% de colombianos las lee antes de elegir taller.' },
]

export default function ColombiaPage() {
  return (
    <div style={{fontFamily:'system-ui,sans-serif',color:'#0f172a',background:'#fff'}}>
      <nav style={{borderBottom:'1px solid #e2e8f0',padding:'0 24px',height:64,display:'flex',alignItems:'center',justifyContent:'space-between',position:'sticky',top:0,background:'#fff',zIndex:50}}>
        <Link href="/" style={{display:'flex',alignItems:'center',gap:8,textDecoration:'none'}}>
          <img src="/icon-512.png" alt="TallerOS" style={{width:32,height:32,borderRadius:8}} />
          <span style={{fontSize:18,fontWeight:900,color:'#0f172a'}}>Taller<span style={{color:'#2563eb'}}>OS</span></span>
        </Link>
        <Link href="/registro" style={{background:'#2563eb',color:'#fff',padding:'9px 18px',borderRadius:10,textDecoration:'none',fontSize:14,fontWeight:700}}>
          Prueba gratis 14 días
        </Link>
      </nav>

      <section style={{background:'linear-gradient(135deg,#1e3a5f 0%,#1d4ed8 100%)',padding:'80px 24px',textAlign:'center'}}>
        <div style={{maxWidth:720,margin:'0 auto'}}>
          <div style={{display:'inline-flex',alignItems:'center',gap:8,background:'rgba(255,255,255,0.15)',border:'1px solid rgba(255,255,255,0.3)',borderRadius:999,padding:'6px 16px',marginBottom:24,fontSize:12,fontWeight:700,color:'#bfdbfe',letterSpacing:1}}>
            🇨🇴 HECHO PARA COLOMBIA
          </div>
          <h1 style={{fontSize:'clamp(28px,5vw,52px)',fontWeight:900,color:'#fff',lineHeight:1.05,letterSpacing:-1.5,marginBottom:20}}>
            El software que los mejores<br/>talleres mecánicos de Colombia<br/>ya están usando
          </h1>
          <p style={{fontSize:18,color:'#bfdbfe',lineHeight:1.7,marginBottom:32,maxWidth:560,margin:'0 auto 32px'}}>
            Digitaliza tu taller con aprobaciones por WhatsApp, portal del cliente en tiempo real y reseñas automáticas en Google. Desde Bogotá hasta Medellín y Cali.
          </p>
          <Link href="/registro" style={{display:'inline-flex',alignItems:'center',gap:8,background:'#fff',color:'#1d4ed8',padding:'13px 28px',borderRadius:12,textDecoration:'none',fontSize:16,fontWeight:800,boxShadow:'0 8px 32px rgba(0,0,0,0.2)'}}>
            Empezar gratis — sin tarjeta <ArrowRight size={16}/>
          </Link>
          <div style={{display:'flex',justifyContent:'center',gap:24,marginTop:20,flexWrap:'wrap'}}>
            {['Sin tarjeta de crédito','14 días gratis','Soporte en español'].map(t => (
              <div key={t} style={{display:'flex',alignItems:'center',gap:6,fontSize:13,color:'#93c5fd',fontWeight:500}}>
                <Check size={12} strokeWidth={3} style={{color:'#4ade80'}} />{t}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{padding:'80px 24px'}}>
        <div style={{maxWidth:1100,margin:'0 auto'}}>
          <div style={{textAlign:'center',marginBottom:56}}>
            <div style={{fontSize:11,fontWeight:800,color:'#2563eb',letterSpacing:2.5,textTransform:'uppercase',marginBottom:12}}>Por qué nos eligen en Colombia</div>
            <h2 style={{fontSize:'clamp(24px,4vw,42px)',fontWeight:900,letterSpacing:-1.5,color:'#0f172a',marginBottom:12}}>6 herramientas que transforman<br/>tu taller en 30 días</h2>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))',gap:20}}>
            {FEATURES.map((f,i) => (
              <div key={i} style={{background:'#f8fafc',border:'1px solid #e2e8f0',borderRadius:16,padding:28}}>
                <div style={{width:48,height:48,borderRadius:12,background:'rgba(37,99,235,0.1)',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:16}}>
                  <f.icon size={22} style={{color:'#2563eb'}} />
                </div>
                <h3 style={{fontSize:17,fontWeight:800,color:'#0f172a',marginBottom:8}}>{f.titulo}</h3>
                <p style={{fontSize:14,color:'#64748b',lineHeight:1.7}}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{background:'#1d4ed8',padding:'72px 24px',textAlign:'center'}}>
        <div style={{maxWidth:600,margin:'0 auto'}}>
          <h2 style={{fontSize:'clamp(26px,4vw,44px)',fontWeight:900,color:'#fff',letterSpacing:-1.5,marginBottom:16}}>Tu taller en Colombia merece crecer.</h2>
          <p style={{fontSize:17,color:'#bfdbfe',lineHeight:1.7,marginBottom:32}}>14 días gratis, sin tarjeta de crédito. Cancela cuando quieras.</p>
          <Link href="/registro" style={{display:'inline-flex',alignItems:'center',gap:8,background:'#fff',color:'#1d4ed8',padding:'14px 32px',borderRadius:12,textDecoration:'none',fontSize:16,fontWeight:800}}>
            Crear mi taller gratis <ArrowRight size={16}/>
          </Link>
        </div>
      </section>

      <footer style={{borderTop:'1px solid #e2e8f0',padding:'24px',textAlign:'center'}}>
        <p style={{fontSize:12,color:'#94a3b8'}}>© 2026 TallerOS — Software para talleres mecánicos en Colombia y LATAM</p>
      </footer>
</div>
  )
}
