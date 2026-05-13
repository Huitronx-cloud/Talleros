'use client'

import { useMonedaLocal } from '@/hooks/useMonedaLocal'
export const dynamic = 'force-dynamic'

import { useState, useEffect, useRef } from 'react'
import {
  MessageCircle, Camera, Monitor, Shield, Bell, Star,
  ChevronRight, Check, Menu, X, Zap, ArrowRight,
  TrendingUp, Users, Clock, AlertTriangle
} from 'lucide-react'

const DIFERENCIADORES = [
  {
    icono: MessageCircle, color: '#22c55e', bg: '#052e16',
    titulo: 'Aprobación por WhatsApp',
    descripcion: 'Tu cliente aprueba o rechaza reparaciones desde su celular. Sin llamadas perdidas, sin malentendidos. Todo queda registrado.',
    stat: '3x más aprobaciones',
  },
  {
    icono: Camera, color: '#3b82f6', bg: '#0c1a35',
    titulo: 'Fotos del diagnóstico',
    descripcion: 'Documenta el estado del vehículo con fotos antes de tocar nada. Elimina disputas sobre daños preexistentes para siempre.',
    stat: '0 disputas documentadas',
  },
  {
    icono: Monitor, color: '#a855f7', bg: '#1a0535',
    titulo: 'Portal del cliente en tiempo real',
    descripcion: 'Tu cliente ve el avance de su vehículo en vivo sin llamar al taller. Transparencia total que genera confianza automáticamente.',
    stat: '97% satisfacción',
  },
  {
    icono: Shield, color: '#f59e0b', bg: '#1c1002',
    titulo: 'Garantía digital',
    descripcion: 'Emite garantías digitales firmadas en cada entrega. Diferénciate de cualquier taller de la competencia al instante.',
    stat: '100% profesional',
  },
  {
    icono: Bell, color: '#06b6d4', bg: '#021520',
    titulo: 'Recordatorios automáticos',
    descripcion: 'TallerOS contacta a tus clientes cada 3-6 meses para su mantenimiento. Ingresos recurrentes sin esfuerzo de tu parte.',
    stat: '+40% retención',
  },
  {
    icono: Star, color: '#f97316', bg: '#1c0800',
    titulo: 'Reseñas en Google automáticas',
    descripcion: 'Al entregar un vehículo, TallerOS pide la reseña automáticamente. El 97% de los clientes lee reseñas antes de elegir taller.',
    stat: '5★ en Google',
  },
]

