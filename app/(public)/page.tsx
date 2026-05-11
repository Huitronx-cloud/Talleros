'use client'

export const dynamic = 'force-dynamic'

// Link removed - using <a> tags directly
import { useState, useEffect, useRef } from 'react'
import {
  MessageCircle, Camera, Monitor, Shield, Bell, Star,
  ChevronRight, Check, Menu, X, Zap, ArrowRight,
  TrendingUp, Users, Clock, AlertTriangle
} from 'lucide-react'

const DIFERENCIADORES = [
  {
    icono: MessageCircle,
    color: '#22c55e',
    bg: '#052e16',
    titulo: 'Aprobación por WhatsApp',
    descripcion: 'Tu cliente aprueba o rechaza reparaciones desde su celular. Sin llamadas perdidas, sin malentendidos. Todo queda registrado.',
    stat: '3x más aprobaciones',
  },
  {
    icono: Camera,
    color: '#3b82f6',
    bg: '#0c1a35',
    titulo: 'Fotos del diagnóstico',
    descripcion: 'Documenta el estado del vehículo con fotos antes de tocar nada. Elimina disputas sobre daños preexistentes para siempre.',
    stat: '0 disputas documentadas',
  },
  {
    icono: Monitor,
    color: '#a855f7',
    bg: '#1a0535',
    titulo: 'Portal del cliente en tiempo real',
    descripcion: 'Tu cliente ve el avance de su vehículo en vivo sin llamar al taller. Transparencia total que genera confianza automáticamente.',
    stat: '97% satisfacción',
  },
  {
    icono: Shield,
    color: '#f59e0b',
    bg: '#1c1002',
    titulo: 'Garantía digital',
    descripcion: 'Emite garantías digitales firmadas en cada entrega. Diferénciate de cualquier taller de la competencia al instante.',
    stat: '100% profesional',
  },
  {
    icono: Bell,
    color: '#06b6d4',
    bg: '#021520',
    titulo: 'Recordatorios automáticos',
    descripcion: 'TallerOS contacta a tus clientes cada 3-6 meses para su mantenimiento. Ingresos recurrentes sin esfuerzo de tu parte.',
    stat: '+40% retención',
  },
  {
    icono: Star,
    color: '#f97316',
    bg: '#1c0800',
    titulo: 'Reseñas en Google automáticas',
    descripcion: 'Al entregar un vehículo, TallerOS pide la reseña automáticamente. El 97% de los clientes lee reseñas antes de elegir taller.',
    stat: '5★ en Google',
  },
]

