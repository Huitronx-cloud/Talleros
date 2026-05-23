'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Check, ArrowRight, Download, AlertTriangle, MessageCircle, Star, TrendingDown, Users, ChevronRight } from 'lucide-react'
import { trackEvent } from '@/components/meta-pixel'

const ERRORES = [
  {
    num: '01',
    titulo: 'No documentar el estado del vehículo al recibirlo',
    desc: 'El cliente llega a recoger su auto y dice que ese rasguño no estaba. Sin fotos del diagnóstico no tienes cómo defenderte. El taller pierde dinero y credibilidad.',
    icon: AlertTriangle,
    color: '#ef4444',
  },
  {
    num: '02',
    titulo: 'Pedir aprobación verbal para las reparaciones',
    desc: 'Haces el trabajo, el cliente dice que nunca aprobó ese costo y se niega a pagar. Sin registro digital de la aprobación el taller absorbe la pérdida.',
    icon: MessageCircle,
    color: '#f59e0b',
  },
  {
    num: '03',
    titulo: 'No pedir reseñas en Google al entregar',
    desc: 'El 97% de las personas lee reseñas antes de elegir un taller. Si no las pides en el momento exacto de entrega — cuando el cliente está más feliz — se te va la oportunidad.',
    icon: Star,
    color: '#a855f7',
  },
  {
    num: '04',
    titulo: 'No hacer seguimiento a clientes inactivos',
    desc: 'Un cliente que no regresa en 6 meses no es un cliente perdido — es un cliente olvidado. Con un recordatorio automático recuperas entre el 20% y el 40% de ellos.',
    icon: Users,
    color: '#06b6d4',
  },
  {
    num: '05',
    titulo: 'Operar sin datos de desempeño',
    desc: 'No sabes qué mecánico genera más ingresos, qué servicios tienen mejor margen ni cuándo son tus meses flojos. Sin datos tomas decisiones a ciegas y dejas dinero sobre la mesa.',
    icon: TrendingDown,
    color: '#ec4899',
  },
]

