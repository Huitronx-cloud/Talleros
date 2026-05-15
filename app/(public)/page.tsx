'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useRef } from 'react'
import {
  MessageCircle, Camera, Monitor, Shield, Bell, Star,
  Check, Menu, X, Zap, ArrowRight, TrendingUp, AlertTriangle,
  ChevronRight, Users, FileText, BarChart2, Calendar, Package,
  Quote,
} from 'lucide-react'
import { useMonedaLocal } from '@/hooks/useMonedaLocal'
import OfferBar from "@/components/landing/OfferBar";

const MODULOS = [
  { icon: FileText,      label: 'Órdenes de trabajo',  desc: 'Crea, asigna y sigue cada orden en tiempo real.' },
  { icon: Users,         label: 'Clientes y vehículos', desc: 'Historial completo de cada cliente y su vehículo.' },
  { icon: MessageCircle, label: 'WhatsApp integrado',   desc: 'Aprobaciones, notificaciones y portal directo.' },
  { icon: BarChart2,     label: 'Reportes avanzados',   desc: 'Ingresos, rendimiento por mecánico y retención.' },
  { icon: Calendar,      label: 'Citas y agenda',       desc: 'Organiza tu taller sin conflictos de horario.' },
  { icon: Package,       label: 'Inventario',           desc: 'Controla refacciones y evita desabasto.' },
  { icon: Shield,        label: 'Garantía digital',     desc: 'Documentos firmados en cada entrega.' },
  { icon: Star,          label: 'Reseñas automáticas',  desc: 'Solicita Google Reviews al entregar el vehículo.' },
]

const DIFERENCIADORES = [
  { icon: MessageCircle, color: '#2563eb', tag: '3x más aprobaciones', titulo: 'Aprobación por WhatsApp',    desc: 'Tu cliente aprueba o rechaza reparaciones desde su celular. Sin llamadas perdidas. Todo queda registrado.' },
  { icon: Camera,        color: '#0891b2', tag: '0 disputas',          titulo: 'Fotos del diagnóstico',      desc: 'Documenta el estado del vehículo antes de tocar nada. Elimina disputas sobre daños preexistentes.' },
  { icon: Monitor,       color: '#2563eb', tag: '97% satisfacción',    titulo: 'Portal en tiempo real',      desc: 'Tu cliente ve el avance de su vehículo en vivo sin llamar al taller. Transparencia total.' },
  { icon: Shield,        color: '#0891b2', tag: '100% profesional',    titulo: 'Garantía digital',           desc: 'Emite garantías digitales firmadas en cada entrega. Diferénciate de cualquier competidor al instante.' },
  { icon: Bell,          color: '#2563eb', tag: '+40% retención',      titulo: 'Recordatorios automáticos',  desc: 'TallerOS contacta a tus clientes cada 3–6 meses para su mantenimiento. Ingresos recurrentes sin esfuerzo.' },
  { icon: Star,          color: '#0891b2', tag: '5★ en Google',        titulo: 'Reseñas automáticas',        desc: 'Al entregar un vehículo TallerOS pide la reseña. El 97% lee reviews antes de elegir taller.' },
]

const TESTIMONIALES = [
  { texto: 'Desde que usamos TallerOS los clientes ya no llaman a preguntar cómo va su carro. El portal en tiempo real nos ahorró horas de atención telefónica a la semana.', nombre: 'Roberto Garza',    rol: 'Dueño — Taller Garza, Monterrey MX',   inicial: 'R', color: '#2563eb', estrellas: 5 },
  { texto: 'Las aprobaciones por WhatsApp cambiaron todo. Antes perdíamos trabajos porque el cliente no contestaba. Ahora aprueba en segundos y el mecánico sigue sin parar.',  nombre: 'Camila Restrepo', rol: 'Administradora — AutoFix, Medellín CO', inicial: 'C', color: '#0891b2', estrellas: 5 },
  { texto: 'Los recordatorios automáticos de mantenimiento nos trajeron clientes que no veíamos en años. Es como tener un vendedor trabajando 24/7 sin pagarle extra.',          nombre: 'Miguel Quispe',   rol: 'Propietario — Mecánica Quispe, Lima PE', inicial: 'M', color: '#2563eb', estrellas: 5 },
]

const PLANES = [
  {
    nombre: 'Esencial', precio_mensual: 24, precio_anual: 19, total_anual: 228, icono: Zap, popular: false,
    features: ['Órdenes de trabajo ilimitadas','Gestión de clientes y vehículos','Notificaciones por WhatsApp','Portal del cliente en tiempo real','Garantía digital en cada entrega','Hasta 5 usuarios','Soporte por email'],
  },
  {
    nombre: 'Pro', precio_mensual: 49, precio_anual: 39, total_anual: 468, icono: Star, popular: true,
    features: ['Todo lo del plan Esencial','Recordatorios automáticos de mantenimiento','Solicitud automática de reseñas en Google','Reportes y métricas avanzadas','Usuarios ilimitados','Soporte prioritario'],
  },
]

const STATS_DATA = [
  { valor: '63%',  texto: 'de clientes desconfía de talleres mecánicos',    icon: AlertTriangle },
  { valor: '97%',  texto: 'lee reseñas antes de elegir un taller',           icon: Star },
  { valor: '#1',   texto: 'queja en LATAM: cobros no autorizados',           icon: MessageCircle },
  { valor: '+40%', texto: 'más ingresos con recordatorios automáticos',      icon: TrendingUp },
]