const PLANES = [
  {
    nombre: 'Esencial', precio_mensual: 24, precio_anual: 19, total_anual: 228,
    color: '#3b82f6', bg: '#0c1a35', border: '#1d4ed8', icono: Zap, popular: false,
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
    color: '#a855f7', bg: '#1a0535', border: '#7c3aed', icono: Star, popular: true,
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
  { valor: '+40%', texto: 'más ingresos con recordatorios automáticos', icon: TrendingUp, color: '#22c55e' },
]

export default function LandingPage() {
  const [menuAbierto, setMenuAbierto] = useState(false)
  const [anual, setAnual] = useState(false)
  const { convertir, cargando: cargandoMoneda } = useMonedaLocal()
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
        padding: '0 20px',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
          <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, overflow: 'hidden' }}>
              <img src="/icon-512.png" alt="TallerOS" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <span style={{ fontSize: 18, fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>
              Taller<span style={{ color: '#3b82f6' }}>OS</span>
            </span>
          </a>

          {/* Links desktop */}
          <div className="nav-links-desktop" style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
            {[['#caracteristicas', 'Características'], ['#precios', 'Precios'], ['#por-que', '¿Por qué TallerOS?']].map(([href, label]) => (
              <a key={href} href={href} style={{ color: '#94a3b8', fontSize: 14, fontWeight: 500, textDecoration: 'none' }}
                onMouseEnter={e => (e.target as HTMLElement).style.color = '#fff'}
                onMouseLeave={e => (e.target as HTMLElement).style.color = '#94a3b8'}>
                {label}
              </a>
            ))}
          </div>

          {/* Botones desktop */}
          <div className="nav-buttons-desktop" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <a href="/login" style={{ color: '#94a3b8', fontSize: 14, fontWeight: 500, textDecoration: 'none', padding: '8px 14px' }}>
              Iniciar sesión
            </a>
            <a href="/registro" style={{
              background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)',
              color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'none',
              padding: '9px 18px', borderRadius: 10,
              boxShadow: '0 0 20px rgba(59,130,246,0.4)',
            }}>
              Prueba gratis →
            </a>
          </div>

          {/* Botón hamburguesa móvil */}
          <button
            className="nav-menu-mobile"
            onClick={() => setMenuAbierto(!menuAbierto)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fff', padding: 4 }}
          >
            {menuAbierto ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Menú móvil */}
        {menuAbierto && (
          <div className="nav-menu-mobile" style={{
            background: 'rgba(5,10,18,0.98)',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            padding: '16px 20px 24px',
          }}>
            {[['#caracteristicas', 'Características'], ['#precios', 'Precios'], ['#por-que', '¿Por qué TallerOS?']].map(([href, label]) => (
              <a key={href} href={href} onClick={() => setMenuAbierto(false)} style={{
                display: 'block', color: '#94a3b8', fontSize: 16, fontWeight: 500,
                textDecoration: 'none', padding: '12px 0',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
              }}>
                {label}
              </a>
            ))}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
              <a href="/login" style={{
                textAlign: 'center', color: '#94a3b8', fontSize: 15, fontWeight: 500,
                textDecoration: 'none', padding: '12px',
                border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10,
              }}>
                Iniciar sesión
              </a>
              <a href="/registro" style={{
                textAlign: 'center',
                background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)',
                color: '#fff', fontSize: 15, fontWeight: 700, textDecoration: 'none',
                padding: '12px', borderRadius: 10,
              }}>
                Prueba gratis — 14 días
              </a>
            </div>
          </div>
        )}
      </nav>

      {/* HERO */}
      <section style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '100px 20px 60px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', top: '10%', left: '15%', width: 500, height: 500, background: 'radial-gradient(circle, rgba(29,78,216,0.15) 0%, transparent 70%)', borderRadius: '50%' }} />
          <div style={{ position: 'absolute', bottom: '10%', right: '10%', width: 400, height: 400, background: 'radial-gradient(circle, rgba(124,58,237,0.1) 0%, transparent 70%)', borderRadius: '50%' }} />
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }} />
        </div>

        <div style={{ maxWidth: 860, margin: '0 auto', textAlign: 'center', position: 'relative', width: '100%' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 999, padding: '6px 16px', marginBottom: 28 }}>
            <div style={{ width: 8, height: 8, background: '#22c55e', borderRadius: '50%', boxShadow: '0 0 8px #22c55e' }} />
            <span style={{ fontSize: 12, color: '#93c5fd', fontWeight: 600 }}>Gestión inteligente para talleres en LATAM</span>
          </div>

          <h1 style={{ fontSize: 'clamp(32px, 7vw, 76px)', fontWeight: 900, lineHeight: 1.05, letterSpacing: '-2px', marginBottom: 20 }}>
            Tu taller merece ser{' '}
            <span style={{ background: 'linear-gradient(135deg, #3b82f6, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              el más confiable
            </span>{' '}
            de la ciudad
          </h1>

          <p style={{ fontSize: 'clamp(15px, 2vw, 19px)', color: '#94a3b8', lineHeight: 1.7, maxWidth: 600, margin: '0 auto 36px' }}>
            TallerOS digitaliza tu taller mecánico con aprobaciones por WhatsApp, portal del cliente en tiempo real y reseñas automáticas en Google.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center', marginBottom: 48 }} className="hero-ctas">
            <a href="/registro" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)',
              color: '#fff', fontSize: 16, fontWeight: 700, textDecoration: 'none',
              padding: '14px 28px', borderRadius: 14,
              boxShadow: '0 0 40px rgba(59,130,246,0.5)',
              width: '100%', maxWidth: 360, justifyContent: 'center',
            }}>
              Empieza gratis — 14 días sin tarjeta
              <ArrowRight size={18} />
            </a>
            <a href="#caracteristicas" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
              color: '#fff', fontSize: 15, fontWeight: 600, textDecoration: 'none',
              padding: '13px 28px', borderRadius: 14,
              width: '100%', maxWidth: 360, justifyContent: 'center',
            }}>
              Ver características
            </a>
          </div>

          {/* Mock dashboard — oculto en móvil muy pequeño */}
          <div className="hero-dashboard" style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 20,
            padding: '2px',
            boxShadow: '0 40px 80px rgba(0,0,0,0.6)',
            maxWidth: 800,
            margin: '0 auto',
          }}>
            <div style={{ background: '#0a1628', borderRadius: 18, padding: 16, textAlign: 'left' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444' }} />
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#f59e0b' }} />
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#22c55e' }} />
                <div style={{ flex: 1, background: 'rgba(255,255,255,0.05)', borderRadius: 6, padding: '3px 10px', marginLeft: 6 }}>
                  <span style={{ fontSize: 10, color: '#475569' }}>tallerosapp.com/dashboard</span>
                </div>
              </div>

              {/* Dashboard simulado — stack en móvil */}
              <div className="dashboard-grid" style={{ display: 'grid', gap: 12, minHeight: 200 }}>
                {/* Métricas */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }} className="metrics-grid">
                  {[
                    { label: 'Clientes', val: '248', color: '#3b82f6' },
                    { label: 'Órdenes', val: '32', color: '#22c55e' },
                    { label: 'Cotizaciones', val: '8', color: '#f59e0b' },
                    { label: 'Ingresos', val: '$48K', color: '#a855f7' },
                  ].map(m => (
                    <div key={m.label} style={{ background: '#060e1a', borderRadius: 10, padding: 10 }}>
                      <div style={{ fontSize: 9, color: '#475569', marginBottom: 3 }}>{m.label}</div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: m.color }}>{m.val}</div>
                    </div>
                  ))}
                </div>

                {/* Órdenes recientes */}
                <div style={{ background: '#060e1a', borderRadius: 12, padding: 12 }}>
                  <div style={{ fontSize: 10, color: '#475569', marginBottom: 8, fontWeight: 600 }}>ÓRDENES RECIENTES</div>
                  {[
                    { nombre: 'Carlos Mendoza', estado: 'En proceso', color: '#3b82f6' },
                    { nombre: 'Ana García', estado: 'Listo', color: '#22c55e' },
                    { nombre: 'Roberto Silva', estado: 'Recibido', color: '#94a3b8' },
                  ].map(o => (
                    <div key={o.nombre} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#1e293b', flexShrink: 0 }} />
                        <div style={{ height: 6, width: 70, background: '#1e293b', borderRadius: 3 }} />
                      </div>
                      <div style={{ fontSize: 9, color: o.color, background: `${o.color}22`, padding: '2px 7px', borderRadius: 999, fontWeight: 600, whiteSpace: 'nowrap' }}>{o.estado}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section id="por-que" style={{ padding: '60px 20px', borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#3b82f6', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10 }}>La realidad del mercado</p>
            <h2 style={{ fontSize: 'clamp(24px, 4vw, 44px)', fontWeight: 900, letterSpacing: '-1px', lineHeight: 1.1 }}>
              El problema que TallerOS resuelve
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            {STATS.map((s, i) => (
              <div key={i} id={`stat-${i}`} data-animate style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 20,
                padding: 24,
                transition: 'all 0.6s ease',
                transitionDelay: `${i * 100}ms`,
                opacity: isVisible(`stat-${i}`) ? 1 : 0,
                transform: isVisible(`stat-${i}`) ? 'translateY(0)' : 'translateY(20px)',
              }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: `${s.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                  <s.icon size={18} color={s.color} />
                </div>
                <div style={{ fontSize: 'clamp(32px, 6vw, 44px)', fontWeight: 900, color: s.color, letterSpacing: '-2px', lineHeight: 1, marginBottom: 8 }}>{s.valor}</div>
                <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>{s.texto}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DIFERENCIADORES */}
      <section id="caracteristicas" style={{ padding: '80px 20px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#3b82f6', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10 }}>Por qué los mejores talleres nos eligen</p>
            <h2 style={{ fontSize: 'clamp(24px, 4vw, 44px)', fontWeight: 900, letterSpacing: '-1.5px', lineHeight: 1.1, marginBottom: 14 }}>
              6 herramientas que transforman tu taller en 30 días
            </h2>
            <p style={{ fontSize: 15, color: '#64748b', maxWidth: 500, margin: '0 auto' }}>
              Cada función resuelve un problema real que cuesta clientes y dinero todos los días.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            {DIFERENCIADORES.map((d, i) => (
              <div key={i} id={`dif-${i}`} data-animate style={{
                background: d.bg,
                border: `1px solid ${d.color}30`,
                borderRadius: 20,
                padding: 28,
                transition: 'all 0.6s ease',
                transitionDelay: `${i * 80}ms`,
                opacity: isVisible(`dif-${i}`) ? 1 : 0,
                transform: isVisible(`dif-${i}`) ? 'translateY(0)' : 'translateY(30px)',
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 14, background: `${d.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <d.icono size={22} color={d.color} />
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: d.color, background: `${d.color}15`, padding: '4px 10px', borderRadius: 999 }}>
                    {d.stat}
                  </span>
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: '#f1f5f9', marginBottom: 8 }}>{d.titulo}</h3>
                <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.7 }}>{d.descripcion}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRECIOS */}
      <section id="precios" style={{ padding: '80px 20px', background: 'rgba(255,255,255,0.02)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#3b82f6', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10 }}>Precios</p>
            <h2 style={{ fontSize: 'clamp(24px, 4vw, 44px)', fontWeight: 900, letterSpacing: '-1.5px', lineHeight: 1.1, marginBottom: 12 }}>
              Sin sorpresas. Sin letra chica.
            </h2>
            <p style={{ fontSize: 15, color: '#64748b', marginBottom: 28 }}>14 días gratis en cualquier plan. Sin tarjeta de crédito.</p>
            <p style={{ fontSize: 13, color: '#475569', marginBottom: 20 }}>Precios en USD</p>

            <div style={{ display: 'inline-flex', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: 4 }}>
              {['Mensual', 'Anual'].map((label, i) => (
                <button key={label} onClick={() => setAnual(i === 1)} style={{
                  padding: '8px 20px', borderRadius: 9, fontSize: 14, fontWeight: 600, cursor: 'pointer', border: 'none',
                  background: (i === 1) === anual ? '#1d4ed8' : 'transparent',
                  color: (i === 1) === anual ? '#fff' : '#64748b',
                  transition: 'all 0.2s',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  {label}
                  {i === 1 && <span style={{ fontSize: 10, background: '#22c55e', color: '#fff', padding: '1px 5px', borderRadius: 999, fontWeight: 700 }}>-20%</span>}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            {PLANES.map((plan) => (
              <div key={plan.nombre} style={{
                background: plan.popular ? `linear-gradient(135deg, ${plan.bg}, #0d0a1a)` : plan.bg,
                border: `2px solid ${plan.popular ? plan.border : plan.border + '60'}`,
                borderRadius: 24,
                padding: 32,
                position: 'relative',
                boxShadow: plan.popular ? `0 0 60px ${plan.color}25` : 'none',
              }}>
                {plan.popular && (
                  <div style={{
                    position: 'absolute', top: -13, left: '50%', transform: 'translateX(-50%)',
                    background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                    color: '#fff', fontSize: 11, fontWeight: 800, padding: '4px 14px', borderRadius: 999,
                    letterSpacing: 1, textTransform: 'uppercase', whiteSpace: 'nowrap',
                  }}>
                    Más popular
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: `${plan.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <plan.icono size={20} color={plan.color} />
                  </div>
                  <h3 style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>{plan.nombre}</h3>
                </div>

                <div style={{ marginBottom: 6 }}>
                  <span style={{ fontSize: 'clamp(40px, 8vw, 52px)', fontWeight: 900, color: plan.color, letterSpacing: '-2px' }}>
                    ${anual ? plan.precio_anual : plan.precio_mensual} USD
                  </span>
                  <span style={{ fontSize: 14, color: '#475569' }}>/mes</span>
                </div>
                {!cargandoMoneda && convertir(anual ? plan.precio_anual : plan.precio_mensual) && (
                  <p style={{ fontSize: 13, color: '#64748b', marginBottom: 8 }}>
                    {convertir(anual ? plan.precio_anual : plan.precio_mensual)} al mes
                  </p>
                )}
                {anual && (
                  <p style={{ fontSize: 12, color: '#64748b', marginBottom: 20 }}>
                    ${plan.total_anual} USD facturado anualmente
                    {!cargandoMoneda && convertir(plan.total_anual) && (
                      <span style={{ color: '#475569' }}> ({convertir(plan.total_anual)})</span>
                    )}
                  </p>
                )}

                <div style={{ height: 1, background: `${plan.color}20`, margin: '20px 0' }} />

                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {plan.features.map(f => (
                    <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 14, color: '#94a3b8' }}>
                      <div style={{ width: 18, height: 18, borderRadius: 5, background: `${plan.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                        <Check size={11} color={plan.color} strokeWidth={3} />
                      </div>
                      {f}
                    </li>
                  ))}
                </ul>

                <a href="/registro" style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  background: plan.popular ? 'linear-gradient(135deg, #7c3aed, #a855f7)' : 'linear-gradient(135deg, #1d4ed8, #3b82f6)',
                  color: '#fff', fontSize: 15, fontWeight: 700, textDecoration: 'none',
                  padding: '13px 20px', borderRadius: 12,
                  boxShadow: `0 8px 24px ${plan.color}40`,
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
      <section style={{ padding: '80px 20px' }}>
        <div style={{ maxWidth: 760, margin: '0 auto', textAlign: 'center' }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(29,78,216,0.15), rgba(124,58,237,0.15))',
            border: '1px solid rgba(59,130,246,0.2)',
            borderRadius: 28,
            padding: 'clamp(32px, 6vw, 64px) clamp(20px, 5vw, 48px)',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', top: -80, right: -80, width: 240, height: 240, background: 'radial-gradient(circle, rgba(59,130,246,0.15), transparent)', borderRadius: '50%' }} />
            <div style={{ position: 'relative' }}>
              <div style={{ fontSize: 40, marginBottom: 14 }}>🚀</div>
              <h2 style={{ fontSize: 'clamp(24px, 4vw, 44px)', fontWeight: 900, letterSpacing: '-1.5px', lineHeight: 1.1, marginBottom: 14 }}>
                Tu taller merece crecer. Empieza hoy.
              </h2>
              <p style={{ fontSize: 'clamp(14px, 2vw, 17px)', color: '#64748b', marginBottom: 36, lineHeight: 1.6 }}>
                Únete a los talleres que ya digitalizaron su operación. 14 días gratis, sin tarjeta de crédito.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
                <a href="/registro" style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)',
                  color: '#fff', fontSize: 15, fontWeight: 700, textDecoration: 'none',
                  padding: '14px 28px', borderRadius: 12,
                  boxShadow: '0 0 40px rgba(59,130,246,0.5)',
                  width: '100%', maxWidth: 320, justifyContent: 'center',
                }}>
                  Crear mi taller gratis <ArrowRight size={17} />
                </a>
                <a href="/login" style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                  color: '#fff', fontSize: 15, fontWeight: 600, textDecoration: 'none',
                  padding: '13px 28px', borderRadius: 12,
                  width: '100%', maxWidth: 320, justifyContent: 'center',
                }}>
                  Ya tengo cuenta
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '32px 20px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, overflow: 'hidden' }}>
              <img src="/icon-512.png" alt="TallerOS" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <span style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>Taller<span style={{ color: '#3b82f6' }}>OS</span></span>
          </div>
          <p style={{ fontSize: 12, color: '#334155', textAlign: 'center' }}>© 2026 TallerOS. Gestión inteligente para talleres en LATAM.</p>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            {[
              { label: 'Privacidad', href: '/privacidad' },
              { label: 'Términos', href: '/terminos' },
              { label: 'Soporte', href: 'mailto:hola@tallerosapp.com' },
            ].map(l => (
              <a key={l.label} href={l.href} style={{ fontSize: 13, color: '#475569', textDecoration: 'none' }}>{l.label}</a>
            ))}
          </div>
        </div>
      </footer>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        
        .nav-links-desktop { display: flex !important; }
        .nav-buttons-desktop { display: flex !important; }
        .nav-menu-mobile { display: none !important; }
        .dashboard-grid { grid-template-columns: 1fr; }
        .metrics-grid { grid-template-columns: repeat(4, 1fr) !important; }
        .hero-ctas { flex-direction: row !important; }

        @media (max-width: 768px) {
          .nav-links-desktop { display: none !important; }
          .nav-buttons-desktop { display: none !important; }
          .nav-menu-mobile { display: block !important; }
          .hero-ctas { flex-direction: column !important; align-items: stretch !important; }
          .metrics-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }

        @media (max-width: 480px) {
          .hero-dashboard { display: none !important; }
        }
      `}</style>
    </div>
  )
}