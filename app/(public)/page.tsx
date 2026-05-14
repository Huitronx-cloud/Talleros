'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useRef } from 'react'
import {
  MessageCircle, Camera, Monitor, Shield, Bell, Star,
  Check, Menu, X, Zap, ArrowRight, TrendingUp, AlertTriangle,
  ChevronRight,
} from 'lucide-react'
import { useMonedaLocal } from '@/hooks/useMonedaLocal'

const DIFERENCIADORES = [
  {
    icono: MessageCircle, color: '#2563eb', tag: '3x más aprobaciones',
    titulo: 'Aprobación por WhatsApp',
    descripcion: 'Tu cliente aprueba o rechaza reparaciones desde su celular. Sin llamadas perdidas. Todo queda registrado.',
  },
  {
    icono: Camera, color: '#0891b2', tag: '0 disputas',
    titulo: 'Fotos del diagnóstico',
    descripcion: 'Documenta el estado del vehículo antes de tocar nada. Elimina disputas sobre daños preexistentes.',
  },
  {
    icono: Monitor, color: '#2563eb', tag: '97% satisfacción',
    titulo: 'Portal en tiempo real',
    descripcion: 'Tu cliente ve el avance de su vehículo en vivo. Transparencia total que genera confianza.',
  },
  {
    icono: Shield, color: '#0891b2', tag: '100% profesional',
    titulo: 'Garantía digital',
    descripcion: 'Emite garantías digitales firmadas en cada entrega. Diferénciate de cualquier taller al instante.',
  },
  {
    icono: Bell, color: '#2563eb', tag: '+40% retención',
    titulo: 'Recordatorios automáticos',
    descripcion: 'TallerOS contacta a tus clientes cada 3–6 meses para mantenimiento. Ingresos recurrentes sin esfuerzo.',
  },
  {
    icono: Star, color: '#0891b2', tag: '5★ en Google',
    titulo: 'Reseñas automáticas',
    descripcion: 'Al entregar un vehículo TallerOS pide la reseña. El 97% de clientes lee reviews antes de elegir taller.',
  },
]

const PLANES = [
  {
    nombre: 'Esencial', precio_mensual: 24, precio_anual: 19, total_anual: 228,
    icono: Zap, popular: false,
    features: [
      'Órdenes de trabajo ilimitadas',
      'Gestión de clientes y vehículos',
      'Notificaciones por WhatsApp',
      'Portal del cliente en tiempo real',
      'Garantía digital en cada entrega',
      'Hasta 5 usuarios',
      'Soporte por email',
    ],
  },
  {
    nombre: 'Pro', precio_mensual: 49, precio_anual: 39, total_anual: 468,
    icono: Star, popular: true,
    features: [
      'Todo lo del plan Esencial',
      'Recordatorios automáticos de mantenimiento',
      'Solicitud automática de reseñas en Google',
      'Reportes y métricas avanzadas',
      'Usuarios ilimitados',
      'Soporte prioritario',
    ],
  },
]

const STATS = [
  { valor: '63%', texto: 'de clientes desconfía de talleres mecánicos', icon: AlertTriangle },
  { valor: '97%', texto: 'lee reseñas antes de elegir un taller', icon: Star },
  { valor: '#1', texto: 'queja en LATAM: cobros no autorizados', icon: MessageCircle },
  { valor: '+40%', texto: 'más ingresos con recordatorios automáticos', icon: TrendingUp },
]

const MARQUEE_ITEMS = [
  'Aprobación por WhatsApp', 'Portal del cliente', 'Reseñas automáticas',
  'Garantía digital', 'Fotos del diagnóstico', 'Recordatorios de mantenimiento',
  'Multi-usuario', 'Kanban en tiempo real', 'Cotizaciones profesionales',
]

