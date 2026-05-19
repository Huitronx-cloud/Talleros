'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useRef } from 'react'
import {
  MessageCircle, Camera, Monitor, Shield, Bell, Star,
  Check, Menu, X, Zap, ArrowRight, TrendingUp, AlertTriangle,
  ChevronRight, Users, FileText, BarChart2, Calendar, Package,
  Quote, Sparkles,
} from 'lucide-react'
import { useMonedaLocal } from '@/hooks/useMonedaLocal'

const MODULOS = [
  { icon: FileText,      label: 'Órdenes de trabajo',   desc: 'Crea, asigna y sigue cada orden en tiempo real.', color: '#2563eb', bg: 'rgba(37,99,235,0.12)' },
  { icon: Users,         label: 'Clientes y vehículos',  desc: 'Historial completo de cada cliente y su vehículo.', color: '#0891b2', bg: 'rgba(8,145,178,0.12)' },
  { icon: MessageCircle, label: 'WhatsApp integrado',    desc: 'Aprobaciones, notificaciones y portal directo.', color: '#16a34a', bg: 'rgba(22,163,74,0.12)' },
  { icon: BarChart2,     label: 'Reportes avanzados',    desc: 'Ingresos, rendimiento por mecánico y retención.', color: '#7c3aed', bg: 'rgba(124,58,237,0.12)' },
  { icon: Calendar,      label: 'Citas y agenda',        desc: 'Organiza tu taller sin conflictos de horario.', color: '#db2777', bg: 'rgba(219,39,119,0.12)' },
  { icon: Package,       label: 'Inventario',            desc: 'Controla refacciones y evita desabasto.', color: '#d97706', bg: 'rgba(217,119,6,0.12)' },
  { icon: Shield,        label: 'Garantía digital',      desc: 'Documentos firmados en cada entrega.', color: '#0891b2', bg: 'rgba(8,145,178,0.12)' },
  { icon: Star,          label: 'Reseñas automáticas',   desc: 'Solicita Google Reviews al entregar el vehículo.', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
]

const DIFERENCIADORES = [
  { icon: MessageCircle, gradient: 'linear-gradient(135deg,#1d4ed8,#2563eb)', tag: '3x más aprobaciones', titulo: 'Aprobación por WhatsApp', desc: 'Tu cliente aprueba o rechaza reparaciones desde su celular. Sin llamadas perdidas. Todo queda registrado con fecha y hora.' },
  { icon: Camera,        gradient: 'linear-gradient(135deg,#0e7490,#0891b2)', tag: '0 disputas',          titulo: 'Fotos del diagnóstico',  desc: 'Documenta el estado del vehículo antes de tocar nada. Elimina disputas sobre daños preexistentes para siempre.' },
  { icon: Monitor,       gradient: 'linear-gradient(135deg,#1d4ed8,#7c3aed)', tag: '97% satisfacción',   titulo: 'Portal en tiempo real',  desc: 'Tu cliente ve el avance de su vehículo en vivo sin llamar al taller. Transparencia total que genera confianza.' },
  { icon: Shield,        gradient: 'linear-gradient(135deg,#0e7490,#0891b2)', tag: '100% profesional',   titulo: 'Garantía digital',       desc: 'Emite garantías digitales firmadas en cada entrega. Diferénciate de cualquier competidor al instante.' },
  { icon: Bell,          gradient: 'linear-gradient(135deg,#7c3aed,#2563eb)', tag: '+40% retención',     titulo: 'Recordatorios automáticos', desc: 'TallerOS contacta a tus clientes cada 3–6 meses para su mantenimiento. Ingresos recurrentes sin esfuerzo.' },
  { icon: Star,          gradient: 'linear-gradient(135deg,#d97706,#f59e0b)', tag: '5★ en Google',       titulo: 'Reseñas automáticas',    desc: 'Al entregar un vehículo TallerOS pide la reseña automáticamente. El 97% lee reviews antes de elegir taller.' },
]

const TESTIMONIALES = [
  { texto: 'Desde que usamos TallerOS los clientes ya no llaman a preguntar cómo va su carro. El portal en tiempo real nos ahorró horas de atención telefónica a la semana.', nombre: 'Roberto Garza',    rol: 'Dueño — Taller Garza, Monterrey MX',    inicial: 'R', color: '#2563eb', estrellas: 5 },
  { texto: 'Las aprobaciones por WhatsApp cambiaron todo. Antes perdíamos trabajos porque el cliente no contestaba. Ahora aprueba en segundos y el mecánico sigue sin parar.',  nombre: 'Camila Restrepo', rol: 'Administradora — AutoFix, Medellín CO',  inicial: 'C', color: '#0891b2', estrellas: 5 },
  { texto: 'Los recordatorios automáticos de mantenimiento nos trajeron clientes que no veíamos en años. Es como tener un vendedor trabajando 24/7 sin pagarle extra.',          nombre: 'Miguel Quispe',   rol: 'Propietario — Mecánica Quispe, Lima PE', inicial: 'M', color: '#7c3aed', estrellas: 5 },
]

const PLANES = [
  {
    nombre: 'Esencial', precio_mensual: 24, precio_anual: 19, total_anual: 228,
    precio_original_mensual: 48, precio_original_anual: 38,
    icono: Zap, popular: false,
    features: ['Órdenes de trabajo ilimitadas','Gestión de clientes y vehículos','Notificaciones por WhatsApp','Portal del cliente en tiempo real','Garantía digital en cada entrega','Hasta 5 usuarios','Soporte por email'],
  },
  {
    nombre: 'Pro', precio_mensual: 49, precio_anual: 39, total_anual: 468,
    precio_original_mensual: 98, precio_original_anual: 78,
    icono: Star, popular: true,
    features: ['Todo lo del plan Esencial','Recordatorios automáticos de mantenimiento','Solicitud automática de reseñas en Google','Reportes y métricas avanzadas','Usuarios ilimitados','Soporte prioritario'],
  },
]

const STATS_DATA = [
  { valor: '63%',  texto: 'de clientes desconfía de talleres mecánicos',  icon: AlertTriangle, gradient: 'linear-gradient(135deg,#dc2626,#ef4444)', glow: 'rgba(220,38,38,0.25)' },
  { valor: '97%',  texto: 'lee reseñas antes de elegir un taller',         icon: Star,          gradient: 'linear-gradient(135deg,#d97706,#f59e0b)', glow: 'rgba(245,158,11,0.25)' },
  { valor: '#1',   texto: 'queja en LATAM: cobros no autorizados',         icon: MessageCircle, gradient: 'linear-gradient(135deg,#7c3aed,#8b5cf6)', glow: 'rgba(124,58,237,0.25)' },
  { valor: '+40%', texto: 'más ingresos con recordatorios automáticos',    icon: TrendingUp,    gradient: 'linear-gradient(135deg,#0891b2,#06b6d4)', glow: 'rgba(8,145,178,0.25)'  },
]

const MARQUEE = ['Aprobación por WhatsApp','Portal del cliente','Reseñas automáticas','Garantía digital','Fotos del diagnóstico','Recordatorios de mantenimiento','Multi-usuario','Kanban en tiempo real','Cotizaciones profesionales','Historial de vehículo','Control de inventario','Reportes avanzados']
const WORDS   = ['más confiable','más profesional','más rentable','el favorito']

function getSecondsUntilEndOfMonth(): number {
  const now = new Date()
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0)
  return Math.floor((end.getTime() - now.getTime()) / 1000)
}
function formatTime(s: number) {
  return { d: Math.floor(s/86400), h: Math.floor((s%86400)/3600), m: Math.floor((s%3600)/60), s: s%60 }
}