export default function GuiaPage() {
  const [nombre, setNombre]   = useState('')
  const [email, setEmail]     = useState('')
  const [loading, setLoading] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [error, setError]     = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nombre || !email) return
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/funnel/suscribir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, email }),
      })
      const data = await res.json()
      if (data.ok) {
        setEnviado(true)
        trackEvent('Lead', { content_name: 'Guía 5 errores TallerOS' })
      } else {
        setError('Hubo un error. Intenta de nuevo.')
      }
    } catch {
      setError('Hubo un error. Intenta de nuevo.')
    }
    setLoading(false)
  }

  return (
    <div style={{fontFamily:'system-ui,sans-serif',color:'#0f172a',background:'#fff',minHeight:'100dvh'}}>

      {/* NAV */}
      <nav style={{borderBottom:'1px solid #e2e8f0',padding:'0 24px',height:60,display:'flex',alignItems:'center',justifyContent:'space-between',background:'#fff',position:'sticky',top:0,zIndex:50}}>
        <Link href="/" style={{display:'flex',alignItems:'center',gap:8,textDecoration:'none'}}>
          <img src="/icon-512.png" alt="TallerOS" style={{width:30,height:30,borderRadius:8}}/>
          <span style={{fontSize:17,fontWeight:900,color:'#0f172a'}}>Taller<span style={{color:'#2563eb'}}>OS</span></span>
        </Link>
        <Link href="/registro" style={{display:'inline-flex',alignItems:'center',gap:4,background:'#2563eb',color:'#fff',padding:'8px 16px',borderRadius:10,textDecoration:'none',fontSize:13,fontWeight:700}}>
          Prueba gratis <ChevronRight size={13}/>
        </Link>
      </nav>

      {/* HERO */}
      <section style={{background:'linear-gradient(135deg,#1e3a5f,#1d4ed8)',padding:'64px 24px 48px',textAlign:'center'}}>
        <div style={{maxWidth:680,margin:'0 auto'}}>
          <div style={{display:'inline-flex',alignItems:'center',gap:8,background:'rgba(255,255,255,0.15)',border:'1px solid rgba(255,255,255,0.25)',borderRadius:999,padding:'5px 14px',marginBottom:20,fontSize:11,fontWeight:700,color:'#bfdbfe',letterSpacing:1}}>
            📥 GUÍA GRATUITA — DESCARGA INMEDIATA
          </div>
          <h1 style={{fontSize:'clamp(26px,5vw,48px)',fontWeight:900,color:'#fff',lineHeight:1.05,letterSpacing:-1.5,marginBottom:16}}>
            5 errores que le cuestan<br/>clientes a tu taller mecánico
          </h1>
          <p style={{fontSize:17,color:'#bfdbfe',lineHeight:1.7,marginBottom:8,maxWidth:520,margin:'0 auto 8px'}}>
            Y cómo los talleres más exitosos de LATAM los están eliminando con tecnología.
          </p>
          <p style={{fontSize:13,color:'#93c5fd',marginBottom:32}}>Lectura de 5 minutos • Aplica desde hoy • 100% gratis</p>

          {/* FORM */}
          {!enviado ? (
            <form onSubmit={handleSubmit} style={{background:'#fff',borderRadius:20,padding:'28px 24px',maxWidth:440,margin:'0 auto',boxShadow:'0 24px 64px rgba(0,0,0,0.25)',textAlign:'left'}}>
              <p style={{fontSize:15,fontWeight:700,color:'#0f172a',marginBottom:16,textAlign:'center'}}>
                Recibe la guía en tu email ahora
              </p>
              <div style={{marginBottom:12}}>
                <input
                  type="text"
                  placeholder="Tu nombre"
                  value={nombre}
                  onChange={e => setNombre(e.target.value)}
                  required
                  style={{width:'100%',border:'1.5px solid #e2e8f0',borderRadius:10,padding:'11px 14px',fontSize:14,color:'#0f172a',outline:'none',boxSizing:'border-box'}}
                />
              </div>
              <div style={{marginBottom:16}}>
                <input
                  type="email"
                  placeholder="Tu email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  style={{width:'100%',border:'1.5px solid #e2e8f0',borderRadius:10,padding:'11px 14px',fontSize:14,color:'#0f172a',outline:'none',boxSizing:'border-box'}}
                />
              </div>
              {error && <p style={{fontSize:12,color:'#ef4444',marginBottom:12}}>{error}</p>}
              <button
                type="submit"
                disabled={loading}
                style={{width:'100%',background:'#2563eb',color:'#fff',border:'none',borderRadius:10,padding:'13px',fontSize:15,fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:8,opacity:loading?0.7:1}}
              >
                {loading ? 'Enviando...' : <><Download size={16}/> Enviarme la guía gratis</>}
              </button>
              <p style={{fontSize:11,color:'#94a3b8',textAlign:'center',marginTop:10}}>
                Sin spam. Cancela cuando quieras.
              </p>
            </form>
          ) : (
            <div style={{background:'#fff',borderRadius:20,padding:'32px 24px',maxWidth:440,margin:'0 auto',boxShadow:'0 24px 64px rgba(0,0,0,0.25)',textAlign:'center'}}>
              <div style={{fontSize:48,marginBottom:12}}>🎉</div>
              <h3 style={{fontSize:20,fontWeight:800,color:'#0f172a',marginBottom:8}}>¡Listo, {nombre.split(' ')[0]}!</h3>
              <p style={{fontSize:14,color:'#64748b',lineHeight:1.7,marginBottom:20}}>
                Te enviamos la guía a <strong>{email}</strong>. Revisa tu bandeja de entrada — también puede estar en spam.
              </p>
              <Link href="/registro" style={{display:'inline-flex',alignItems:'center',gap:8,background:'#2563eb',color:'#fff',padding:'12px 24px',borderRadius:10,textDecoration:'none',fontSize:14,fontWeight:700}}>
                Probar TallerOS gratis 14 días <ArrowRight size={14}/>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* LO QUE VAS A APRENDER */}
      <section style={{padding:'72px 24px',background:'#f8fafc'}}>
        <div style={{maxWidth:800,margin:'0 auto'}}>
          <div style={{textAlign:'center',marginBottom:48}}>
            <div style={{fontSize:11,fontWeight:800,color:'#2563eb',letterSpacing:2.5,textTransform:'uppercase',marginBottom:12}}>Contenido de la guía</div>
            <h2 style={{fontSize:'clamp(22px,4vw,36px)',fontWeight:900,letterSpacing:-1,color:'#0f172a',marginBottom:12}}>Los 5 errores que están costándote clientes ahora mismo</h2>
            <p style={{fontSize:15,color:'#64748b',lineHeight:1.7}}>Cada uno de estos errores tiene solución. Y no requieren grandes inversiones.</p>
          </div>

          <div style={{display:'flex',flexDirection:'column',gap:16}}>
            {ERRORES.map((err, i) => (
              <div key={i} style={{background:'#fff',border:'1px solid #e2e8f0',borderRadius:16,padding:'24px',display:'flex',gap:20,alignItems:'flex-start',boxShadow:'0 2px 8px rgba(0,0,0,0.04)'}}>
                <div style={{width:48,height:48,borderRadius:12,background:`${err.color}12`,border:`1px solid ${err.color}25`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                  <err.icon size={22} style={{color:err.color}}/>
                </div>
                <div>
                  <div style={{fontSize:11,fontWeight:800,color:err.color,letterSpacing:1,marginBottom:4}}>ERROR {err.num}</div>
                  <h3 style={{fontSize:16,fontWeight:800,color:'#0f172a',marginBottom:6,lineHeight:1.3}}>{err.titulo}</h3>
                  <p style={{fontSize:14,color:'#64748b',lineHeight:1.7}}>{err.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* QUIEN SOMOS */}
      <section style={{padding:'72px 24px',background:'#fff'}}>
        <div style={{maxWidth:680,margin:'0 auto',textAlign:'center'}}>
          <img src="/icon-512.png" alt="TallerOS" style={{width:64,height:64,borderRadius:16,marginBottom:20}}/>
          <h2 style={{fontSize:'clamp(20px,3vw,32px)',fontWeight:900,color:'#0f172a',letterSpacing:-1,marginBottom:12}}>
            ¿Quién está detrás de esta guía?
          </h2>
          <p style={{fontSize:15,color:'#64748b',lineHeight:1.8,marginBottom:24}}>
            Somos el equipo de <strong>TallerOS</strong> — el software de gestión para talleres mecánicos más completo de LATAM. Llevamos meses trabajando directamente con dueños de taller en México, Colombia y Perú para entender sus problemas reales. Esta guía nace de esas conversaciones.
          </p>
          <div style={{display:'flex',justifyContent:'center',gap:32,flexWrap:'wrap',marginBottom:32}}>
            {[['500+','Talleres analizados'],['5','Países en LATAM'],['14 días','Demo gratis']].map(([n,l]) => (
              <div key={l} style={{textAlign:'center'}}>
                <div style={{fontSize:28,fontWeight:900,color:'#2563eb',letterSpacing:-1}}>{n}</div>
                <div style={{fontSize:12,color:'#64748b',fontWeight:500}}>{l}</div>
              </div>
            ))}
          </div>
          <Link href="/registro" style={{display:'inline-flex',alignItems:'center',gap:8,background:'#2563eb',color:'#fff',padding:'13px 28px',borderRadius:12,textDecoration:'none',fontSize:15,fontWeight:700,boxShadow:'0 8px 32px rgba(37,99,235,0.25)'}}>
            Probar TallerOS 14 días gratis <ArrowRight size={16}/>
          </Link>
          <p style={{fontSize:12,color:'#94a3b8',marginTop:10}}>Sin tarjeta de crédito requerida</p>
        </div>
      </section>

      {/* CTA FINAL */}
      {!enviado && (
        <section style={{background:'#1d4ed8',padding:'64px 24px',textAlign:'center'}}>
          <div style={{maxWidth:560,margin:'0 auto'}}>
            <h2 style={{fontSize:'clamp(22px,4vw,36px)',fontWeight:900,color:'#fff',letterSpacing:-1,marginBottom:12}}>
              Recibe la guía gratis ahora
            </h2>
            <p style={{fontSize:15,color:'#bfdbfe',marginBottom:28,lineHeight:1.7}}>
              Más de 500 dueños de taller ya la leyeron. Aplica desde hoy, sin costo.
            </p>
            <form onSubmit={handleSubmit} style={{display:'flex',gap:10,maxWidth:400,margin:'0 auto',flexWrap:'wrap'}}>
              <input
                type="email"
                placeholder="Tu email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                style={{flex:1,minWidth:200,border:'none',borderRadius:10,padding:'12px 16px',fontSize:14,color:'#0f172a',outline:'none'}}
              />
              <button
                type="submit"
                disabled={loading}
                style={{background:'#fff',color:'#1d4ed8',border:'none',borderRadius:10,padding:'12px 20px',fontSize:14,fontWeight:700,cursor:'pointer',whiteSpace:'nowrap'}}
              >
                {loading ? '...' : 'Enviarme'}
              </button>
            </form>
          </div>
        </section>
      )}

      {/* FOOTER */}
      <footer style={{borderTop:'1px solid #e2e8f0',padding:'20px 24px',textAlign:'center'}}>
        <p style={{fontSize:12,color:'#94a3b8'}}>© 2026 TallerOS — <Link href="/" style={{color:'#94a3b8'}}>tallerosapp.com</Link></p>
      </footer>
    </div>
  )
}