export default function LandingPage() {
  const [menuAbierto, setMenuAbierto] = useState(false)
  const [anual, setAnual] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [visible, setVisible] = useState<Set<string>>(new Set())
  const [stats, setStats] = useState({ hoy: 0, semana: 0, total: 0 })
  const [typeIdx, setTypeIdx] = useState(0)
  const [typeChar, setTypeChar] = useState(0)
  const [typeDeleting, setTypeDeleting] = useState(false)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const { convertir, cargando: cargandoMoneda } = useMonedaLocal()

  const WORDS = ['más confiable', 'más profesional', 'más rentable', 'el favorito']

  // Typewriter effect
  useEffect(() => {
    const word = WORDS[typeIdx]
    const speed = typeDeleting ? 40 : 80
    const timer = setTimeout(() => {
      if (!typeDeleting && typeChar < word.length) {
        setTypeChar(c => c + 1)
      } else if (!typeDeleting && typeChar === word.length) {
        setTimeout(() => setTypeDeleting(true), 1800)
      } else if (typeDeleting && typeChar > 0) {
        setTypeChar(c => c - 1)
      } else if (typeDeleting && typeChar === 0) {
        setTypeDeleting(false)
        setTypeIdx(i => (i + 1) % WORDS.length)
      }
    }, speed)
    return () => clearTimeout(timer)
  }, [typeChar, typeDeleting, typeIdx])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    fetch('/api/stats').then(r => r.json()).then(d => setStats(d)).catch(() => {})
  }, [])

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => entries.forEach(e => {
        if (e.isIntersecting) setVisible(prev => new Set([...prev, e.target.id]))
      }),
      { threshold: 0.08 }
    )
    document.querySelectorAll('[data-animate]').forEach(el => observerRef.current?.observe(el))
    return () => observerRef.current?.disconnect()
  }, [])

  const isV = (id: string) => visible.has(id)

  return (
    <div className="talleros-root">

      {/* ── NAV ─────────────────────────────────────── */}
      <nav className={`talleros-nav ${scrolled ? 'scrolled' : ''}`}>
        <div className="nav-inner">
          <a href="/" className="nav-logo">
            <div className="logo-img-wrap">
              <img src="/icon-512.png" alt="TallerOS" />
            </div>
            <span className="logo-text">Taller<span className="logo-accent">OS</span></span>
          </a>

          <div className="nav-links">
            {[['#caracteristicas', 'Características'], ['#precios', 'Precios'], ['#por-que', 'Por qué nosotros']].map(([href, label]) => (
              <a key={href} href={href} className="nav-link">{label}</a>
            ))}
          </div>

          <div className="nav-actions">
            <a href="/login" className="nav-login">Iniciar sesión</a>
            <a href="/registro" className="nav-cta">Prueba gratis <ChevronRight size={14} /></a>
          </div>

          <button className="nav-hamburger" onClick={() => setMenuAbierto(!menuAbierto)} aria-label="Menú">
            {menuAbierto ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {menuAbierto && (
          <div className="mobile-menu">
            {[['#caracteristicas', 'Características'], ['#precios', 'Precios'], ['#por-que', 'Por qué nosotros']].map(([href, label]) => (
              <a key={href} href={href} className="mobile-link" onClick={() => setMenuAbierto(false)}>{label}</a>
            ))}
            <div className="mobile-menu-actions">
              <a href="/login" className="mobile-login">Iniciar sesión</a>
              <a href="/registro" className="mobile-cta">Prueba gratis — 14 días</a>
            </div>
          </div>
        )}
      </nav>

      {/* ── HERO SPLIT-SCREEN ────────────────────────── */}
      <section className="hero-section">
        <div className="hero-bg-grid" />
        <div className="hero-orb hero-orb-1" />
        <div className="hero-orb hero-orb-2" />

        <div className="hero-inner">
          {/* LEFT */}
          <div className="hero-left">
            <div className="hero-badge">
              <span className="hero-badge-dot" />
              <span>Software para talleres en LATAM</span>
            </div>

            {stats.semana > 0 && (
              <div className="hero-activity">
                <span className="activity-icon">&#128295;</span>
                <span>
                  {stats.hoy > 0
                    ? `${stats.hoy} taller${stats.hoy > 1 ? 'es' : ''} se registró hoy`
                    : `${stats.semana} talleres registrados esta semana`}
                </span>
              </div>
            )}

            <h1 className="hero-h1">
              Tu taller merece ser<br />
              <span className="hero-typewriter">
                {WORDS[typeIdx].slice(0, typeChar)}
                <span className="cursor">|</span>
              </span>
            </h1>

            <p className="hero-sub">
              TallerOS digitaliza tu operación con aprobaciones por WhatsApp, portal del cliente en tiempo real y reseñas automáticas en Google.
            </p>

            <div className="hero-ctas">
              <a href="/registro" className="cta-primary">
                Empieza gratis — 14 días
                <ArrowRight size={17} />
              </a>
              <a href="#caracteristicas" className="cta-ghost">
                Ver características
              </a>
            </div>

            <div className="hero-trust-row">
              {['Sin tarjeta de crédito', 'Cancela cuando quieras', 'Soporte en español'].map(t => (
                <div key={t} className="trust-pill">
                  <Check size={11} strokeWidth={3} className="trust-check" />
                  <span>{t}</span>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT — Dashboard mock */}
          <div className="hero-right hero-dashboard-wrap">
            <div className="dashboard-frame">
              <div className="dashboard-chrome">
                <div className="chrome-dots">
                  <span className="dot dot-red" /><span className="dot dot-yellow" /><span className="dot dot-green" />
                </div>
                <div className="chrome-url">tallerosapp.com/dashboard</div>
              </div>

              <div className="dashboard-body">
                {/* Metrics row */}
                <div className="dash-metrics">
                  {[
                    { l: 'Clientes', v: '248', c: '#2563eb' },
                    { l: 'Órdenes', v: '32', c: '#0891b2' },
                    { l: 'Ingresos', v: '$48K', c: '#2563eb' },
                    { l: 'Reseñas', v: '4.9★', c: '#f59e0b' },
                  ].map(m => (
                    <div key={m.l} className="dash-metric">
                      <span className="metric-label">{m.l}</span>
                      <span className="metric-val" style={{ color: m.c }}>{m.v}</span>
                    </div>
                  ))}
                </div>

                {/* Kanban preview */}
                <div className="dash-kanban">
                  {[
                    { col: 'Recibido', items: ['Honda Civic — Revisión', 'Toyota RAV4 — Frenos'], color: '#475569' },
                    { col: 'En proceso', items: ['Nissan Sentra — Motor', 'VW Jetta — AC'], color: '#2563eb' },
                    { col: 'Listo', items: ['Ford F-150 — Afinación'], color: '#16a34a' },
                  ].map(col => (
                    <div key={col.col} className="kanban-col">
                      <div className="kanban-col-header" style={{ color: col.color }}>
                        <span className="kanban-dot" style={{ background: col.color }} />
                        {col.col}
                      </div>
                      {col.items.map(item => (
                        <div key={item} className="kanban-card">{item}</div>
                      ))}
                    </div>
                  ))}
                </div>

                {/* WhatsApp notification */}
                <div className="dash-notif">
                  <div className="notif-icon">
                    <MessageCircle size={14} color="#22c55e" />
                  </div>
                  <div className="notif-content">
                    <span className="notif-title">Carlos M. aprobó la reparación</span>
                    <span className="notif-sub">Vía WhatsApp · hace 2 min</span>
                  </div>
                  <span className="notif-badge">Nuevo</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── MARQUEE ──────────────────────────────────── */}
      <div className="marquee-section">
        <div className="marquee-track">
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
            <span key={i} className="marquee-item">
              {item}
              <span className="marquee-sep">·</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── STATS / PROBLEMA ─────────────────────────── */}
      <section id="por-que" className="stats-section">
        <div className="section-inner">
          <div className="section-label">La realidad del mercado</div>
          <h2 className="section-h2">El problema que TallerOS resuelve</h2>

          <div className="stats-grid">
            {STATS.map((s, i) => (
              <div
                key={i} id={`stat-${i}`} data-animate
                className={`stat-card ${isV(`stat-${i}`) ? 'visible' : ''}`}
                style={{ transitionDelay: `${i * 80}ms` }}
              >
                <s.icon size={20} className="stat-icon" />
                <div className="stat-valor">{s.valor}</div>
                <p className="stat-texto">{s.texto}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DIFERENCIADORES ──────────────────────────── */}
      <section id="caracteristicas" className="features-section">
        <div className="section-inner">
          <div className="section-label">Por qué los mejores talleres nos eligen</div>
          <h2 className="section-h2">6 herramientas que transforman tu taller en 30 días</h2>
          <p className="section-sub">Cada función resuelve un problema real que cuesta clientes y dinero todos los días.</p>

          <div className="features-grid">
            {DIFERENCIADORES.map((d, i) => (
              <div
                key={i} id={`dif-${i}`} data-animate
                className={`feature-card ${isV(`dif-${i}`) ? 'visible' : ''}`}
                style={{ transitionDelay: `${i * 70}ms` }}
              >
                <div className="feature-top">
                  <div className="feature-icon-wrap" style={{ background: `${d.color}18` }}>
                    <d.icono size={20} color={d.color} />
                  </div>
                  <span className="feature-tag" style={{ color: d.color, background: `${d.color}12` }}>{d.tag}</span>
                </div>
                <h3 className="feature-title">{d.titulo}</h3>
                <p className="feature-desc">{d.descripcion}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRECIOS ──────────────────────────────────── */}
      <section id="precios" className="pricing-section">
        <div className="section-inner">
          <div className="section-label">Precios</div>
          <h2 className="section-h2">Sin sorpresas. Sin letra chica.</h2>
          <p className="section-sub">14 días gratis en cualquier plan. Sin tarjeta de crédito.</p>

          {/* Toggle */}
          <div className="pricing-toggle-wrap">
            <div className="pricing-toggle">
              {['Mensual', 'Anual'].map((label, i) => (
                <button key={label} onClick={() => setAnual(i === 1)}
                  className={`toggle-btn ${(i === 1) === anual ? 'active' : ''}`}>
                  {label}
                  {i === 1 && <span className="toggle-badge">-20%</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Trust badges encima de precios */}
          <div className="pricing-trust">
            {[
              { icon: Check, label: 'Sin tarjeta de crédito', sub: 'Para empezar' },
              { icon: ArrowRight, label: 'Cancela cuando quieras', sub: 'Sin penalizaciones' },
              { icon: Shield, label: 'Pago seguro', sub: 'Powered by Stripe' },
              { icon: Monitor, label: 'Datos protegidos', sub: 'Encriptación total' },
            ].map((b, i) => (
              <div key={i} className="pricing-trust-item">
                <b.icon size={16} className="pt-icon" />
                <div>
                  <p className="pt-label">{b.label}</p>
                  <p className="pt-sub">{b.sub}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="plans-grid">
            {PLANES.map(plan => {
              const precioActual = anual ? plan.precio_anual : plan.precio_mensual
              const localActual = convertir(precioActual)
              const localAnual = convertir(plan.total_anual)
              return (
                <div key={plan.nombre} className={`plan-card ${plan.popular ? 'plan-popular' : ''}`}>
                  {plan.popular && <div className="plan-badge-top">Más popular</div>}

                  <div className="plan-header">
                    <div className="plan-icon-wrap">
                      <plan.icono size={18} />
                    </div>
                    <h3 className="plan-name">{plan.nombre}</h3>
                  </div>

                  <div className="plan-oferta">
                    <span className="oferta-dot" />
                    <span>Oferta exclusiva para nuevos talleres</span>
                  </div>

                  <div className="plan-price">
                    {!cargandoMoneda && localActual ? (
                      <><span className="price-num">{localActual}</span><span className="price-per">/mes</span></>
                    ) : (
                      <><span className="price-num">${precioActual} USD</span><span className="price-per">/mes</span></>
                    )}
                  </div>

                  {anual && (
                    <p className="plan-annual-note">
                      {!cargandoMoneda && localAnual ? `${localAnual} facturado anualmente` : `$${plan.total_anual} USD facturado anualmente`}
                    </p>
                  )}

                  <div className="plan-divider" />

                  <ul className="plan-features">
                    {plan.features.map(f => (
                      <li key={f}>
                        <span className="feat-check"><Check size={11} strokeWidth={3} /></span>
                        {f}
                      </li>
                    ))}
                  </ul>

                  <a href="/registro" className={`plan-cta ${plan.popular ? 'plan-cta-popular' : ''}`}>
                    Empezar prueba gratis <ArrowRight size={15} />
                  </a>
                </div>
              )
            })}
          </div>

          {/* Social proof */}
          <div className="social-proof">
            <div className="avatars-row">
              {['#2563eb', '#0891b2', '#2563eb', '#f59e0b'].map((c, i) => (
                <div key={i} className="avatar" style={{ background: c, marginLeft: i === 0 ? 0 : -8 }}>T</div>
              ))}
            </div>
            <p className="social-text">
              <strong>{stats.total > 0 ? `+${stats.total}` : '+50'} talleres</strong> ya digitalizaron su operación con TallerOS
            </p>
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ────────────────────────────────── */}
      <section className="cta-section">
        <div className="cta-inner">
          <div className="cta-orb" />
          <div className="section-label">Empieza hoy</div>
          <h2 className="cta-h2">Tu taller merece crecer.</h2>
          <p className="cta-sub">Únete a los talleres que ya digitalizaron su operación.<br />14 días gratis, sin tarjeta de crédito.</p>
          <div className="cta-btns">
            <a href="/registro" className="cta-primary">Crear mi taller gratis <ArrowRight size={17} /></a>
            <a href="/login" className="cta-ghost">Ya tengo cuenta</a>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────── */}
      <footer className="site-footer">
        <div className="footer-inner">
          <div className="footer-logo">
            <div className="logo-img-wrap sm">
              <img src="/icon-512.png" alt="TallerOS" />
            </div>
            <span className="logo-text sm">Taller<span className="logo-accent">OS</span></span>
          </div>
          <p className="footer-copy">© 2026 TallerOS. Gestión inteligente para talleres en LATAM.</p>
          <div className="footer-links">
            {[{ label: 'Privacidad', href: '/privacidad' }, { label: 'Términos', href: '/terminos' }, { label: 'Soporte', href: 'mailto:hola@tallerosapp.com' }].map(l => (
              <a key={l.label} href={l.href}>{l.label}</a>
            ))}
          </div>
        </div>
      </footer>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700;800;900&family=Geist+Mono:wght@400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }

        .talleros-root {
          background: #04080f;
          color: #e2e8f0;
          font-family: 'Geist', system-ui, sans-serif;
          min-height: 100dvh;
          overflow-x: hidden;
        }

        /* ── NAV ── */
        .talleros-nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 50;
          transition: background 0.3s, border-color 0.3s, backdrop-filter 0.3s;
          border-bottom: 1px solid transparent;
        }
        .talleros-nav.scrolled {
          background: rgba(4, 8, 15, 0.92);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border-bottom-color: rgba(255,255,255,0.06);
        }
        .nav-inner {
          max-width: 1280px; margin: 0 auto;
          display: flex; align-items: center; justify-content: space-between;
          height: 64px; padding: 0 24px;
        }
        .nav-logo { display: flex; align-items: center; gap: 10px; text-decoration: none; }
        .logo-img-wrap { width: 30px; height: 30px; border-radius: 8px; overflow: hidden; }
        .logo-img-wrap img { width: 100%; height: 100%; object-fit: contain; }
        .logo-img-wrap.sm { width: 26px; height: 26px; }
        .logo-text { font-size: 17px; font-weight: 800; color: #fff; letter-spacing: -0.5px; }
        .logo-text.sm { font-size: 15px; }
        .logo-accent { color: #2563eb; }
        .nav-links { display: flex; align-items: center; gap: 32px; }
        .nav-link {
          font-size: 14px; font-weight: 500; color: #64748b; text-decoration: none;
          transition: color 0.2s;
        }
        .nav-link:hover { color: #e2e8f0; }
        .nav-actions { display: flex; align-items: center; gap: 8px; }
        .nav-login {
          font-size: 14px; font-weight: 500; color: #64748b; text-decoration: none;
          padding: 8px 14px; transition: color 0.2s;
        }
        .nav-login:hover { color: #e2e8f0; }
        .nav-cta {
          display: flex; align-items: center; gap: 4px;
          font-size: 14px; font-weight: 700; color: #fff; text-decoration: none;
          background: #2563eb; padding: 9px 18px; border-radius: 10px;
          transition: background 0.2s, transform 0.15s;
          box-shadow: 0 0 0 1px #1d4ed8, 0 4px 16px rgba(37,99,235,0.35);
        }
        .nav-cta:hover { background: #1d4ed8; transform: translateY(-1px); }
        .nav-cta:active { transform: translateY(0) scale(0.98); }
        .nav-hamburger {
          display: none; background: none; border: none; cursor: pointer;
          color: #e2e8f0; padding: 4px;
        }
        .mobile-menu {
          background: rgba(4,8,15,0.98);
          border-top: 1px solid rgba(255,255,255,0.06);
          padding: 16px 24px 24px;
        }
        .mobile-link {
          display: block; color: #94a3b8; font-size: 16px; font-weight: 500;
          text-decoration: none; padding: 14px 0;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          transition: color 0.2s;
        }
        .mobile-link:hover { color: #e2e8f0; }
        .mobile-menu-actions { display: flex; flex-direction: column; gap: 10px; margin-top: 16px; }
        .mobile-login {
          text-align: center; color: #94a3b8; font-size: 15px; font-weight: 500;
          text-decoration: none; padding: 12px;
          border: 1px solid rgba(255,255,255,0.1); border-radius: 10px;
        }
        .mobile-cta {
          text-align: center; background: #2563eb; color: #fff;
          font-size: 15px; font-weight: 700; text-decoration: none;
          padding: 13px; border-radius: 10px;
        }

        /* ── HERO ── */
        .hero-section {
          min-height: 100dvh;
          display: flex; align-items: center;
          padding: 100px 24px 80px;
          position: relative; overflow: hidden;
        }
        .hero-bg-grid {
          position: absolute; inset: 0; pointer-events: none;
          background-image:
            linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
          background-size: 64px 64px;
        }
        .hero-orb {
          position: absolute; border-radius: 50%; pointer-events: none;
          filter: blur(80px);
        }
        .hero-orb-1 {
          width: 560px; height: 560px; top: -100px; left: -80px;
          background: radial-gradient(circle, rgba(37,99,235,0.12) 0%, transparent 70%);
        }
        .hero-orb-2 {
          width: 400px; height: 400px; bottom: 0; right: -60px;
          background: radial-gradient(circle, rgba(8,145,178,0.08) 0%, transparent 70%);
        }
        .hero-inner {
          max-width: 1280px; margin: 0 auto; width: 100%;
          display: grid; grid-template-columns: 1fr 1fr;
          gap: 64px; align-items: center; position: relative;
        }
        .hero-left { display: flex; flex-direction: column; gap: 20px; }
        .hero-badge {
          display: inline-flex; align-items: center; gap: 8px;
          background: rgba(37,99,235,0.1); border: 1px solid rgba(37,99,235,0.25);
          border-radius: 999px; padding: 6px 16px; width: fit-content;
          font-size: 12px; font-weight: 600; color: #93c5fd;
        }
        .hero-badge-dot {
          width: 7px; height: 7px; background: #22c55e; border-radius: 50%;
          box-shadow: 0 0 8px #22c55e;
          animation: pulse-dot 2s ease-in-out infinite;
        }
        @keyframes pulse-dot {
          0%, 100% { box-shadow: 0 0 6px #22c55e; }
          50% { box-shadow: 0 0 14px #22c55e, 0 0 4px #22c55e; }
        }
        .hero-activity {
          display: inline-flex; align-items: center; gap: 8px;
          background: rgba(34,197,94,0.07); border: 1px solid rgba(34,197,94,0.18);
          border-radius: 999px; padding: 6px 14px; width: fit-content;
          font-size: 13px; font-weight: 600; color: #86efac;
        }
        .activity-icon { font-size: 14px; }
        .hero-h1 {
          font-size: clamp(36px, 5.5vw, 68px);
          font-weight: 900; line-height: 1.0;
          letter-spacing: -2.5px; color: #f8fafc;
        }
        .hero-typewriter {
          display: block;
          background: linear-gradient(135deg, #2563eb, #0891b2);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text;
          min-height: 1.1em;
        }
        .cursor {
          -webkit-text-fill-color: #2563eb;
          animation: blink 0.9s step-end infinite;
          font-weight: 300;
        }
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
        .hero-sub {
          font-size: clamp(15px, 1.5vw, 18px); color: #64748b;
          line-height: 1.75; max-width: 520px;
        }
        .hero-ctas { display: flex; gap: 12px; flex-wrap: wrap; }
        .cta-primary {
          display: inline-flex; align-items: center; gap: 8px;
          background: #2563eb; color: #fff;
          font-size: 15px; font-weight: 700; text-decoration: none;
          padding: 13px 24px; border-radius: 12px;
          box-shadow: 0 0 0 1px #1d4ed8, 0 8px 32px rgba(37,99,235,0.4);
          transition: background 0.2s, transform 0.15s, box-shadow 0.2s;
        }
        .cta-primary:hover {
          background: #1d4ed8; transform: translateY(-2px);
          box-shadow: 0 0 0 1px #1d4ed8, 0 12px 40px rgba(37,99,235,0.5);
        }
        .cta-primary:active { transform: translateY(0) scale(0.98); }
        .cta-ghost {
          display: inline-flex; align-items: center; gap: 6px;
          background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
          color: #94a3b8; font-size: 15px; font-weight: 600; text-decoration: none;
          padding: 13px 22px; border-radius: 12px;
          transition: background 0.2s, color 0.2s, transform 0.15s;
        }
        .cta-ghost:hover { background: rgba(255,255,255,0.08); color: #e2e8f0; transform: translateY(-1px); }
        .hero-trust-row { display: flex; flex-wrap: wrap; gap: 10px; }
        .trust-pill {
          display: flex; align-items: center; gap: 6px;
          font-size: 12px; font-weight: 500; color: #475569;
        }
        .trust-check { color: #22c55e; }

        /* ── DASHBOARD MOCK ── */
        .hero-right { display: flex; justify-content: center; }
        .dashboard-frame {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 18px; overflow: hidden;
          box-shadow: 0 40px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05);
          width: 100%; max-width: 540px;
          animation: float 6s ease-in-out infinite;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .dashboard-chrome {
          background: #080f1c; padding: 10px 14px;
          display: flex; align-items: center; gap: 10px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .chrome-dots { display: flex; gap: 5px; }
        .dot { width: 10px; height: 10px; border-radius: 50%; }
        .dot-red { background: #ef4444; }
        .dot-yellow { background: #f59e0b; }
        .dot-green { background: #22c55e; }
        .chrome-url {
          flex: 1; background: rgba(255,255,255,0.04); border-radius: 6px;
          padding: 4px 10px; font-size: 10px; color: #334155;
          font-family: 'Geist Mono', monospace;
        }
        .dashboard-body { padding: 14px; display: flex; flex-direction: column; gap: 12px; }
        .dash-metrics { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
        .dash-metric {
          background: #060d1a; border-radius: 10px; padding: 10px;
          display: flex; flex-direction: column; gap: 4px;
        }
        .metric-label { font-size: 9px; color: #334155; text-transform: uppercase; letter-spacing: 0.5px; }
        .metric-val { font-size: 17px; font-weight: 800; letter-spacing: -0.5px; }
        .dash-kanban { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
        .kanban-col { background: #060d1a; border-radius: 10px; padding: 10px; }
        .kanban-col-header {
          display: flex; align-items: center; gap: 5px;
          font-size: 9px; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.5px; margin-bottom: 8px;
        }
        .kanban-dot { width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0; }
        .kanban-card {
          background: rgba(255,255,255,0.04); border-radius: 6px;
          padding: 6px 8px; font-size: 9px; color: #64748b;
          margin-bottom: 4px; line-height: 1.4;
        }
        .dash-notif {
          display: flex; align-items: center; gap: 10px;
          background: rgba(34,197,94,0.07); border: 1px solid rgba(34,197,94,0.15);
          border-radius: 10px; padding: 10px 12px;
          animation: notif-in 0.4s ease;
        }
        @keyframes notif-in { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }
        .notif-icon {
          width: 28px; height: 28px; border-radius: 8px;
          background: rgba(34,197,94,0.15);
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .notif-content { flex: 1; }
        .notif-title { display: block; font-size: 11px; font-weight: 600; color: #e2e8f0; }
        .notif-sub { display: block; font-size: 9px; color: #475569; margin-top: 1px; }
        .notif-badge {
          font-size: 9px; font-weight: 700; color: #22c55e;
          background: rgba(34,197,94,0.15); padding: 2px 7px; border-radius: 999px;
        }

        /* ── MARQUEE ── */
        .marquee-section {
          border-top: 1px solid rgba(255,255,255,0.05);
          border-bottom: 1px solid rgba(255,255,255,0.05);
          overflow: hidden; padding: 14px 0;
          background: rgba(255,255,255,0.015);
        }
        .marquee-track {
          display: flex; width: max-content;
          animation: marquee 28s linear infinite;
        }
        @keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .marquee-item { font-size: 13px; font-weight: 500; color: #334155; white-space: nowrap; }
        .marquee-sep { margin: 0 20px; color: #2563eb; }

        /* ── SECTIONS SHARED ── */
        .section-inner { max-width: 1200px; margin: 0 auto; padding: 0 24px; }
        .section-label {
          font-size: 11px; font-weight: 700; color: #2563eb;
          letter-spacing: 2px; text-transform: uppercase;
          margin-bottom: 12px; text-align: center;
        }
        .section-h2 {
          font-size: clamp(26px, 4vw, 48px); font-weight: 900;
          letter-spacing: -2px; line-height: 1.05;
          color: #f8fafc; text-align: center; margin-bottom: 12px;
        }
        .section-sub {
          font-size: 15px; color: #475569; text-align: center;
          max-width: 500px; margin: 0 auto 56px; line-height: 1.7;
        }

        /* ── STATS ── */
        .stats-section { padding: 80px 0; }
        .stats-grid {
          display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 16px; margin-top: 48px;
        }
        .stat-card {
          background: rgba(255,255,255,0.025);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 20px; padding: 28px;
          opacity: 0; transform: translateY(24px);
          transition: opacity 0.55s ease, transform 0.55s ease;
        }
        .stat-card.visible { opacity: 1; transform: translateY(0); }
        .stat-card:hover { border-color: rgba(37,99,235,0.3); background: rgba(37,99,235,0.04); }
        .stat-icon { color: #2563eb; margin-bottom: 16px; }
        .stat-valor {
          font-size: clamp(36px, 6vw, 52px); font-weight: 900;
          color: #2563eb; letter-spacing: -2px; line-height: 1; margin-bottom: 10px;
        }
        .stat-texto { font-size: 13px; color: #475569; line-height: 1.6; }

        /* ── FEATURES ── */
        .features-section { padding: 80px 0; }
        .features-grid {
          display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 16px;
        }
        .feature-card {
          background: #070d1c;
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 20px; padding: 28px;
          opacity: 0; transform: translateY(28px);
          transition: opacity 0.55s ease, transform 0.55s ease, border-color 0.2s;
        }
        .feature-card.visible { opacity: 1; transform: translateY(0); }
        .feature-card:hover { border-color: rgba(37,99,235,0.3); }
        .feature-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px; }
        .feature-icon-wrap {
          width: 44px; height: 44px; border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
        }
        .feature-tag {
          font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 999px;
        }
        .feature-title { font-size: 17px; font-weight: 800; color: #f1f5f9; margin-bottom: 10px; }
        .feature-desc { font-size: 14px; color: #475569; line-height: 1.75; }

        /* ── PRICING ── */
        .pricing-section { padding: 80px 0; background: rgba(255,255,255,0.015); }
        .pricing-toggle-wrap { display: flex; justify-content: center; margin-bottom: 24px; }
        .pricing-toggle {
          display: inline-flex;
          background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px; padding: 4px;
        }
        .toggle-btn {
          display: flex; align-items: center; gap: 6px;
          padding: 8px 20px; border-radius: 9px; border: none; cursor: pointer;
          font-size: 14px; font-weight: 600;
          background: transparent; color: #475569;
          transition: all 0.2s;
        }
        .toggle-btn.active { background: #2563eb; color: #fff; }
        .toggle-badge {
          font-size: 10px; background: #22c55e; color: #fff;
          padding: 1px 5px; border-radius: 999px; font-weight: 700;
        }
        .pricing-trust {
          display: flex; flex-wrap: wrap; justify-content: center; gap: 12px;
          margin-bottom: 40px;
        }
        .pricing-trust-item {
          display: flex; align-items: center; gap: 10px;
          background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06);
          border-radius: 12px; padding: 10px 16px;
        }
        .pt-icon { color: #2563eb; flex-shrink: 0; }
        .pt-label { font-size: 13px; font-weight: 700; color: #e2e8f0; }
        .pt-sub { font-size: 11px; color: #334155; margin-top: 1px; }
        .plans-grid {
          display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px; max-width: 860px; margin: 0 auto;
        }
        .plan-card {
          background: #070d1c; border: 1px solid rgba(255,255,255,0.08);
          border-radius: 24px; padding: 32px; position: relative;
          transition: border-color 0.2s, transform 0.2s;
        }
        .plan-card:hover { transform: translateY(-3px); }
        .plan-popular {
          border-color: #2563eb;
          box-shadow: 0 0 0 1px #2563eb, 0 20px 60px rgba(37,99,235,0.2);
        }
        .plan-badge-top {
          position: absolute; top: -13px; left: 50%; transform: translateX(-50%);
          background: #2563eb; color: #fff;
          font-size: 11px; font-weight: 800; padding: 4px 16px;
          border-radius: 999px; letter-spacing: 0.5px; white-space: nowrap;
          text-transform: uppercase;
        }
        .plan-header { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; }
        .plan-icon-wrap {
          width: 36px; height: 36px; border-radius: 10px;
          background: rgba(37,99,235,0.15);
          display: flex; align-items: center; justify-content: center;
          color: #2563eb;
        }
        .plan-popular .plan-icon-wrap { background: rgba(37,99,235,0.2); }
        .plan-name { font-size: 20px; font-weight: 800; color: #f8fafc; }
        .plan-oferta {
          display: inline-flex; align-items: center; gap: 6px;
          background: rgba(34,197,94,0.08); border: 1px solid rgba(34,197,94,0.2);
          border-radius: 999px; padding: 4px 12px; margin-bottom: 14px;
          font-size: 11px; font-weight: 600; color: #86efac;
        }
        .oferta-dot { width: 5px; height: 5px; background: #22c55e; border-radius: 50%; }
        .plan-price { display: flex; align-items: baseline; gap: 4px; margin-bottom: 6px; }
        .price-num { font-size: clamp(34px, 5vw, 48px); font-weight: 900; color: #2563eb; letter-spacing: -2px; }
        .plan-popular .price-num { color: #2563eb; }
        .price-per { font-size: 14px; color: #334155; }
        .plan-annual-note { font-size: 12px; color: #334155; margin-bottom: 14px; }
        .plan-divider { height: 1px; background: rgba(255,255,255,0.06); margin: 20px 0; }
        .plan-features { list-style: none; display: flex; flex-direction: column; gap: 10px; margin-bottom: 28px; }
        .plan-features li {
          display: flex; align-items: flex-start; gap: 10px;
          font-size: 14px; color: #64748b;
        }
        .feat-check {
          width: 18px; height: 18px; border-radius: 5px;
          background: rgba(37,99,235,0.15);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; margin-top: 2px; color: #2563eb;
        }
        .plan-cta {
          display: flex; align-items: center; justify-content: center; gap: 8px;
          background: rgba(37,99,235,0.1); border: 1px solid rgba(37,99,235,0.25);
          color: #93c5fd; font-size: 15px; font-weight: 700; text-decoration: none;
          padding: 13px 20px; border-radius: 12px;
          transition: all 0.2s;
        }
        .plan-cta:hover { background: rgba(37,99,235,0.2); color: #fff; }
        .plan-cta-popular {
          background: #2563eb; border-color: #2563eb; color: #fff;
          box-shadow: 0 8px 24px rgba(37,99,235,0.4);
        }
        .plan-cta-popular:hover { background: #1d4ed8; }
        .social-proof {
          display: flex; align-items: center; justify-content: center; gap: 12px;
          margin-top: 40px;
        }
        .avatars-row { display: flex; }
        .avatar {
          width: 28px; height: 28px; border-radius: 50%;
          border: 2px solid #04080f;
          display: flex; align-items: center; justify-content: center;
          font-size: 11px; font-weight: 800; color: #fff;
        }
        .social-text { font-size: 13px; color: #475569; }
        .social-text strong { color: #e2e8f0; }

        /* ── CTA FINAL ── */
        .cta-section { padding: 80px 24px; }
        .cta-inner {
          max-width: 720px; margin: 0 auto; text-align: center;
          background: rgba(37,99,235,0.06);
          border: 1px solid rgba(37,99,235,0.18);
          border-radius: 28px; padding: clamp(40px, 6vw, 72px) clamp(24px, 5vw, 64px);
          position: relative; overflow: hidden;
        }
        .cta-orb {
          position: absolute; top: -80px; right: -80px;
          width: 280px; height: 280px; border-radius: 50%; pointer-events: none;
          background: radial-gradient(circle, rgba(37,99,235,0.15), transparent);
        }
        .cta-h2 {
          font-size: clamp(28px, 4.5vw, 52px); font-weight: 900;
          letter-spacing: -2px; color: #f8fafc; margin: 12px 0;
        }
        .cta-sub {
          font-size: clamp(14px, 1.8vw, 17px); color: #475569;
          line-height: 1.7; margin-bottom: 36px;
        }
        .cta-btns { display: flex; flex-direction: column; align-items: center; gap: 12px; }

        /* ── FOOTER ── */
        .site-footer {
          border-top: 1px solid rgba(255,255,255,0.05);
          padding: 32px 24px;
        }
        .footer-inner {
          max-width: 1200px; margin: 0 auto;
          display: flex; flex-wrap: wrap; align-items: center;
          justify-content: space-between; gap: 16px;
        }
        .footer-logo { display: flex; align-items: center; gap: 8px; }
        .footer-copy { font-size: 12px; color: #1e293b; text-align: center; }
        .footer-links { display: flex; gap: 24px; }
        .footer-links a {
          font-size: 13px; color: #334155; text-decoration: none;
          transition: color 0.2s;
        }
        .footer-links a:hover { color: #94a3b8; }

        /* ── RESPONSIVE ── */
        @media (max-width: 900px) {
          .nav-links, .nav-actions { display: none; }
          .nav-hamburger { display: block; }
          .hero-inner { grid-template-columns: 1fr; gap: 48px; }
          .hero-right { display: none; }
          .hero-h1 { letter-spacing: -1.5px; }
          .dash-kanban { grid-template-columns: repeat(3, 1fr); }
        }
        @media (max-width: 600px) {
          .hero-section { padding: 90px 16px 60px; }
          .hero-ctas { flex-direction: column; }
          .cta-primary, .cta-ghost { width: 100%; justify-content: center; max-width: 340px; }
          .stats-grid { grid-template-columns: 1fr 1fr; }
          .features-grid { grid-template-columns: 1fr; }
          .plans-grid { grid-template-columns: 1fr; }
          .pricing-trust { flex-direction: column; align-items: center; }
          .pricing-trust-item { width: 100%; max-width: 320px; }
        }
      `}</style>
    </div>
  )
}