export default function LandingPage() {
  const [menuAbierto, setMenuAbierto]   = useState(false)
  const [anual, setAnual]               = useState(false)
  const [scrolled, setScrolled]         = useState(false)
  const [visible, setVisible]           = useState<Set<string>>(new Set())
  const [stats, setStats]               = useState({ hoy: 0, semana: 0, total: 0 })
  const [typeIdx, setTypeIdx]           = useState(0)
  const [typeChar, setTypeChar]         = useState(0)
  const [typeDeleting, setTypeDeleting] = useState(false)
  const [toastVisible, setToastVisible] = useState(false)
  const [offerSecs, setOfferSecs]       = useState(getSecondsUntilEndOfMonth())
  const observerRef = useRef<IntersectionObserver | null>(null)
  const { convertir, cargando: cargandoMoneda } = useMonedaLocal()

  // Typewriter
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

  // Scroll nav
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  // Stats + toast
  useEffect(() => {
    fetch('/api/stats').then(r => r.json()).then(d => {
      setStats(d)
      if (d.hoy > 0 || d.semana > 0) {
        setTimeout(() => setToastVisible(true), 4000)
        setTimeout(() => setToastVisible(false), 10000)
      }
    }).catch(() => {})
  }, [])

  // Offer countdown
  useEffect(() => {
    const t = setInterval(() => setOfferSecs(s => s > 0 ? s - 1 : 0), 1000)
    return () => clearInterval(t)
  }, [])

  // Intersection
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) setVisible(p => new Set([...p, e.target.id])) }),
      { threshold: 0.08 }
    )
    document.querySelectorAll('[data-animate]').forEach(el => observerRef.current?.observe(el))
    return () => observerRef.current?.disconnect()
  }, [])

  const isV = (id: string) => visible.has(id)
  const pad = (n: number) => String(n).padStart(2, '0')
  const { d, h, m, s } = formatTime(offerSecs)

  return (
    <>
      <div className="t-root">

      {/* TOAST NOTIFICACION */}
      {toastVisible && (stats.hoy > 0 || stats.semana > 0) && (
        <div className="t-toast">
          <span className="t-toast-icon">🔧</span>
          <span className="t-toast-text">
            {stats.hoy > 0
              ? `${stats.hoy} taller${stats.hoy > 1 ? 'es' : ''} se registró hoy`
              : `${stats.semana} talleres registrados esta semana`}
          </span>
          <button className="t-toast-close" onClick={() => setToastVisible(false)}>✕</button>
        </div>
      )}

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
              Software de gestión inteligente para talleres mecánicos
            </div>
            <h1 className="t-h1">
              Tu taller merece ser<br />
              <span className="t-typewriter">
                {WORDS[typeIdx].slice(0, typeChar)}<span className="t-cursor">|</span>
              </span>
            </h1>
            <p className="t-hero-sub">TallerOS digitaliza tu operación con aprobaciones por WhatsApp, portal del cliente en tiempo real y reseñas automáticas en Google. Todo en un solo lugar.</p>
            <div className="t-hero-ctas">
              <a href="/registro" className="t-btn-primary">Empezar demo gratis <ArrowRight size={17} /></a>
              <a href="#caracteristicas" className="t-btn-ghost">Ver cómo funciona</a>
            </div>
            <div className="t-trust-row">
              {['Sin tarjeta de crédito','14 días gratis','Soporte en español'].map(t => (
                <div key={t} className="t-trust-pill"><Check size={11} strokeWidth={3} className="t-check" /><span>{t}</span></div>
              ))}
            </div>
          </div>

          <div className="t-hero-right">
            <div className="t-hero-img-wrap">
              <img src="/hero-dashboard.png" alt="TallerOS Dashboard" className="t-hero-img" />
              <div className="t-hero-img-glow" />
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

      {/* TABLA SIN/CON */}
      <section className="t-versus-section">
        <div className="t-versus-inner">
          <p className="t-versus-pregunta">¿Sigues gestionando tu taller con WhatsApp, Excel y llamadas perdidas?</p>
          <h2 className="t-versus-titulo">Lo que cambia con TallerOS</h2>
          <div className="t-versus-table">
            <div className="t-versus-col t-versus-sin">
              <div className="t-versus-col-header">
                <span className="t-versus-icon-bad">✗</span>
                <span>Sin TallerOS</span>
              </div>
              {[
                'Clientes llaman sin parar a preguntar por su carro',
                'Aprobaciones verbales que generan disputas',
                'Sin evidencia de daños preexistentes',
                'Pierdes clientes que no regresan nunca',
                'Reseñas en Google solo cuando algo sale mal',
                'No sabes cuánto ganaste este mes',
                'Garantías en papel que se pierden',
              ].map((item, i) => (
                <div key={i} className="t-versus-row">
                  <span className="t-versus-x">✗</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <div className="t-versus-col t-versus-con">
              <div className="t-versus-col-header">
                <span className="t-versus-icon-good">✓</span>
                <span>Con TallerOS</span>
              </div>
              {[
                'Portal en tiempo real — el cliente ve el avance solo',
                'Aprobación por WhatsApp con registro digital',
                'Fotos del diagnóstico antes de tocar el vehículo',
                'Recordatorios automáticos cada 3–6 meses',
                'Reseña en Google solicitada automáticamente al entregar',
                'Reportes de ingresos y rendimiento en tiempo real',
                'Garantía digital firmada en cada entrega',
              ].map((item, i) => (
                <div key={i} className="t-versus-row">
                  <span className="t-versus-check">✓</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="t-versus-ctas">
            <a href="/registro" className="t-btn-primary">Empezar gratis — sin tarjeta <ArrowRight size={17} /></a>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section id="por-que" className="t-section t-stats-section">
        <div className="t-inner">
          <div className="t-slabel">La realidad del mercado</div>
          <h2 className="t-sh2">Los números que tu competencia ignora</h2>
          <p className="t-ssub">Mientras la mayoría de talleres opera igual que hace 20 años, los que usan TallerOS ya van adelante.</p>
          <div className="t-stats-grid">
            {STATS_DATA.map((s,i) => (
              <div key={i} id={`st-${i}`} data-animate className={`t-stat-card ${isV(`st-${i}`)?'vis':''}`} style={{transitionDelay:`${i*80}ms`}}>
                <div className="t-stat-icon-wrap" style={{background: s.gradient, boxShadow:`0 8px 24px ${s.glow}`}}>
                  <s.icon size={22} color="#fff" />
                </div>
                <div className="t-stat-val" style={{background: s.gradient, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text'}}>{s.valor}</div>
                <p className="t-stat-txt">{s.texto}</p>
              </div>
            ))}
          </div>
          <div className="t-stats-cta">
            <a href="/registro" className="t-btn-primary">Quiero ser diferente — Demo gratis <ArrowRight size={17} /></a>
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
                <div className="t-module-icon" style={{background: m.bg, border:`1px solid ${m.color}30`}}>
                  <m.icon size={24} color={m.color} />
                </div>
                <h3 className="t-module-label">{m.label}</h3>
                <p className="t-module-desc">{m.desc}</p>
                <div className="t-module-arrow" style={{color: m.color}}>
                  <ArrowRight size={14} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DIFERENCIADORES */}
      <section id="caracteristicas" className="t-section t-features-section">
        <div className="t-inner">
          <div className="t-slabel">Por qué nos eligen</div>
          <h2 className="t-sh2">6 herramientas que transforman tu taller en 30 días</h2>
          <p className="t-ssub">Cada función resuelve un problema real que cuesta clientes y dinero todos los días.</p>
          <div className="t-features-grid">
            {DIFERENCIADORES.map((d,i) => (
              <div key={i} id={`dif-${i}`} data-animate className={`t-feature-card ${isV(`dif-${i}`)?'vis':''}`} style={{transitionDelay:`${i*70}ms`}}>
                <div className="t-feature-top">
                  <div className="t-ficon" style={{background: d.gradient, boxShadow:`0 8px 20px rgba(0,0,0,0.3)`}}>
                    <d.icon size={22} color="#fff" />
                  </div>
                  <span className="t-ftag">{d.tag}</span>
                </div>
                <h3 className="t-ftitle">{d.titulo}</h3>
                <p className="t-fdesc">{d.desc}</p>
                <div className="t-feature-bottom">
                  <a href="/registro" className="t-feature-link">Conocer más <ArrowRight size={13} /></a>
                </div>
              </div>
            ))}
          </div>
          <div className="t-features-cta">
            <a href="/registro" className="t-btn-primary">Probar todas las funciones gratis <ArrowRight size={17} /></a>
          </div>
        </div>
      </section>

      {/* TESTIMONIALES */}
      <section id="testimoniales" className="t-section t-testi-section">
        <div className="t-inner">
          <div className="t-slabel">Lo que dicen nuestros clientes</div>
          <h2 className="t-sh2">Talleres que ya dieron el salto</h2>
          <p className="t-ssub">Dueños de talleres comparten su experiencia con TallerOS.</p>
          <div className="t-testi-grid">
            {TESTIMONIALES.map((t,i) => (
              <div key={i} id={`tes-${i}`} data-animate className={`t-testi-card ${isV(`tes-${i}`)?'vis':''}`} style={{transitionDelay:`${i*100}ms`}}>
                <div className="t-testi-top">
                  <div className="t-stars">{'★'.repeat(t.estrellas)}</div>
                  <Quote size={18} className="t-quote-icon" />
                </div>
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
      <section id="precios" className="t-section t-pricing-section">
        <div className="t-inner">
          {/* OFFER BAR DENTRO DE PRECIOS */}
          <div className="t-offer-inline">
            <span className="t-offer-tag">🔥 OFERTA DE LANZAMIENTO — 50% OFF</span>
            <span className="t-offer-timer">
              Termina en{' '}
              <strong className="t-offer-count">{d}d {pad(h)}:{pad(m)}:{pad(s)}</strong>
            </span>
          </div>

          <p className="t-versus-pregunta">¿Cuánto te cuesta al mes perder clientes por falta de seguimiento?</p>
          <div className="t-slabel">Precios de lanzamiento</div>
          <h2 className="t-sh2">Sin sorpresas. Sin letra chica.</h2>
          <p className="t-ssub">14 días gratis en cualquier plan. Sin tarjeta de crédito. Cancela cuando quieras.</p>

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
            {[[Check,'Sin tarjeta de crédito','Para empezar'],[Shield,'Pago seguro','Powered by Stripe'],[Monitor,'Datos protegidos','Encriptación total'],[ArrowRight,'Cancela cuando quieras','Sin penalizaciones']].map(([Icon,label,sub]:any,i) => (
              <div key={i} className="t-ptrust-item"><Icon size={16} className="t-ptrust-icon" /><div><p className="t-ptrust-label">{label}</p><p className="t-ptrust-sub">{sub}</p></div></div>
            ))}
          </div>

          <div className="t-plans-grid">
            {PLANES.map(plan => {
              const pa  = anual ? plan.precio_anual : plan.precio_mensual
              const por = anual ? plan.precio_original_anual : plan.precio_original_mensual
              const la  = convertir(pa)
              const lor = convertir(por)
              const lan = convertir(plan.total_anual)
              const descuento = Math.round((1 - pa / por) * 100)
              return (
                <div key={plan.nombre} className={`t-plan ${plan.popular?'popular':''}`}>
                  {plan.popular && <div className="t-plan-badge">⭐ Más popular</div>}
                  <div className="t-plan-hdr">
                    <div className="t-plan-icon"><plan.icono size={18} /></div>
                    <h3 className="t-plan-name">{plan.nombre}</h3>
                    <span className="t-plan-descuento">-{descuento}%</span>
                  </div>
                  <div className="t-plan-oferta"><span className="t-odot" /><span>Oferta exclusiva para nuevos talleres</span></div>

                  <div className="t-plan-price-block">
                    <div className="t-poriginal-row">
                      <span className="t-poriginal">
                        {!cargandoMoneda ? lor : `$${por} USD`}
                      </span>
                      <span className="t-pahorras">🎉 Ahorras {descuento}%</span>
                    </div>
                    <div className="t-plan-price">
                      <span className="t-pnum">
                        {!cargandoMoneda ? la : `$${pa} USD`}
                      </span>
                      <span className="t-pper">/mes</span>
                    </div>
                    {anual && (
                      <p className="t-plan-annual">
                        {!cargandoMoneda ? `${lan} al año` : `$${plan.total_anual} USD al año`}
                      </p>
                    )}
                  </div>

                  <div className="t-pdivider" />
                  <ul className="t-plan-features">
                    {plan.features.map(f => (
                      <li key={f}><span className="t-fcheck"><Check size={11} strokeWidth={3} /></span>{f}</li>
                    ))}
                  </ul>
                  <a href="/registro" className={`t-plan-cta ${plan.popular?'popular':''}`}>
                    Empezar 14 días gratis <ArrowRight size={15} />
                  </a>
                  <p className="t-plan-note">Sin tarjeta de crédito requerida</p>
                </div>
              )
            })}
          </div>

          <div className="t-social-proof">
            <div className="t-avatars">
              {['#2563eb','#0891b2','#7c3aed','#f59e0b'].map((c,i) => (
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
          <p className="t-footer-copy">© 2026 TallerOS. Gestión inteligente para talleres mecánicos.</p>
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

        /* TOAST */
        .t-toast{position:fixed;bottom:24px;left:24px;z-index:200;display:flex;align-items:center;gap:10px;background:rgba(7,13,28,0.95);border:1px solid rgba(37,99,235,0.3);border-radius:14px;padding:12px 16px;box-shadow:0 8px 32px rgba(0,0,0,0.4),0 0 0 1px rgba(37,99,235,0.15);backdrop-filter:blur(16px);animation:toastIn .4s cubic-bezier(.34,1.56,.64,1);}
        @keyframes toastIn{from{transform:translateY(20px);opacity:0;}to{transform:translateY(0);opacity:1;}}
        .t-toast-icon{font-size:1.1rem;}
        .t-toast-text{font-size:13px;font-weight:600;color:#e2e8f0;white-space:nowrap;}
        .t-toast-close{background:none;border:none;color:var(--muted);cursor:pointer;font-size:11px;padding:2px 4px;margin-left:4px;transition:color .15s;}
        .t-toast-close:hover{color:var(--text);}

        /* NAV */
        .t-nav{position:fixed;top:0;left:0;right:0;z-index:50;transition:background .3s,border-color .3s,backdrop-filter .3s;border-bottom:1px solid transparent;}
        .t-nav.scrolled{background:rgba(4,8,15,0.94);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);border-bottom-color:var(--border);}
        .t-nav-inner{max-width:1280px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;height:68px;padding:0 24px;}
        .t-logo{display:flex;align-items:center;gap:12px;text-decoration:none;}
        .t-logo-img{width:38px;height:38px;border-radius:10px;overflow:hidden;}
        .t-logo-img img{width:100%;height:100%;object-fit:contain;}
        .t-logo-img.sm{width:28px;height:28px;}
        .t-logo-text{font-size:22px;font-weight:900;color:#fff;letter-spacing:-.5px;}
        .t-logo-text.sm{font-size:16px;}
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
        .t-eyebrow-dot{width:7px;height:7px;background:#22c55e;border-radius:50%;box-shadow:0 0 8px #22c55e;animation:pg 2s ease-in-out infinite;flex-shrink:0;}
        @keyframes pg{0%,100%{box-shadow:0 0 6px #22c55e;}50%{box-shadow:0 0 14px #22c55e;}}
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

        /* HERO IMAGE */
        .t-hero-right{display:flex;justify-content:center;align-items:center;}
        .t-hero-img-wrap{position:relative;width:100%;max-width:560px;}
        .t-hero-img{width:100%;border-radius:20px;box-shadow:0 40px 80px rgba(0,0,0,0.6),0 0 0 1px rgba(255,255,255,0.06);animation:fl 6s ease-in-out infinite;}
        .t-hero-img-glow{position:absolute;inset:-20px;border-radius:40px;background:radial-gradient(ellipse at 50% 50%,rgba(37,99,235,0.15) 0%,transparent 70%);pointer-events:none;z-index:-1;}
        @keyframes fl{0%,100%{transform:translateY(0) rotate(0deg);}50%{transform:translateY(-12px) rotate(0.5deg);}}

        /* MARQUEE */
        .t-marquee-wrap{border-top:1px solid var(--border);border-bottom:1px solid var(--border);overflow:hidden;padding:14px 0;background:rgba(255,255,255,0.012);}
        .t-marquee-track{display:flex;width:max-content;animation:mq 32s linear infinite;}
        @keyframes mq{from{transform:translateX(0);}to{transform:translateX(-50%);}}
        .t-mitem{font-size:13px;font-weight:500;color:var(--dim);white-space:nowrap;}
        .t-mdot{margin:0 20px;color:var(--blue);}

        /* VERSUS */
        .t-versus-section{padding:80px 24px;background:linear-gradient(180deg,#0a0f1a 0%,#060d1a 100%);}
        .t-versus-inner{max-width:900px;margin:0 auto;}
        .t-versus-pregunta{text-align:center;color:#dc2626;font-weight:600;font-size:1rem;margin-bottom:0.5rem;}
        .t-versus-titulo{text-align:center;font-size:clamp(1.6rem,3vw,2.2rem);font-weight:800;color:#fff;margin-bottom:2.5rem;}
        .t-versus-table{display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;margin-bottom:2.5rem;}
        .t-versus-col{border-radius:16px;overflow:hidden;}
        .t-versus-sin{background:#1a0a0a;border:1px solid #3f1515;}
        .t-versus-con{background:#0a1a0f;border:1px solid #14532d;}
        .t-versus-col-header{display:flex;align-items:center;gap:0.75rem;padding:1rem 1.25rem;font-weight:700;font-size:1rem;}
        .t-versus-sin .t-versus-col-header{background:#2d0f0f;color:#f87171;}
        .t-versus-con .t-versus-col-header{background:#0f2d1a;color:#4ade80;}
        .t-versus-icon-bad{font-size:1.2rem;color:#ef4444;}
        .t-versus-icon-good{font-size:1.2rem;color:#22c55e;}
        .t-versus-row{display:flex;align-items:flex-start;gap:0.75rem;padding:0.75rem 1.25rem;border-top:1px solid rgba(255,255,255,0.05);font-size:0.875rem;line-height:1.4;}
        .t-versus-sin .t-versus-row{color:#fca5a5;}
        .t-versus-con .t-versus-row{color:#86efac;}
        .t-versus-x{color:#ef4444;font-weight:700;flex-shrink:0;margin-top:1px;}
        .t-versus-check{color:#22c55e;font-weight:700;flex-shrink:0;margin-top:1px;}
        .t-versus-ctas{display:flex;justify-content:center;gap:1rem;flex-wrap:wrap;}
        @media(max-width:640px){.t-versus-table{grid-template-columns:1fr;}.t-versus-section{padding:60px 16px;}}

        /* SHARED */
        .t-inner{max-width:1200px;margin:0 auto;padding:0 24px;}
        .t-section{padding:80px 0;}
        .t-slabel{font-size:11px;font-weight:700;color:var(--blue);letter-spacing:2px;text-transform:uppercase;margin-bottom:12px;text-align:center;}
        .t-sh2{font-size:clamp(26px,4vw,48px);font-weight:900;letter-spacing:-2px;line-height:1.05;color:#f8fafc;text-align:center;margin-bottom:12px;}
        .t-ssub{font-size:15px;color:var(--muted);text-align:center;max-width:540px;margin:0 auto 56px;line-height:1.7;}

        /* STATS */
        .t-stats-section{padding:80px 0;position:relative;}
        .t-stats-section::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse at 50% 0%,rgba(37,99,235,0.06) 0%,transparent 70%);pointer-events:none;}
        .t-stats-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:20px;margin-top:48px;}
        .t-stat-card{background:var(--bg-card);border:1px solid var(--border);border-radius:20px;padding:32px 28px;opacity:0;transform:translateY(24px);transition:opacity .55s ease,transform .55s ease,border-color .2s,box-shadow .2s;position:relative;overflow:hidden;}
        .t-stat-card::before{content:'';position:absolute;inset:0;opacity:0;transition:opacity .3s;border-radius:20px;}
        .t-stat-card.vis{opacity:1;transform:translateY(0);}
        .t-stat-card:hover{border-color:rgba(37,99,235,0.3);box-shadow:0 20px 48px rgba(0,0,0,0.3);transform:translateY(-4px);}
        .t-stat-icon-wrap{width:52px;height:52px;border-radius:14px;display:flex;align-items:center;justify-content:center;margin-bottom:1.25rem;}
        .t-stat-val{font-size:clamp(42px,6vw,56px);font-weight:900;letter-spacing:-2px;line-height:1;margin-bottom:12px;}
        .t-stat-txt{font-size:14px;color:#94a3b8;line-height:1.6;font-weight:500;}
        .t-stats-cta{display:flex;justify-content:center;margin-top:3.5rem;}

        /* MODULES */
        .t-modules-section{background:rgba(255,255,255,0.012);}
        .t-modules-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;}
        .t-module-card{background:var(--bg-card);border:1px solid var(--border);border-radius:var(--r);padding:28px 24px;opacity:0;transform:translateY(20px);transition:opacity .5s ease,transform .5s ease,border-color .25s,box-shadow .25s;cursor:pointer;position:relative;overflow:hidden;}
        .t-module-card::after{content:'';position:absolute;bottom:0;left:0;right:0;height:2px;background:linear-gradient(90deg,var(--blue),var(--cyan));transform:scaleX(0);transform-origin:left;transition:transform .3s;}
        .t-module-card:hover::after{transform:scaleX(1);}
        .t-module-card.vis{opacity:1;transform:translateY(0);}
        .t-module-card:hover{border-color:rgba(37,99,235,0.3);transform:translateY(-6px);box-shadow:0 20px 48px rgba(37,99,235,0.12);}
        .t-module-icon{width:56px;height:56px;border-radius:16px;display:flex;align-items:center;justify-content:center;margin-bottom:16px;transition:transform .25s;}
        .t-module-card:hover .t-module-icon{transform:scale(1.1);}
        .t-module-label{font-size:15px;font-weight:700;color:#f1f5f9;margin-bottom:8px;}
        .t-module-desc{font-size:12px;color:var(--muted);line-height:1.6;margin-bottom:12px;}
        .t-module-arrow{display:flex;align-items:center;opacity:0;transform:translateX(-4px);transition:opacity .2s,transform .2s;}
        .t-module-card:hover .t-module-arrow{opacity:1;transform:translateX(0);}

        /* FEATURES */
        .t-features-section{background:linear-gradient(180deg,var(--bg) 0%,rgba(7,13,28,0.8) 100%);}
        .t-features-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:20px;}
        .t-feature-card{background:var(--bg-card);border:1px solid var(--border);border-radius:20px;padding:32px;opacity:0;transform:translateY(28px);transition:opacity .55s ease,transform .55s ease,border-color .2s,box-shadow .2s;position:relative;overflow:hidden;display:flex;flex-direction:column;gap:12px;}
        .t-feature-card::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.08),transparent);}
        .t-feature-card.vis{opacity:1;transform:translateY(0);}
        .t-feature-card:hover{border-color:rgba(37,99,235,0.25);box-shadow:0 24px 56px rgba(0,0,0,0.35);transform:translateY(-4px);}
        .t-feature-top{display:flex;align-items:center;justify-content:space-between;}
        .t-ficon{width:48px;height:48px;border-radius:14px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
        .t-ftag{font-size:11px;font-weight:800;padding:4px 12px;border-radius:999px;background:rgba(255,255,255,0.07);color:#94a3b8;border:1px solid rgba(255,255,255,0.08);letter-spacing:.3px;}
        .t-ftitle{font-size:18px;font-weight:800;color:#f1f5f9;line-height:1.2;}
        .t-fdesc{font-size:14px;color:#64748b;line-height:1.75;flex:1;}
        .t-feature-bottom{margin-top:auto;padding-top:8px;}
        .t-feature-link{display:inline-flex;align-items:center;gap:6px;font-size:13px;font-weight:600;color:var(--blue);text-decoration:none;transition:gap .2s;}
        .t-feature-link:hover{gap:10px;}
        .t-features-cta{display:flex;justify-content:center;margin-top:3rem;}

        /* TESTIMONIALES */
        .t-testi-section{background:rgba(255,255,255,0.012);}
        .t-testi-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;}
        .t-testi-card{background:var(--bg-card);border:1px solid var(--border);border-radius:20px;padding:32px;opacity:0;transform:translateY(24px);transition:opacity .55s ease,transform .55s ease,border-color .2s;display:flex;flex-direction:column;gap:16px;}
        .t-testi-card.vis{opacity:1;transform:translateY(0);}
        .t-testi-card:hover{border-color:rgba(37,99,235,0.25);transform:translateY(-4px);}
        .t-testi-top{display:flex;align-items:center;justify-content:space-between;}
        .t-stars{color:#f59e0b;font-size:15px;letter-spacing:3px;}
        .t-quote-icon{color:var(--blue);opacity:.35;}
        .t-testi-text{font-size:14px;color:#94a3b8;line-height:1.8;font-style:italic;flex:1;}
        .t-testi-author{display:flex;align-items:center;gap:12px;padding-top:8px;border-top:1px solid var(--border);}
        .t-testi-avatar{width:42px;height:42px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:900;color:#fff;flex-shrink:0;}
        .t-testi-name{font-size:14px;font-weight:700;color:#f1f5f9;}
        .t-testi-rol{font-size:12px;color:var(--dim);margin-top:2px;}

        /* PRICING */
        .t-pricing-section{position:relative;}
        .t-pricing-section::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse at 50% 0%,rgba(37,99,235,0.07) 0%,transparent 60%);pointer-events:none;}

        /* OFFER INLINE */
        .t-offer-inline{display:flex;align-items:center;justify-content:center;gap:1.5rem;flex-wrap:wrap;background:linear-gradient(90deg,rgba(220,38,38,0.15),rgba(185,28,28,0.15));border:1px solid rgba(220,38,38,0.3);border-radius:14px;padding:14px 24px;margin-bottom:2rem;}
        .t-offer-tag{font-size:13px;font-weight:800;color:#fca5a5;letter-spacing:.5px;}
        .t-offer-timer{font-size:13px;color:#fda4af;}
        .t-offer-count{font-family:'Geist Mono',monospace;font-weight:700;font-size:15px;color:#fff;background:rgba(220,38,38,0.4);padding:2px 8px;border-radius:6px;letter-spacing:.05em;}

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
        .t-plans-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:24px;max-width:860px;margin:0 auto;}
        .t-plan{background:var(--bg-card);border:1px solid var(--border);border-radius:var(--rl);padding:36px 32px;position:relative;transition:border-color .2s,transform .2s,box-shadow .2s;}
        .t-plan:hover{transform:translateY(-4px);box-shadow:0 24px 56px rgba(0,0,0,0.35);}
        .t-plan.popular{border-color:var(--blue);box-shadow:0 0 0 1px var(--blue),0 24px 64px rgba(37,99,235,0.2);}
        .t-plan-badge{position:absolute;top:-14px;left:50%;transform:translateX(-50%);background:linear-gradient(135deg,#1d4ed8,#2563eb);color:#fff;font-size:11px;font-weight:800;padding:5px 18px;border-radius:999px;letter-spacing:.5px;white-space:nowrap;text-transform:uppercase;box-shadow:0 4px 12px rgba(37,99,235,0.4);}
        .t-plan-hdr{display:flex;align-items:center;gap:10px;margin-bottom:12px;}
        .t-plan-icon{width:36px;height:36px;border-radius:10px;background:rgba(37,99,235,0.15);display:flex;align-items:center;justify-content:center;color:var(--blue);}
        .t-plan-name{font-size:22px;font-weight:900;color:#f8fafc;flex:1;}
        .t-plan-descuento{font-size:12px;font-weight:800;background:linear-gradient(135deg,#16a34a,#22c55e);color:#fff;padding:3px 10px;border-radius:999px;}
        .t-plan-oferta{display:inline-flex;align-items:center;gap:6px;background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.2);border-radius:999px;padding:4px 12px;margin-bottom:20px;font-size:11px;font-weight:600;color:#86efac;}
        .t-odot{width:5px;height:5px;background:#22c55e;border-radius:50%;animation:pg 2s ease-in-out infinite;}
        .t-plan-price-block{background:rgba(37,99,235,0.06);border:1px solid rgba(37,99,235,0.12);border-radius:14px;padding:16px 18px;margin-bottom:16px;}
        .t-poriginal-row{display:flex;align-items:center;gap:10px;margin-bottom:6px;}
        .t-poriginal{font-size:17px;color:#94a3b8;text-decoration:line-through;font-weight:600;}
        .t-pahorras{font-size:11px;font-weight:800;background:rgba(34,197,94,0.15);color:#4ade80;padding:2px 8px;border-radius:999px;border:1px solid rgba(34,197,94,0.25);}
        .t-plan-price{display:flex;align-items:baseline;gap:6px;margin-top:4px;}
        .t-pnum{font-size:clamp(36px,5vw,52px);font-weight:900;background:linear-gradient(135deg,#3b82f6,#06b6d4);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;letter-spacing:-2px;line-height:1;}
        .t-pper{font-size:15px;color:#64748b;font-weight:600;-webkit-text-fill-color:#64748b;}
        .t-plan-annual{font-size:12px;color:var(--dim);margin-top:6px;}
        .t-pdivider{height:1px;background:var(--border);margin:20px 0;}
        .t-plan-features{list-style:none;display:flex;flex-direction:column;gap:10px;margin-bottom:24px;}
        .t-plan-features li{display:flex;align-items:flex-start;gap:10px;font-size:14px;color:#94a3b8;}
        .t-fcheck{width:18px;height:18px;border-radius:5px;background:rgba(37,99,235,0.15);display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:2px;color:var(--blue);}
        .t-plan-cta{display:flex;align-items:center;justify-content:center;gap:8px;background:rgba(37,99,235,0.1);border:1px solid rgba(37,99,235,0.25);color:#93c5fd;font-size:15px;font-weight:700;text-decoration:none;padding:14px 20px;border-radius:12px;transition:all .2s;}
        .t-plan-cta:hover{background:rgba(37,99,235,0.2);color:#fff;}
        .t-plan-cta.popular{background:var(--blue);border-color:var(--blue);color:#fff;box-shadow:0 8px 24px rgba(37,99,235,0.4);}
        .t-plan-cta.popular:hover{background:#1d4ed8;box-shadow:0 12px 32px rgba(37,99,235,0.5);}
        .t-plan-note{text-align:center;font-size:11px;color:var(--dim);margin-top:10px;}
        .t-social-proof{display:flex;align-items:center;justify-content:center;gap:12px;margin-top:48px;}
        .t-avatars{display:flex;}
        .t-avatar{width:30px;height:30px;border-radius:50%;border:2px solid var(--bg);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;color:#fff;}
        .t-sproof-text{font-size:13px;color:var(--muted);}
        .t-sproof-text strong{color:#e2e8f0;}

        /* CTA */
        .t-cta-section{padding:80px 24px;}
        .t-cta-inner{max-width:720px;margin:0 auto;text-align:center;background:rgba(37,99,235,0.06);border:1px solid rgba(37,99,235,0.18);border-radius:28px;padding:clamp(40px,6vw,72px) clamp(24px,5vw,64px);position:relative;overflow:hidden;}
        .t-cta-orb{position:absolute;top:-80px;right:-80px;width:280px;height:280px;border-radius:50%;pointer-events:none;background:radial-gradient(circle,rgba(37,99,235,0.15),transparent);}
        .t-cta-h2{font-size:clamp(28px,4.5vw,52px);font-weight:900;letter-spacing:-2px;color:#f8fafc;margin:12px 0;}
        .t-cta-sub{font-size:clamp(14px,1.8vw,17px);color:var(--muted);line-height:1.7;margin-bottom:36px;}
        .t-cta-btns{display:flex;justify-content:center;flex-wrap:wrap;gap:12px;}

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
          .t-offer-inline{flex-direction:column;gap:.75rem;text-align:center;}
          .t-toast{left:12px;right:12px;bottom:16px;}
        }
      `}</style>
      </div>
    </>
  )
}