const MARQUEE = ['Aprobación por WhatsApp','Portal del cliente','Reseñas automáticas','Garantía digital','Fotos del diagnóstico','Recordatorios de mantenimiento','Multi-usuario','Kanban en tiempo real','Cotizaciones profesionales','Historial de vehículo','Control de inventario','Reportes avanzados']
const WORDS   = ['más confiable','más profesional','más rentable','el favorito']

export default function LandingPage() {
  const [menuAbierto, setMenuAbierto]   = useState(false)
  const [anual, setAnual]               = useState(false)
  const [scrolled, setScrolled]         = useState(false)
  const [visible, setVisible]           = useState<Set<string>>(new Set())
  const [stats, setStats]               = useState({ hoy: 0, semana: 0, total: 0 })
  const [typeIdx, setTypeIdx]           = useState(0)
  const [typeChar, setTypeChar]         = useState(0)
  const [typeDeleting, setTypeDeleting] = useState(false)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const { convertir, cargando: cargandoMoneda } = useMonedaLocal()

  useEffect(() => {
    const word = WORDS[typeIdx]
    const speed = typeDeleting ? 38 : 75
    const timer = setTimeout(() => {
      if (!typeDeleting && typeChar < word.length) { setTypeChar(c => c + 1) }
      else if (!typeDeleting && typeChar === word.length) { setTimeout(() => setTypeDeleting(true), 1800) }
      else if (typeDeleting && typeChar > 0) { setTypeChar(c => c - 1) }
      else { setTypeDeleting(false); setTypeIdx(i => (i + 1) % WORDS.length) }
    }, speed)
    return () => clearTimeout(timer)
  }, [typeChar, typeDeleting, typeIdx])

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  useEffect(() => {
    fetch('/api/stats').then(r => r.json()).then(d => setStats(d)).catch(() => {})
  }, [])

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) setVisible(p => new Set([...p, e.target.id])) }),
      { threshold: 0.08 }
    )
    document.querySelectorAll('[data-animate]').forEach(el => observerRef.current?.observe(el))
    return () => observerRef.current?.disconnect()
  }, [])

  const isV = (id: string) => visible.has(id)

  return (
    <>
      <OfferBar />
      <div className="t-root">

      {/* NAV */}
      <nav className={`t-nav ${scrolled ? 'scrolled' : ''}`}>
        <div className="t-nav-inner">
          <a href="/" className="t-logo">
            <div className="t-logo-img"><img src="/icon-512.png" alt="TallerOS" /></div>
            <span className="t-logo-text">Taller<span className="t-accent">OS</span></span>
          </a>
          <div className="t-nav-links">
            {[['#modulos','Módulos'],['#caracteristicas','Características'],['#precios','Precios'],['#testimoniales','Clientes']].map(([h,l]) => (
              <a key={h} href={h} className="t-nav-link">{l}</a>
            ))}
          </div>
          <div className="t-nav-actions">
            <a href="/login" className="t-nav-login">Iniciar sesión</a>
            <a href="/registro" className="t-nav-cta">Prueba gratis <ChevronRight size={14} /></a>
          </div>
          <button className="t-hamburger" onClick={() => setMenuAbierto(!menuAbierto)}>
            {menuAbierto ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
        {menuAbierto && (
          <div className="t-mobile-menu">
            {[['#modulos','Módulos'],['#caracteristicas','Características'],['#precios','Precios'],['#testimoniales','Clientes']].map(([h,l]) => (
              <a key={h} href={h} className="t-mobile-link" onClick={() => setMenuAbierto(false)}>{l}</a>
            ))}
            <div className="t-mobile-actions">
              <a href="/login" className="t-mobile-login">Iniciar sesión</a>
              <a href="/registro" className="t-mobile-cta">Prueba gratis — 14 días</a>
            </div>
          </div>
        )}
      </nav>

      {/* HERO */}
      <section className="t-hero">
        <div className="t-hero-grid" />
        <div className="t-orb t-orb1" />
        <div className="t-orb t-orb2" />
        <div className="t-hero-inner">
          <div className="t-hero-left">
            <div className="t-eyebrow">
              <span className="t-eyebrow-dot" />
              Software para talleres mecánicos en LATAM
            </div>
            {stats.semana > 0 && (
              <div className="t-activity">
                <span>&#128295;</span>
                {stats.hoy > 0 ? `${stats.hoy} taller${stats.hoy > 1 ? 'es' : ''} se registró hoy` : `${stats.semana} talleres registrados esta semana`}
              </div>
            )}
            <h1 className="t-h1">
              Tu taller merece ser<br />
              <span className="t-typewriter">
                {WORDS[typeIdx].slice(0, typeChar)}<span className="t-cursor">|</span>
              </span>
            </h1>
            <p className="t-hero-sub">TallerOS digitaliza tu operación con aprobaciones por WhatsApp, portal del cliente en tiempo real y reseñas automáticas en Google.</p>
            <div className="t-hero-ctas">
              <a href="/registro" className="t-btn-primary">Empieza gratis — 14 días <ArrowRight size={17} /></a>
              <a href="#caracteristicas" className="t-btn-ghost">Ver características</a>
            </div>
            <div className="t-trust-row">
              {['Sin tarjeta de crédito','Cancela cuando quieras','Soporte en español'].map(t => (
                <div key={t} className="t-trust-pill"><Check size={11} strokeWidth={3} className="t-check" /><span>{t}</span></div>
              ))}
            </div>
          </div>

          <div className="t-hero-right">
            <div className="t-mockup">
              <div className="t-mockup-bar">
                <div className="t-dots"><span className="td red" /><span className="td yellow" /><span className="td green" /></div>
                <div className="t-url">tallerosapp.com/dashboard</div>
              </div>
              <div className="t-mockup-body">
                <div className="t-metrics">
                  {[{l:'Clientes',v:'248',c:'#2563eb'},{l:'Órdenes',v:'32',c:'#0891b2'},{l:'Ingresos',v:'$48K',c:'#2563eb'},{l:'Reseñas',v:'4.9★',c:'#f59e0b'}].map(m => (
                    <div key={m.l} className="t-metric"><span className="t-mlabel">{m.l}</span><span className="t-mval" style={{color:m.c}}>{m.v}</span></div>
                  ))}
                </div>
                <div className="t-orders">
                  <div className="t-orders-hdr"><span className="t-orders-lbl">ÓRDENES ACTIVAS</span><span className="t-orders-badge">3 hoy</span></div>
                  {[
                    {n:'Honda Civic — Marcos V.',p:75,c:'#2563eb',e:'En proceso'},
                    {n:'Toyota RAV4 — Sofía R.', p:40,c:'#0891b2',e:'Diagnóstico'},
                    {n:'Ford F-150 — Carlos M.', p:100,c:'#22c55e',e:'Listo'},
                  ].map(o => (
                    <div key={o.n} className="t-order-row">
                      <div className="t-order-info"><span className="t-oname">{o.n}</span><span className="t-oestado" style={{color:o.c}}>{o.e}</span></div>
                      <div className="t-pbar"><div className="t-pfill" style={{width:`${o.p}%`,background:o.c}} /></div>
                    </div>
                  ))}
                </div>
                <div className="t-notif">
                  <div className="t-notif-icon"><MessageCircle size={14} color="#22c55e" /></div>
                  <div className="t-notif-body"><span className="t-ntitle">Carlos M. aprobó la reparación</span><span className="t-nsub">Vía WhatsApp · hace 2 min</span></div>
                  <span className="t-nbadge">Nuevo</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MARQUEE */}
      <div className="t-marquee-wrap">
        <div className="t-marquee-track">
          {[...MARQUEE,...MARQUEE].map((item,i) => (
            <span key={i} className="t-mitem">{item}<span className="t-mdot">·</span></span>
          ))}
        </div>
      </div>

      {/* STATS */}
      <section id="por-que" className="t-section t-stats-section">
        <div className="t-inner">
          <div className="t-slabel">La realidad del mercado</div>
          <h2 className="t-sh2">El problema que TallerOS resuelve</h2>
          <div className="t-stats-grid">
            {STATS_DATA.map((s,i) => (
              <div key={i} id={`st-${i}`} data-animate className={`t-stat-card ${isV(`st-${i}`)?'vis':''}`} style={{transitionDelay:`${i*80}ms`}}>
                <s.icon size={20} className="t-stat-icon" />
                <div className="t-stat-val">{s.valor}</div>
                <p className="t-stat-txt">{s.texto}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MODULOS */}
      <section id="modulos" className="t-section t-modules-section">
        <div className="t-inner">
          <div className="t-slabel">Todo en un solo lugar</div>
          <h2 className="t-sh2">Todo lo que tu taller necesita</h2>
          <p className="t-ssub">Sin apps extra, sin integraciones complicadas. TallerOS tiene todo integrado desde el día 1.</p>
          <div className="t-modules-grid">
            {MODULOS.map((m,i) => (
              <div key={i} id={`mod-${i}`} data-animate className={`t-module-card ${isV(`mod-${i}`)?'vis':''}`} style={{transitionDelay:`${i*60}ms`}}>
                <div className="t-module-icon"><m.icon size={22} color="#2563eb" /></div>
                <h3 className="t-module-label">{m.label}</h3>
                <p className="t-module-desc">{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DIFERENCIADORES */}
      <section id="caracteristicas" className="t-section">
        <div className="t-inner">
          <div className="t-slabel">Por qué nos eligen</div>
          <h2 className="t-sh2">6 herramientas que transforman tu taller en 30 días</h2>
          <p className="t-ssub">Cada función resuelve un problema real que cuesta clientes y dinero todos los días.</p>
          <div className="t-features-grid">
            {DIFERENCIADORES.map((d,i) => (
              <div key={i} id={`dif-${i}`} data-animate className={`t-feature-card ${isV(`dif-${i}`)?'vis':''}`} style={{transitionDelay:`${i*70}ms`}}>
                <div className="t-feature-top">
                  <div className="t-ficon" style={{background:`${d.color}18`}}><d.icon size={20} color={d.color} /></div>
                  <span className="t-ftag" style={{color:d.color,background:`${d.color}12`}}>{d.tag}</span>
                </div>
                <h3 className="t-ftitle">{d.titulo}</h3>
                <p className="t-fdesc">{d.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALES */}
      <section id="testimoniales" className="t-section t-testi-section">
        <div className="t-inner">
          <div className="t-slabel">Lo que dicen nuestros clientes</div>
          <h2 className="t-sh2">Talleres que ya dieron el salto</h2>
          <p className="t-ssub">Dueños de talleres en LATAM comparten su experiencia con TallerOS.</p>
          <div className="t-testi-grid">
            {TESTIMONIALES.map((t,i) => (
              <div key={i} id={`tes-${i}`} data-animate className={`t-testi-card ${isV(`tes-${i}`)?'vis':''}`} style={{transitionDelay:`${i*100}ms`}}>
                <div className="t-stars">{'★'.repeat(t.estrellas)}</div>
                <Quote size={18} className="t-quote-icon" />
                <p className="t-testi-text">{t.texto}</p>
                <div className="t-testi-author">
                  <div className="t-testi-avatar" style={{background:t.color}}>{t.inicial}</div>
                  <div><p className="t-testi-name">{t.nombre}</p><p className="t-testi-rol">{t.rol}</p></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRECIOS */}
      <section id="precios" className="t-section">
        <div className="t-inner">
          <div className="t-slabel">Precios</div>
          <h2 className="t-sh2">Sin sorpresas. Sin letra chica.</h2>
          <p className="t-ssub">14 días gratis en cualquier plan. Sin tarjeta de crédito.</p>
          <div className="t-toggle-wrap">
            <div className="t-toggle">
              {['Mensual','Anual'].map((label,i) => (
                <button key={label} onClick={() => setAnual(i===1)} className={`t-tbtn ${(i===1)===anual?'active':''}`}>
                  {label}{i===1 && <span className="t-tbadge">-20%</span>}
                </button>
              ))}
            </div>
          </div>
          <div className="t-ptrust">
            {[[Check,'Sin tarjeta de crédito','Para empezar'],[ArrowRight,'Cancela cuando quieras','Sin penalizaciones'],[Shield,'Pago seguro','Powered by Stripe'],[Monitor,'Datos protegidos','Encriptación total']].map(([Icon,label,sub]:any,i) => (
              <div key={i} className="t-ptrust-item"><Icon size={16} className="t-ptrust-icon" /><div><p className="t-ptrust-label">{label}</p><p className="t-ptrust-sub">{sub}</p></div></div>
            ))}
          </div>
          <div className="t-plans-grid">
            {PLANES.map(plan => {
              const pa = anual ? plan.precio_anual : plan.precio_mensual
              const la = convertir(pa)
              const lan = convertir(plan.total_anual)
              return (
                <div key={plan.nombre} className={`t-plan ${plan.popular?'popular':''}`}>
                  {plan.popular && <div className="t-plan-badge">Más popular</div>}
                  <div className="t-plan-hdr">
                    <div className="t-plan-icon"><plan.icono size={18} /></div>
                    <h3 className="t-plan-name">{plan.nombre}</h3>
                  </div>
                  <div className="t-plan-oferta"><span className="t-odot" /><span>Oferta exclusiva para nuevos talleres</span></div>
                  <div className="t-plan-price">
                    {!cargandoMoneda && la ? <><span className="t-pnum">{la}</span><span className="t-pper">/mes</span></> : <><span className="t-pnum">${pa} USD</span><span className="t-pper">/mes</span></>}
                  </div>
                  {anual && <p className="t-plan-annual">{!cargandoMoneda && lan ? `${lan} facturado anualmente` : `$${plan.total_anual} USD facturado anualmente`}</p>}
                  <div className="t-pdivider" />
                  <ul className="t-plan-features">
                    {plan.features.map(f => (
                      <li key={f}><span className="t-fcheck"><Check size={11} strokeWidth={3} /></span>{f}</li>
                    ))}
                  </ul>
                  <a href="/registro" className={`t-plan-cta ${plan.popular?'popular':''}`}>Empezar prueba gratis <ArrowRight size={15} /></a>
                </div>
              )
            })}
          </div>
          <div className="t-social-proof">
            <div className="t-avatars">
              {['#2563eb','#0891b2','#2563eb','#f59e0b'].map((c,i) => (
                <div key={i} className="t-avatar" style={{background:c,marginLeft:i===0?0:-8}}>T</div>
              ))}
            </div>
            <p className="t-sproof-text"><strong>{stats.total > 0 ? `+${stats.total}` : '+50'} talleres</strong> ya digitalizaron su operación</p>
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="t-cta-section">
        <div className="t-cta-inner">
          <div className="t-cta-orb" />
          <div className="t-slabel">Empieza hoy</div>
          <h2 className="t-cta-h2">Tu taller merece crecer.</h2>
          <p className="t-cta-sub">Únete a los talleres que ya digitalizaron su operación.<br />14 días gratis, sin tarjeta de crédito.</p>
          <div className="t-cta-btns">
            <a href="/registro" className="t-btn-primary">Crear mi taller gratis <ArrowRight size={17} /></a>
            <a href="/login" className="t-btn-ghost">Ya tengo cuenta</a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="t-footer">
        <div className="t-footer-inner">
          <div className="t-footer-logo">
            <div className="t-logo-img sm"><img src="/icon-512.png" alt="TallerOS" /></div>
            <span className="t-logo-text sm">Taller<span className="t-accent">OS</span></span>
          </div>
          <p className="t-footer-copy">© 2026 TallerOS. Gestión inteligente para talleres en LATAM.</p>
          <div className="t-footer-links">
            {[{label:'Privacidad',href:'/privacidad'},{label:'Términos',href:'/terminos'},{label:'Soporte',href:'mailto:hola@tallerosapp.com'}].map(l => (
              <a key={l.label} href={l.href}>{l.label}</a>
            ))}
          </div>
        </div>
      </footer>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700;800;900&family=Geist+Mono:wght@400;500&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        html{scroll-behavior:smooth;}
        :root{
          --bg:#04080f; --bg-card:#070d1c; --bg-mid:#080f1e;
          --blue:#2563eb; --cyan:#0891b2;
          --text:#e2e8f0; --muted:#64748b; --dim:#334155;
          --border:rgba(255,255,255,0.07);
          --r:16px; --rl:22px;
        }
        .t-root{font-family:'Geist',system-ui,sans-serif;background:var(--bg);color:var(--text);min-height:100dvh;overflow-x:hidden;}

        /* NAV */
        .t-nav{position:fixed;top:0;left:0;right:0;z-index:50;transition:background .3s,border-color .3s,backdrop-filter .3s;border-bottom:1px solid transparent;}
        .t-nav.scrolled{background:rgba(4,8,15,0.94);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);border-bottom-color:var(--border);}
        .t-nav-inner{max-width:1280px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;height:64px;padding:0 24px;}
        .t-logo{display:flex;align-items:center;gap:10px;text-decoration:none;}
        .t-logo-img{width:30px;height:30px;border-radius:8px;overflow:hidden;}
        .t-logo-img img{width:100%;height:100%;object-fit:contain;}
        .t-logo-img.sm{width:26px;height:26px;}
        .t-logo-text{font-size:17px;font-weight:800;color:#fff;letter-spacing:-.5px;}
        .t-logo-text.sm{font-size:15px;}
        .t-accent{color:var(--blue);}
        .t-nav-links{display:flex;align-items:center;gap:28px;}
        .t-nav-link{font-size:14px;font-weight:500;color:var(--muted);text-decoration:none;transition:color .2s;}
        .t-nav-link:hover{color:var(--text);}
        .t-nav-actions{display:flex;align-items:center;gap:8px;}
        .t-nav-login{font-size:14px;font-weight:500;color:var(--muted);text-decoration:none;padding:8px 14px;transition:color .2s;}
        .t-nav-login:hover{color:var(--text);}
        .t-nav-cta{display:flex;align-items:center;gap:4px;font-size:14px;font-weight:700;color:#fff;text-decoration:none;background:var(--blue);padding:9px 18px;border-radius:10px;box-shadow:0 0 0 1px #1d4ed8,0 4px 16px rgba(37,99,235,0.35);transition:background .2s,transform .15s;}
        .t-nav-cta:hover{background:#1d4ed8;transform:translateY(-1px);}
        .t-hamburger{display:none;background:none;border:none;cursor:pointer;color:var(--text);padding:4px;}
        .t-mobile-menu{background:rgba(4,8,15,0.98);border-top:1px solid var(--border);padding:16px 24px 24px;}
        .t-mobile-link{display:block;color:var(--muted);font-size:16px;font-weight:500;text-decoration:none;padding:13px 0;border-bottom:1px solid var(--border);transition:color .2s;}
        .t-mobile-link:hover{color:var(--text);}
        .t-mobile-actions{display:flex;flex-direction:column;gap:10px;margin-top:16px;}
        .t-mobile-login{text-align:center;color:var(--muted);font-size:15px;font-weight:500;text-decoration:none;padding:12px;border:1px solid var(--border);border-radius:10px;}
        .t-mobile-cta{text-align:center;background:var(--blue);color:#fff;font-size:15px;font-weight:700;text-decoration:none;padding:13px;border-radius:10px;}

        /* HERO */
        .t-hero{min-height:100dvh;display:flex;align-items:center;padding:100px 24px 80px;position:relative;overflow:hidden;}
        .t-hero-grid{position:absolute;inset:0;pointer-events:none;background-image:linear-gradient(rgba(255,255,255,0.022) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.022) 1px,transparent 1px);background-size:64px 64px;}
        .t-orb{position:absolute;border-radius:50%;pointer-events:none;filter:blur(80px);}
        .t-orb1{width:600px;height:600px;top:-120px;left:-100px;background:radial-gradient(circle,rgba(37,99,235,0.13) 0%,transparent 70%);}
        .t-orb2{width:400px;height:400px;bottom:0;right:-60px;background:radial-gradient(circle,rgba(8,145,178,0.08) 0%,transparent 70%);}
        .t-hero-inner{max-width:1280px;margin:0 auto;width:100%;display:grid;grid-template-columns:1fr 1fr;gap:60px;align-items:center;position:relative;}
        .t-hero-left{display:flex;flex-direction:column;gap:22px;}
        .t-eyebrow{display:inline-flex;align-items:center;gap:8px;background:rgba(37,99,235,0.1);border:1px solid rgba(37,99,235,0.25);border-radius:999px;padding:6px 16px;width:fit-content;font-size:12px;font-weight:600;color:#93c5fd;}
        .t-eyebrow-dot{width:7px;height:7px;background:#22c55e;border-radius:50%;box-shadow:0 0 8px #22c55e;animation:pg 2s ease-in-out infinite;}
        @keyframes pg{0%,100%{box-shadow:0 0 6px #22c55e;}50%{box-shadow:0 0 14px #22c55e;}}
        .t-activity{display:inline-flex;align-items:center;gap:8px;background:rgba(34,197,94,0.07);border:1px solid rgba(34,197,94,0.18);border-radius:999px;padding:6px 14px;width:fit-content;font-size:13px;font-weight:600;color:#86efac;}
        .t-h1{font-size:clamp(36px,5.5vw,68px);font-weight:900;line-height:1.0;letter-spacing:-2.5px;color:#f8fafc;}
        .t-typewriter{display:block;background:linear-gradient(135deg,#2563eb,#0891b2);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;min-height:1.1em;}
        .t-cursor{-webkit-text-fill-color:#2563eb;animation:blink .9s step-end infinite;font-weight:300;}
        @keyframes blink{0%,100%{opacity:1;}50%{opacity:0;}}
        .t-hero-sub{font-size:clamp(15px,1.5vw,18px);color:var(--muted);line-height:1.75;max-width:520px;}
        .t-hero-ctas{display:flex;gap:12px;flex-wrap:wrap;}
        .t-btn-primary{display:inline-flex;align-items:center;gap:8px;background:var(--blue);color:#fff;font-size:15px;font-weight:700;text-decoration:none;padding:13px 24px;border-radius:12px;box-shadow:0 0 0 1px #1d4ed8,0 8px 32px rgba(37,99,235,0.4);transition:background .2s,transform .15s,box-shadow .2s;}
        .t-btn-primary:hover{background:#1d4ed8;transform:translateY(-2px);box-shadow:0 0 0 1px #1d4ed8,0 12px 40px rgba(37,99,235,0.5);}
        .t-btn-primary:active{transform:translateY(0) scale(0.98);}
        .t-btn-ghost{display:inline-flex;align-items:center;gap:6px;background:rgba(255,255,255,0.05);border:1px solid var(--border);color:var(--muted);font-size:15px;font-weight:600;text-decoration:none;padding:13px 22px;border-radius:12px;transition:background .2s,color .2s,transform .15s;}
        .t-btn-ghost:hover{background:rgba(255,255,255,0.08);color:var(--text);transform:translateY(-1px);}
        .t-trust-row{display:flex;flex-wrap:wrap;gap:12px;}
        .t-trust-pill{display:flex;align-items:center;gap:6px;font-size:12px;font-weight:500;color:var(--dim);}
        .t-check{color:#22c55e;}

        /* MOCK */
        .t-hero-right{display:flex;justify-content:center;}
        .t-mockup{width:100%;max-width:520px;background:rgba(255,255,255,0.03);border:1px solid var(--border);border-radius:var(--rl);overflow:hidden;box-shadow:0 40px 80px rgba(0,0,0,0.55),0 0 0 1px rgba(255,255,255,0.05);animation:fl 6s ease-in-out infinite;}
        @keyframes fl{0%,100%{transform:translateY(0);}50%{transform:translateY(-10px);}}
        .t-mockup-bar{background:var(--bg-mid);padding:10px 14px;display:flex;align-items:center;gap:10px;border-bottom:1px solid var(--border);}
        .t-dots{display:flex;gap:5px;}
        .td{width:10px;height:10px;border-radius:50%;}
        .td.red{background:#ef4444;}.td.yellow{background:#f59e0b;}.td.green{background:#22c55e;}
        .t-url{flex:1;background:rgba(255,255,255,0.04);border-radius:6px;padding:4px 10px;font-size:10px;color:var(--dim);font-family:'Geist Mono',monospace;}
        .t-mockup-body{padding:14px;display:flex;flex-direction:column;gap:12px;}
        .t-metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;}
        .t-metric{background:var(--bg-mid);border-radius:10px;padding:10px;}
        .t-mlabel{display:block;font-size:9px;color:var(--dim);text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px;}
        .t-mval{font-size:17px;font-weight:800;letter-spacing:-.5px;}
        .t-orders{background:var(--bg-mid);border-radius:12px;padding:12px;}
        .t-orders-hdr{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;}
        .t-orders-lbl{font-size:9px;font-weight:700;color:var(--dim);text-transform:uppercase;letter-spacing:.5px;}
        .t-orders-badge{font-size:9px;font-weight:700;color:var(--blue);background:rgba(37,99,235,0.15);padding:2px 8px;border-radius:999px;}
        .t-order-row{margin-bottom:10px;}
        .t-order-row:last-child{margin-bottom:0;}
        .t-order-info{display:flex;justify-content:space-between;align-items:center;margin-bottom:5px;}
        .t-oname{font-size:10px;font-weight:600;color:var(--text);}
        .t-oestado{font-size:9px;font-weight:700;}
        .t-pbar{height:4px;background:rgba(255,255,255,0.06);border-radius:2px;overflow:hidden;}
        .t-pfill{height:100%;border-radius:2px;}
        .t-notif{display:flex;align-items:center;gap:10px;background:rgba(34,197,94,0.07);border:1px solid rgba(34,197,94,0.15);border-radius:10px;padding:10px 12px;}
        .t-notif-icon{width:28px;height:28px;border-radius:8px;background:rgba(34,197,94,0.15);display:flex;align-items:center;justify-content:center;flex-shrink:0;}
        .t-notif-body{flex:1;}
        .t-ntitle{display:block;font-size:11px;font-weight:600;color:var(--text);}
        .t-nsub{display:block;font-size:9px;color:var(--muted);margin-top:1px;}
        .t-nbadge{font-size:9px;font-weight:700;color:#22c55e;background:rgba(34,197,94,0.15);padding:2px 7px;border-radius:999px;white-space:nowrap;}

        /* MARQUEE */
        .t-marquee-wrap{border-top:1px solid var(--border);border-bottom:1px solid var(--border);overflow:hidden;padding:14px 0;background:rgba(255,255,255,0.012);}
        .t-marquee-track{display:flex;width:max-content;animation:mq 32s linear infinite;}
        @keyframes mq{from{transform:translateX(0);}to{transform:translateX(-50%);}}
        .t-mitem{font-size:13px;font-weight:500;color:var(--dim);white-space:nowrap;}
        .t-mdot{margin:0 20px;color:var(--blue);}

        /* SHARED */
        .t-inner{max-width:1200px;margin:0 auto;padding:0 24px;}
        .t-section{padding:80px 0;}
        .t-slabel{font-size:11px;font-weight:700;color:var(--blue);letter-spacing:2px;text-transform:uppercase;margin-bottom:12px;text-align:center;}
        .t-sh2{font-size:clamp(26px,4vw,48px);font-weight:900;letter-spacing:-2px;line-height:1.05;color:#f8fafc;text-align:center;margin-bottom:12px;}
        .t-ssub{font-size:15px;color:var(--muted);text-align:center;max-width:500px;margin:0 auto 56px;line-height:1.7;}

        /* STATS */
        .t-stats-section{padding:80px 0;}
        .t-stats-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px;margin-top:48px;}
        .t-stat-card{background:var(--bg-card);border:1px solid var(--border);border-radius:var(--r);padding:28px;opacity:0;transform:translateY(24px);transition:opacity .55s ease,transform .55s ease,border-color .2s;}
        .t-stat-card.vis{opacity:1;transform:translateY(0);}
        .t-stat-card:hover{border-color:rgba(37,99,235,0.3);}
        .t-stat-icon{color:var(--blue);margin-bottom:16px;}
        .t-stat-val{font-size:clamp(36px,6vw,52px);font-weight:900;color:var(--blue);letter-spacing:-2px;line-height:1;margin-bottom:10px;}
        .t-stat-txt{font-size:13px;color:var(--muted);line-height:1.6;}

        /* MODULES */
        .t-modules-section{background:rgba(255,255,255,0.012);}
        .t-modules-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;}
        .t-module-card{background:var(--bg-card);border:1px solid var(--border);border-radius:var(--r);padding:24px;text-align:center;opacity:0;transform:translateY(20px);transition:opacity .5s ease,transform .5s ease,border-color .25s;}
        .t-module-card.vis{opacity:1;transform:translateY(0);}
        .t-module-card:hover{border-color:rgba(37,99,235,0.35);transform:translateY(-5px);box-shadow:0 16px 40px rgba(37,99,235,0.1);}
        .t-module-icon{width:52px;height:52px;border-radius:14px;background:rgba(37,99,235,0.12);display:flex;align-items:center;justify-content:center;margin:0 auto 14px;}
        .t-module-label{font-size:14px;font-weight:700;color:#f1f5f9;margin-bottom:8px;}
        .t-module-desc{font-size:12px;color:var(--muted);line-height:1.6;}

        /* FEATURES */
        .t-features-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:16px;}
        .t-feature-card{background:var(--bg-card);border:1px solid var(--border);border-radius:var(--r);padding:28px;opacity:0;transform:translateY(28px);transition:opacity .55s ease,transform .55s ease,border-color .2s;}
        .t-feature-card.vis{opacity:1;transform:translateY(0);}
        .t-feature-card:hover{border-color:rgba(37,99,235,0.3);}
        .t-feature-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:18px;}
        .t-ficon{width:44px;height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center;}
        .t-ftag{font-size:11px;font-weight:700;padding:4px 10px;border-radius:999px;}
        .t-ftitle{font-size:17px;font-weight:800;color:#f1f5f9;margin-bottom:10px;}
        .t-fdesc{font-size:14px;color:var(--muted);line-height:1.75;}

        /* TESTIMONIALES */
        .t-testi-section{background:rgba(255,255,255,0.012);}
        .t-testi-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;}
        .t-testi-card{background:var(--bg-card);border:1px solid var(--border);border-radius:var(--r);padding:28px;opacity:0;transform:translateY(24px);transition:opacity .55s ease,transform .55s ease,border-color .2s;}
        .t-testi-card.vis{opacity:1;transform:translateY(0);}
        .t-testi-card:hover{border-color:rgba(37,99,235,0.3);}
        .t-stars{color:#f59e0b;font-size:14px;letter-spacing:2px;margin-bottom:12px;}
        .t-quote-icon{color:var(--blue);opacity:.4;margin-bottom:10px;}
        .t-testi-text{font-size:14px;color:var(--muted);line-height:1.75;margin-bottom:20px;font-style:italic;}
        .t-testi-author{display:flex;align-items:center;gap:12px;}
        .t-testi-avatar{width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:800;color:#fff;flex-shrink:0;}
        .t-testi-name{font-size:14px;font-weight:700;color:#f1f5f9;}
        .t-testi-rol{font-size:12px;color:var(--dim);margin-top:2px;}

        /* PRICING */
        .t-toggle-wrap{display:flex;justify-content:center;margin-bottom:24px;}
        .t-toggle{display:inline-flex;background:rgba(255,255,255,0.04);border:1px solid var(--border);border-radius:12px;padding:4px;}
        .t-tbtn{display:flex;align-items:center;gap:6px;padding:8px 20px;border-radius:9px;border:none;cursor:pointer;font-size:14px;font-weight:600;background:transparent;color:var(--muted);transition:all .2s;font-family:inherit;}
        .t-tbtn.active{background:var(--blue);color:#fff;}
        .t-tbadge{font-size:10px;background:#22c55e;color:#fff;padding:1px 5px;border-radius:999px;font-weight:700;}
        .t-ptrust{display:flex;flex-wrap:wrap;justify-content:center;gap:12px;margin-bottom:40px;}
        .t-ptrust-item{display:flex;align-items:center;gap:10px;background:var(--bg-card);border:1px solid var(--border);border-radius:12px;padding:10px 16px;}
        .t-ptrust-icon{color:var(--blue);flex-shrink:0;}
        .t-ptrust-label{font-size:13px;font-weight:700;color:#e2e8f0;}
        .t-ptrust-sub{font-size:11px;color:var(--dim);margin-top:1px;}
        .t-plans-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:20px;max-width:860px;margin:0 auto;}
        .t-plan{background:var(--bg-card);border:1px solid var(--border);border-radius:var(--rl);padding:32px;position:relative;transition:border-color .2s,transform .2s;}
        .t-plan:hover{transform:translateY(-3px);}
        .t-plan.popular{border-color:var(--blue);box-shadow:0 0 0 1px var(--blue),0 20px 60px rgba(37,99,235,0.18);}
        .t-plan-badge{position:absolute;top:-13px;left:50%;transform:translateX(-50%);background:var(--blue);color:#fff;font-size:11px;font-weight:800;padding:4px 16px;border-radius:999px;letter-spacing:.5px;white-space:nowrap;text-transform:uppercase;}
        .t-plan-hdr{display:flex;align-items:center;gap:10px;margin-bottom:16px;}
        .t-plan-icon{width:36px;height:36px;border-radius:10px;background:rgba(37,99,235,0.15);display:flex;align-items:center;justify-content:center;color:var(--blue);}
        .t-plan-name{font-size:20px;font-weight:800;color:#f8fafc;}
        .t-plan-oferta{display:inline-flex;align-items:center;gap:6px;background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.2);border-radius:999px;padding:4px 12px;margin-bottom:14px;font-size:11px;font-weight:600;color:#86efac;}
        .t-odot{width:5px;height:5px;background:#22c55e;border-radius:50%;}
        .t-plan-price{display:flex;align-items:baseline;gap:4px;margin-bottom:6px;}
        .t-pnum{font-size:clamp(32px,5vw,46px);font-weight:900;color:var(--blue);letter-spacing:-2px;}
        .t-pper{font-size:14px;color:var(--dim);}
        .t-plan-annual{font-size:12px;color:var(--dim);margin-bottom:14px;}
        .t-pdivider{height:1px;background:var(--border);margin:20px 0;}
        .t-plan-features{list-style:none;display:flex;flex-direction:column;gap:10px;margin-bottom:28px;}
        .t-plan-features li{display:flex;align-items:flex-start;gap:10px;font-size:14px;color:var(--muted);}
        .t-fcheck{width:18px;height:18px;border-radius:5px;background:rgba(37,99,235,0.15);display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:2px;color:var(--blue);}
        .t-plan-cta{display:flex;align-items:center;justify-content:center;gap:8px;background:rgba(37,99,235,0.1);border:1px solid rgba(37,99,235,0.25);color:#93c5fd;font-size:15px;font-weight:700;text-decoration:none;padding:13px 20px;border-radius:12px;transition:all .2s;}
        .t-plan-cta:hover{background:rgba(37,99,235,0.2);color:#fff;}
        .t-plan-cta.popular{background:var(--blue);border-color:var(--blue);color:#fff;box-shadow:0 8px 24px rgba(37,99,235,0.4);}
        .t-plan-cta.popular:hover{background:#1d4ed8;}
        .t-social-proof{display:flex;align-items:center;justify-content:center;gap:12px;margin-top:40px;}
        .t-avatars{display:flex;}
        .t-avatar{width:28px;height:28px;border-radius:50%;border:2px solid var(--bg);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;color:#fff;}
        .t-sproof-text{font-size:13px;color:var(--muted);}
        .t-sproof-text strong{color:#e2e8f0;}

        /* CTA */
        .t-cta-section{padding:80px 24px;}
        .t-cta-inner{max-width:720px;margin:0 auto;text-align:center;background:rgba(37,99,235,0.06);border:1px solid rgba(37,99,235,0.18);border-radius:28px;padding:clamp(40px,6vw,72px) clamp(24px,5vw,64px);position:relative;overflow:hidden;}
        .t-cta-orb{position:absolute;top:-80px;right:-80px;width:280px;height:280px;border-radius:50%;pointer-events:none;background:radial-gradient(circle,rgba(37,99,235,0.15),transparent);}
        .t-cta-h2{font-size:clamp(28px,4.5vw,52px);font-weight:900;letter-spacing:-2px;color:#f8fafc;margin:12px 0;}
        .t-cta-sub{font-size:clamp(14px,1.8vw,17px);color:var(--muted);line-height:1.7;margin-bottom:36px;}
        .t-cta-btns{display:flex;flex-direction:column;align-items:center;gap:12px;}

        /* FOOTER */
        .t-footer{border-top:1px solid var(--border);padding:32px 24px;}
        .t-footer-inner{max-width:1200px;margin:0 auto;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:16px;}
        .t-footer-logo{display:flex;align-items:center;gap:8px;}
        .t-footer-copy{font-size:12px;color:var(--dim);text-align:center;}
        .t-footer-links{display:flex;gap:24px;}
        .t-footer-links a{font-size:13px;color:var(--dim);text-decoration:none;transition:color .2s;}
        .t-footer-links a:hover{color:var(--muted);}

        /* RESPONSIVE */
        @media(max-width:900px){
          .t-nav-links,.t-nav-actions{display:none;}
          .t-hamburger{display:block;}
          .t-hero-inner{grid-template-columns:1fr;gap:48px;}
          .t-hero-right{display:none;}
          .t-modules-grid{grid-template-columns:repeat(2,1fr);}
          .t-testi-grid{grid-template-columns:1fr;}
        }
        @media(max-width:600px){
          .t-hero{padding:90px 16px 60px;}
          .t-hero-ctas{flex-direction:column;}
          .t-btn-primary,.t-btn-ghost{width:100%;justify-content:center;max-width:340px;}
          .t-stats-grid{grid-template-columns:1fr 1fr;}
          .t-modules-grid{grid-template-columns:1fr 1fr;}
          .t-features-grid{grid-template-columns:1fr;}
          .t-plans-grid{grid-template-columns:1fr;}
          .t-ptrust{flex-direction:column;align-items:center;}
          .t-ptrust-item{width:100%;max-width:320px;}
          .t-cta-btns .t-btn-primary,.t-cta-btns .t-btn-ghost{width:100%;max-width:320px;}
        }
      `}</style>
      </div>
    </>
  );
}