const PLANES = [
  {
    nombre: 'Esencial',
    precio_mensual: 24,
    precio_anual: 19,
    total_anual: 228,
    color: '#3b82f6',
    bg: '#0c1a35',
    border: '#1d4ed8',
    icono: Zap,
    popular: false,
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
    nombre: 'Pro',
    precio_mensual: 49,
    precio_anual: 39,
    total_anual: 468,
    color: '#a855f7',
    bg: '#1a0535',
    border: '#7c3aed',
    icono: Star,
    popular: true,
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
  { valor: '63%', texto: 'de clientes desconfía de talleres mecánicos', icon: AlertTriangle, color: '#ef4444' },
  { valor: '97%', texto: 'lee reseñas antes de elegir un taller', icon: Star, color: '#f59e0b' },
  { valor: '#1', texto: 'queja en LATAM: cobros no autorizados', icon: MessageCircle, color: '#3b82f6' },
  { valor: '40%', texto: 'más ingresos con recordatorios automáticos', icon: TrendingUp, color: '#22c55e' },
]

export default function LandingPage() {
  const [menuAbierto, setMenuAbierto] = useState(false)
  const [anual, setAnual] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [visible, setVisible] = useState<Set<string>>(new Set())
  const observerRef = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach(e => {
          if (e.isIntersecting) setVisible(prev => new Set([...prev, e.target.id]))
        })
      },
      { threshold: 0.1 }
    )
    document.querySelectorAll('[data-animate]').forEach(el => {
      observerRef.current?.observe(el)
    })
    return () => observerRef.current?.disconnect()
  }, [])

  const isVisible = (id: string) => visible.has(id)

  return (
    <div style={{ background: '#050a12', minHeight: '100vh', fontFamily: "'DM Sans', system-ui, sans-serif", color: '#f1f5f9' }}>

      {/* NAV */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        background: scrolled ? 'rgba(5,10,18,0.95)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : 'none',
        transition: 'all 0.3s ease',
        padding: '0 24px',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 72 }}>
          <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
            </div>
            <span style={{ fontSize: 20, fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>
              Taller<span style={{ color: '#3b82f6' }}>OS</span>
            </span>
          </a>

          <div style={{ display: 'flex', alignItems: 'center', gap: 32 }} className="nav-links">
            {[['#caracteristicas', 'Características'], ['#precios', 'Precios'], ['#por-que', '¿Por qué TallerOS?']].map(([href, label]) => (
              <a key={href} href={href} style={{ color: '#94a3b8', fontSize: 14, fontWeight: 500, textDecoration: 'none', transition: 'color 0.2s' }}
                onMouseEnter={e => (e.target as HTMLElement).style.color = '#fff'}
                onMouseLeave={e => (e.target as HTMLElement).style.color = '#94a3b8'}>
                {label}
              </a>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <a href="/login" style={{ color: '#94a3b8', fontSize: 14, fontWeight: 500, textDecoration: 'none', padding: '8px 16px' }}
              onMouseEnter={e => (e.target as HTMLElement).style.color = '#fff'}
              onMouseLeave={e => (e.target as HTMLElement).style.color = '#94a3b8'}>
              Iniciar sesión
            </a>
            <a href="/registro" style={{
              background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)',
              color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'none',
              padding: '10px 20px', borderRadius: 10,
              boxShadow: '0 0 20px rgba(59,130,246,0.4)',
              transition: 'all 0.2s',
            }}>
              Prueba gratis →
            </a>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '120px 24px 80px', position: 'relative', overflow: 'hidden' }}>

        {/* Fondo animado */}
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', top: '10%', left: '15%', width: 600, height: 600, background: 'radial-gradient(circle, rgba(29,78,216,0.15) 0%, transparent 70%)', borderRadius: '50%' }} />
          <div style={{ position: 'absolute', bottom: '10%', right: '10%', width: 500, height: 500, background: 'radial-gradient(circle, rgba(124,58,237,0.1) 0%, transparent 70%)', borderRadius: '50%' }} />
          <div style={{ position: 'absolute', top: '40%', right: '20%', width: 300, height: 300, background: 'radial-gradient(circle, rgba(6,182,212,0.08) 0%, transparent 70%)', borderRadius: '50%' }} />
          {/* Grid */}
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }} />
        </div>

        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center', position: 'relative' }}>

          {/* Badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 999, padding: '6px 16px', marginBottom: 32 }}>
            <div style={{ width: 8, height: 8, background: '#22c55e', borderRadius: '50%', boxShadow: '0 0 8px #22c55e' }} />
            <span style={{ fontSize: 13, color: '#93c5fd', fontWeight: 600 }}>Gestión inteligente para talleres en LATAM</span>
          </div>

          <h1 style={{ fontSize: 'clamp(40px, 7vw, 80px)', fontWeight: 900, lineHeight: 1.05, letterSpacing: '-2px', marginBottom: 24 }}>
            Tu taller merece ser{' '}
            <span style={{ background: 'linear-gradient(135deg, #3b82f6, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              el más confiable
            </span>{' '}
            de la ciudad
          </h1>

          <p style={{ fontSize: 'clamp(16px, 2vw, 20px)', color: '#94a3b8', lineHeight: 1.7, maxWidth: 640, margin: '0 auto 48px', fontWeight: 400 }}>
            TallerOS digitaliza tu taller mecánico con aprobaciones por WhatsApp, portal del cliente en tiempo real y reseñas automáticas en Google. Todo en una sola plataforma.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'center', marginBottom: 64 }}>
            <a href="/registro" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)',
              color: '#fff', fontSize: 16, fontWeight: 700, textDecoration: 'none',
              padding: '16px 32px', borderRadius: 14,
              boxShadow: '0 0 40px rgba(59,130,246,0.5)',
              transition: 'all 0.2s',
            }}>
              Empieza gratis — 14 días sin tarjeta
              <ArrowRight size={18} />
            </a>
            <a href="#caracteristicas" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
              color: '#fff', fontSize: 16, fontWeight: 600, textDecoration: 'none',
              padding: '16px 32px', borderRadius: 14,
            }}>
              Ver características
            </a>
          </div>

          {/* Mock dashboard */}
          <div style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 24,
            padding: '2px',
            boxShadow: '0 40px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)',
            maxWidth: 860,
            margin: '0 auto',
          }}>
            <div style={{ background: '#0a1628', borderRadius: 22, padding: 24, textAlign: 'left' }}>
              {/* Barra de título */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ef4444' }} />
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#f59e0b' }} />
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#22c55e' }} />
                <div style={{ flex: 1, background: 'rgba(255,255,255,0.05)', borderRadius: 6, padding: '4px 12px', marginLeft: 8 }}>
                  <span style={{ fontSize: 11, color: '#475569' }}>tallerosapp.com/dashboard</span>
                </div>
              </div>

              {/* Dashboard simulado */}
              <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 16, minHeight: 280 }}>
                {/* Sidebar */}
                <div style={{ background: '#060e1a', borderRadius: 14, padding: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                    <div style={{ width: 28, height: 28, background: '#1d4ed8', borderRadius: 8 }} />
                    <div>
                      <div style={{ height: 8, width: 80, background: '#1e293b', borderRadius: 4 }} />
                      <div style={{ height: 6, width: 50, background: '#0f172a', borderRadius: 4, marginTop: 4 }} />
                    </div>
                  </div>
                  {['Dashboard', 'Órdenes', 'Clientes', 'Citas', 'Kanban'].map((item, i) => (
                    <div key={item} style={{
                      height: 32, borderRadius: 8, marginBottom: 4,
                      background: i === 0 ? '#1d4ed8' : 'transparent',
                      display: 'flex', alignItems: 'center', paddingLeft: 10, gap: 8,
                    }}>
                      <div style={{ width: 14, height: 14, borderRadius: 3, background: i === 0 ? 'rgba(255,255,255,0.3)' : '#1e293b' }} />
                      <div style={{ height: 7, width: 60, background: i === 0 ? 'rgba(255,255,255,0.4)' : '#1e293b', borderRadius: 3 }} />
                    </div>
                  ))}
                </div>

                {/* Contenido */}
                <div>
                  {/* Métricas */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 16 }}>
                    {[
                      { label: 'Clientes', val: '248', color: '#3b82f6' },
                      { label: 'Órdenes', val: '32', color: '#22c55e' },
                      { label: 'Cotizaciones', val: '8', color: '#f59e0b' },
                      { label: 'Ingresos', val: '$48K', color: '#a855f7' },
                    ].map(m => (
                      <div key={m.label} style={{ background: '#060e1a', borderRadius: 10, padding: 12 }}>
                        <div style={{ fontSize: 10, color: '#475569', marginBottom: 4 }}>{m.label}</div>
                        <div style={{ fontSize: 18, fontWeight: 800, color: m.color }}>{m.val}</div>
                      </div>
                    ))}
                  </div>

                  {/* Órdenes recientes */}
                  <div style={{ background: '#060e1a', borderRadius: 12, padding: 14 }}>
                    <div style={{ fontSize: 11, color: '#475569', marginBottom: 10, fontWeight: 600 }}>ÓRDENES RECIENTES</div>
                    {[
                      { nombre: 'Carlos Mendoza', estado: 'En proceso', color: '#3b82f6' },
                      { nombre: 'Ana García', estado: 'Listo', color: '#22c55e' },
                      { nombre: 'Roberto Silva', estado: 'Recibido', color: '#94a3b8' },
                    ].map(o => (
                      <div key={o.nombre} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#1e293b' }} />
                          <div style={{ height: 7, width: 90, background: '#1e293b', borderRadius: 3 }} />
                        </div>
                        <div style={{ fontSize: 10, color: o.color, background: `${o.color}22`, padding: '3px 8px', borderRadius: 999, fontWeight: 600 }}>{o.estado}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section id="por-que" style={{ padding: '80px 24px', borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#3b82f6', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>La realidad del mercado</p>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 900, letterSpacing: '-1px', lineHeight: 1.1 }}>
              El problema que TallerOS resuelve
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24 }}>
            {STATS.map((s, i) => (
              <div key={i} id={`stat-${i}`} data-animate style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 20,
                padding: 28,
                transition: 'all 0.6s ease',
                transitionDelay: `${i * 100}ms`,
                opacity: isVisible(`stat-${i}`) ? 1 : 0,
                transform: isVisible(`stat-${i}`) ? 'translateY(0)' : 'translateY(20px)',
              }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: `${s.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                  <s.icon size={20} color={s.color} />
                </div>
                <div style={{ fontSize: 44, fontWeight: 900, color: s.color, letterSpacing: '-2px', lineHeight: 1, marginBottom: 8 }}>{s.valor}</div>
                <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.5 }}>{s.texto}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DIFERENCIADORES */}
      <section id="caracteristicas" style={{ padding: '100px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 72 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#3b82f6', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>Por qué los mejores talleres nos eligen</p>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 900, letterSpacing: '-1.5px', lineHeight: 1.1, marginBottom: 16 }}>
              6 herramientas que transforman<br />tu taller en 30 días
            </h2>
            <p style={{ fontSize: 16, color: '#64748b', maxWidth: 520, margin: '0 auto' }}>
              Cada función resuelve un problema real que cuesta clientes y dinero todos los días.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
            {DIFERENCIADORES.map((d, i) => (
              <div key={i} id={`dif-${i}`} data-animate style={{
                background: d.bg,
                border: `1px solid ${d.color}30`,
                borderRadius: 24,
                padding: 32,
                transition: 'all 0.6s ease',
                transitionDelay: `${i * 80}ms`,
                opacity: isVisible(`dif-${i}`) ? 1 : 0,
                transform: isVisible(`dif-${i}`) ? 'translateY(0)' : 'translateY(30px)',
                cursor: 'default',
              }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLElement
                  el.style.transform = 'translateY(-4px)'
                  el.style.borderColor = `${d.color}60`
                  el.style.boxShadow = `0 20px 40px ${d.color}20`
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLElement
                  el.style.transform = 'translateY(0)'
                  el.style.borderColor = `${d.color}30`
                  el.style.boxShadow = 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
                  <div style={{ width: 52, height: 52, borderRadius: 16, background: `${d.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <d.icono size={24} color={d.color} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: d.color, background: `${d.color}15`, padding: '4px 10px', borderRadius: 999 }}>
                    {d.stat}
                  </span>
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 800, color: '#f1f5f9', marginBottom: 10, letterSpacing: '-0.3px' }}>{d.titulo}</h3>
                <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.7 }}>{d.descripcion}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRECIOS */}
      <section id="precios" style={{ padding: '100px 24px', background: 'rgba(255,255,255,0.02)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#3b82f6', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>Precios</p>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 900, letterSpacing: '-1.5px', lineHeight: 1.1, marginBottom: 16 }}>
              Sin sorpresas. Sin letra chica.
            </h2>
            <p style={{ fontSize: 16, color: '#64748b', marginBottom: 32 }}>14 días gratis en cualquier plan. Sin tarjeta de crédito.</p>

            {/* Toggle */}
            <div style={{ display: 'inline-flex', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: 4 }}>
              {['Mensual', 'Anual'].map((label, i) => (
                <button key={label} onClick={() => setAnual(i === 1)} style={{
                  padding: '8px 24px', borderRadius: 9, fontSize: 14, fontWeight: 600, cursor: 'pointer', border: 'none',
                  background: (i === 1) === anual ? '#1d4ed8' : 'transparent',
                  color: (i === 1) === anual ? '#fff' : '#64748b',
                  transition: 'all 0.2s',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  {label}
                  {i === 1 && <span style={{ fontSize: 11, background: '#22c55e', color: '#fff', padding: '1px 6px', borderRadius: 999, fontWeight: 700 }}>-20%</span>}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
            {PLANES.map((plan, i) => (
              <div key={plan.nombre} style={{
                background: plan.popular ? `linear-gradient(135deg, ${plan.bg}, #0d0a1a)` : plan.bg,
                border: `2px solid ${plan.popular ? plan.border : plan.border + '60'}`,
                borderRadius: 28,
                padding: 40,
                position: 'relative',
                boxShadow: plan.popular ? `0 0 60px ${plan.color}25` : 'none',
              }}>
                {plan.popular && (
                  <div style={{
                    position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)',
                    background: `linear-gradient(135deg, #7c3aed, #a855f7)`,
                    color: '#fff', fontSize: 12, fontWeight: 800, padding: '4px 16px', borderRadius: 999,
                    letterSpacing: 1, textTransform: 'uppercase',
                  }}>
                    Más popular
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 14, background: `${plan.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <plan.icono size={22} color={plan.color} />
                  </div>
                  <h3 style={{ fontSize: 22, fontWeight: 800, color: '#fff' }}>{plan.nombre}</h3>
                </div>

                <div style={{ marginBottom: 8 }}>
                  <span style={{ fontSize: 56, fontWeight: 900, color: plan.color, letterSpacing: '-2px' }}>
                    ${anual ? plan.precio_anual : plan.precio_mensual}
                  </span>
                  <span style={{ fontSize: 16, color: '#475569' }}>/mes</span>
                </div>
                {anual && (
                  <p style={{ fontSize: 13, color: '#64748b', marginBottom: 24 }}>${plan.total_anual} facturado anualmente</p>
                )}

                <div style={{ height: 1, background: `${plan.color}20`, margin: '24px 0' }} />

                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {plan.features.map(f => (
                    <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 14, color: '#94a3b8' }}>
                      <div style={{ width: 20, height: 20, borderRadius: 6, background: `${plan.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                        <Check size={12} color={plan.color} strokeWidth={3} />
                      </div>
                      {f}
                    </li>
                  ))}
                </ul>

                <a href="/registro" style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  background: plan.popular ? `linear-gradient(135deg, #7c3aed, #a855f7)` : `linear-gradient(135deg, #1d4ed8, #3b82f6)`,
                  color: '#fff', fontSize: 15, fontWeight: 700, textDecoration: 'none',
                  padding: '14px 24px', borderRadius: 14,
                  boxShadow: `0 8px 24px ${plan.color}40`,
                  transition: 'all 0.2s',
                }}>
                  Empezar prueba gratis
                  <ArrowRight size={16} />
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section style={{ padding: '100px 24px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(29,78,216,0.15), rgba(124,58,237,0.15))',
            border: '1px solid rgba(59,130,246,0.2)',
            borderRadius: 32,
            padding: '72px 48px',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', top: -100, right: -100, width: 300, height: 300, background: 'radial-gradient(circle, rgba(59,130,246,0.15), transparent)', borderRadius: '50%' }} />
            <div style={{ position: 'absolute', bottom: -80, left: -80, width: 250, height: 250, background: 'radial-gradient(circle, rgba(124,58,237,0.15), transparent)', borderRadius: '50%' }} />

            <div style={{ position: 'relative' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🚀</div>
              <h2 style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 900, letterSpacing: '-1.5px', lineHeight: 1.1, marginBottom: 16 }}>
                Tu taller merece crecer.<br />Empieza hoy.
              </h2>
              <p style={{ fontSize: 18, color: '#64748b', marginBottom: 40, lineHeight: 1.6 }}>
                Únete a los talleres que ya digitalizaron su operación con TallerOS. 14 días gratis, sin tarjeta de crédito.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'center' }}>
                <a href="/registro" style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)',
                  color: '#fff', fontSize: 16, fontWeight: 700, textDecoration: 'none',
                  padding: '16px 36px', borderRadius: 14,
                  boxShadow: '0 0 40px rgba(59,130,246,0.5)',
                }}>
                  Crear mi taller gratis
                  <ArrowRight size={18} />
                </a>
                <a href="/login" style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                  color: '#fff', fontSize: 16, fontWeight: 600, textDecoration: 'none',
                  padding: '16px 32px', borderRadius: 14,
                }}>
                  Ya tengo cuenta
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '40px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
            </div>
            <span style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>Taller<span style={{ color: '#3b82f6' }}>OS</span></span>
          </div>
          <p style={{ fontSize: 13, color: '#334155' }}>© 2026 TallerOS. Gestión inteligente para talleres mecánicos en LATAM.</p>
          <div style={{ display: 'flex', gap: 24 }}>
            {['Privacidad', 'Términos', 'Soporte'].map(l => (
              <a key={l} href="#" style={{ fontSize: 13, color: '#475569', textDecoration: 'none' }}>{l}</a>
            ))}
          </div>
        </div>
      </footer>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        @media (max-width: 768px) {
          .nav-links { display: none !important; }
        }
      `}</style>
    </div>
  )
}