'use client'

import Image from 'next/image'

import { useState, useEffect, useRef } from 'react'
import {
  MessageCircle, Camera, Monitor, Shield, Bell, Star,
  Check, Menu, X, Zap, ArrowRight, TrendingUp, AlertTriangle,
  ChevronRight, Users, FileText, BarChart2, Calendar, Package,
} from 'lucide-react'
import { PREGUNTAS } from './preguntas'
import { PLANES_WEB } from '@/lib/planes-web'
import { useMonedaLocal } from '@/hooks/useMonedaLocal'
import { textosPlan } from '@/lib/precios'

const HF = {
  mechanic1:  'https://d8j0ntlcm91z4.cloudfront.net/user_3Db18pZKAxWF2uKESaKQVcyRlzv/hf_20260519_184811_0f52f642-6922-4609-9046-e009d73138b4.png',
  mechanic2:  'https://d8j0ntlcm91z4.cloudfront.net/user_3Db18pZKAxWF2uKESaKQVcyRlzv/hf_20260519_184349_16c9b69d-2d67-4b5b-99b3-25d2b62c6d3b.png',
  dashboard1: 'https://d8j0ntlcm91z4.cloudfront.net/user_3Db18pZKAxWF2uKESaKQVcyRlzv/hf_20260519_184142_cc40286e-f4a6-4479-a924-f167c62f235e.png',
  dashboard2: 'https://d8j0ntlcm91z4.cloudfront.net/user_3Db18pZKAxWF2uKESaKQVcyRlzv/hf_20260519_184033_46793d22-18c0-4fa4-8daa-fd6deb2dd8aa.png',
  phone1:     'https://d8j0ntlcm91z4.cloudfront.net/user_3Db18pZKAxWF2uKESaKQVcyRlzv/hf_20260519_183932_cc8b0dfe-7173-4724-aa8a-39e1c97bf356.png',
  phone2:     'https://d8j0ntlcm91z4.cloudfront.net/user_3Db18pZKAxWF2uKESaKQVcyRlzv/hf_20260519_183753_5956a2fa-6e70-4d2e-ab06-5b7ea13c4cff.png',
  team1:      'https://d8j0ntlcm91z4.cloudfront.net/user_3Db18pZKAxWF2uKESaKQVcyRlzv/hf_20260519_181653_a084ec2c-01f0-4232-8e6d-16a667a67bc2.png',
  team2:      'https://d8j0ntlcm91z4.cloudfront.net/user_3Db18pZKAxWF2uKESaKQVcyRlzv/hf_20260519_181641_f2ef75f8-4a84-4610-920b-57652e3e8902.png',
  workshop1:  'https://d8j0ntlcm91z4.cloudfront.net/user_3Db18pZKAxWF2uKESaKQVcyRlzv/hf_20260511_220758_b7712631-4110-4c3f-957e-72ab663637d1.png',
  workshop2:  'https://d8j0ntlcm91z4.cloudfront.net/user_3Db18pZKAxWF2uKESaKQVcyRlzv/hf_20260511_215520_8ea44117-7ad2-4f97-8cdb-859933e3c6ed.png',
  workshop3:  'https://d8j0ntlcm91z4.cloudfront.net/user_3Db18pZKAxWF2uKESaKQVcyRlzv/hf_20260511_215520_d1be0adb-34fa-4778-b7dc-2a751c06cf81.png',
  customer:   'https://d8j0ntlcm91z4.cloudfront.net/user_3Db18pZKAxWF2uKESaKQVcyRlzv/hf_20260511_214800_5b02a596-5e02-4cd0-81bd-30fd64857c9e.png',
  customer2:  'https://d8j0ntlcm91z4.cloudfront.net/user_3Db18pZKAxWF2uKESaKQVcyRlzv/hf_20260511_214800_1d2f68f3-5de2-42b8-be93-a9eabce2d4c1.png',
}

const DIFERENCIADORES = [
  { icon: MessageCircle, img: '/feat-1-whatsapp.png',      tag: '3x más aprobaciones', titulo: 'Aprobación por WhatsApp',   desc: 'Le mandas la cotización por WhatsApp. El cliente aprueba con un toque. Sin llamadas, sin "ya ahorita te confirmo" que nunca llega. Todo queda registrado.',        url: '/registro' },
  { icon: Bell,          img: '/feat-5-recordatorios.png', tag: '+40% retención',       titulo: 'Clientes que regresan solos', desc: 'TallerOS les manda un WhatsApp a tus clientes a los 3 o 6 meses: "Ya es tiempo de mantenimiento". Sin que hagas nada. Sin que se te olvide. Ingresos recurrentes sin esfuerzo.', url: '/registro' },
  { icon: Monitor,       img: '/feat-3-portal.png',        tag: '90% menos llamadas',   titulo: 'El cliente ve su carro en vivo', desc: 'En vez de llamarte 5 veces al día, tu cliente entra a un portal y ve exactamente en qué paso está su vehículo. Se acabaron las interrupciones cuando estás trabajando.', url: '/demo' },
  { icon: Camera,        img: '/feat-2-diagnostico.png',   tag: '0 disputas',           titulo: 'Fotos del diagnóstico',     desc: 'Toma fotos del vehículo al recibirlo. Quedan guardadas con fecha y hora. Si un cliente dice que le rompiste algo, muestras la evidencia. Fin de la discusión.',      url: '/registro' },
  { icon: Star,          img: '/feat-6-resenas.png',       tag: '5★ en Google',         titulo: 'Reseñas en Google automáticas', desc: 'Al entregar el vehículo, TallerOS le manda un mensaje al cliente pidiéndole su reseña. El 97% de personas busca reseñas antes de elegir un taller. Las tuyas crecen solas.', url: '/registro' },
  { icon: Shield,        img: '/feat-4-garantia.png',      tag: '100% profesional',     titulo: 'Garantía digital firmada',  desc: 'Emite una garantía digital que el cliente firma desde su celular al recoger el carro. Queda registrada. Si hay un reclamo después, tienes el documento.', url: '/registro' },
]

const MODULOS = [
  { icon: FileText, label: 'Órdenes de trabajo',   desc: 'Crea y sigue cada orden en tiempo real.', color: '#3b82f6' },
  { icon: Users,    label: 'Clientes y vehículos', desc: 'Historial completo de cada cliente.',     color: '#06b6d4' },
  { icon: Calendar, label: 'Citas y agenda',        desc: 'Organiza sin conflictos de horario.',     color: '#ec4899' },
  { icon: Package,  label: 'Inventario',            desc: 'Controla refacciones sin desabasto.',     color: '#f59e0b' },
  { icon: BarChart2,label: 'Reportes',              desc: 'Ingresos y rendimiento por mecánico.',    color: '#a855f7' },
]

const TESTIMONIALES = [
  { texto: 'Antes recibía 15-20 llamadas al día de clientes preguntando por su carro. Desde TallerOS bajó a 2 o 3. Recuperé casi 2 horas diarias para trabajar.', nombre: 'Roberto Garza',    rol: 'Taller Garza, Monterrey MX',  color: '#2563eb', estrellas: 5 },
  { texto: 'Las aprobaciones por WhatsApp cambiaron todo. Antes perdíamos trabajos porque el cliente no contestaba el teléfono. Ahora aprueba en segundos y queda registrado.',                   nombre: 'Camila Restrepo', rol: 'AutoFix, Medellín CO',         color: '#7c3aed', estrellas: 5 },
  { texto: 'Los recordatorios automáticos me trajeron 8 clientes en el primer mes que no habían venido en más de un año. Es como tener un vendedor trabajando 24/7 sin pagarle extra.',             nombre: 'Miguel Quispe',   rol: 'Mecánica Quispe, Lima PE',     color: '#059669', estrellas: 5 },
]


const STATS_DATA = [
  { valor: '63%',  texto: 'de clientes desconfía de talleres mecánicos', icon: AlertTriangle, color: '#ef4444' },
  { valor: '97%',  texto: 'lee reseñas antes de elegir un taller',        icon: Star,          color: '#f59e0b' },
  { valor: '#1',   texto: 'queja en LATAM: cobros no autorizados',        icon: MessageCircle, color: '#a855f7' },
  { valor: '+40%', texto: 'mas ingresos con recordatorios automáticos',   icon: TrendingUp,    color: '#06b6d4' },
]

const PLANES = PLANES_WEB

// "$100,800 COP" se parte en importe y código: el importe va grande y la
// moneda pequeña al lado, que es lo que evita que el precio desborde la caja.
function montoYmoneda(txt: string): [string, string] {
  const m = txt.match(/^(.*?)\s([A-Z]{3})$/)
  return m ? [m[1], m[2]] : [txt, '']
}

const MARQUEE = ['Aprobación por WhatsApp','Portal del cliente','Reseñas automáticas','Garantía digital','Fotos del diagnóstico','Recordatorios de mantenimiento','Multi-usuario','Tablero de trabajos en vivo','Cotizaciones profesionales','Historial de vehículo','Control de inventario','Reportes avanzados']


export default function LandingPage() {
  const [menuOpen, setMenuOpen]     = useState(false)
  const [anual, setAnual]           = useState(false)
  const [scrolled, setScrolled]     = useState(false)
  const [visible, setVisible]       = useState<Set<string>>(new Set())
  const [stats, setStats]           = useState({ hoy: 0, semana: 0, total: 0, ordenes: 0 })
  const [toast, setToast]           = useState(false)
  const obs = useRef<IntersectionObserver | null>(null)
  const { convertir, pais, cargando: cM } = useMonedaLocal()

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  useEffect(() => {
    fetch('/api/stats').then(r => r.json()).then(d => {
      setStats(d)
      if (d.hoy > 0 || d.semana > 0) { setTimeout(() => setToast(true), 4000); setTimeout(() => setToast(false), 10000) }
    }).catch(() => {})
  }, [])

  useEffect(() => {
    obs.current = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) setVisible(p => new Set([...p, e.target.id])) }),
      { threshold: 0.06 }
    )
    document.querySelectorAll('[data-animate]').forEach(el => obs.current?.observe(el))
    return () => obs.current?.disconnect()
  }, [])

  const isV = (id: string) => visible.has(id)

  return (
    <>
    <div className="lr">

    {/* TOAST */}
    {toast && (stats.hoy > 0 || stats.semana > 0) && (
      <div className="l-toast">
        <span className="l-dot" />
        <span className="l-toast-t">
          {stats.hoy > 0
            ? `${stats.hoy} taller${stats.hoy>1?'es':''} se registró hoy`
            : `${stats.semana} talleres registrados esta semana`}
        </span>
        <button className="l-toast-x" onClick={() => setToast(false)}>x</button>
      </div>
    )}

    {/* NAV */}
    <nav className={`ln${scrolled?' sc':''}`}>
      <div className="ln-i">
        <a href="/" className="ll">
          <Image src="/icon-512.png" alt="TallerOS" width={72} height={72} className="ll-img" />
          <span className="ll-t">Taller<em>OS</em></span>
        </a>
        <div className="ln-links">
          {[['#modulos','Módulos'],['#caracteristicas','Cómo funciona'],['#precios','Precios'],['#testimoniales','Clientes']].map(([href,label]) => (
            <a key={href} href={href} className="ln-a">{label}</a>
          ))}
        </div>
        <div className="ln-r">
          <a href="/login" className="ln-login">Iniciar sesión</a>
          <a href="/registro" className="ln-cta">Prueba gratis <ChevronRight size={14}/></a>
        </div>
        <button className="ln-ham" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
          {menuOpen ? <X size={22}/> : <Menu size={22}/>}
        </button>
      </div>
      {menuOpen && (
        <div className="ln-mob">
          {[['#modulos','Módulos'],['#caracteristicas','Cómo funciona'],['#precios','Precios'],['#testimoniales','Clientes'],['/blog','Blog']].map(([href,label]) => (
            <a key={href} href={href} className="ln-mob-a" onClick={() => setMenuOpen(false)}>{label}</a>
          ))}
          <div className="ln-mob-act">
            <a href="/login" className="ln-mob-login">Iniciar sesión</a>
            <a href="/registro" className="ln-mob-cta">Crear cuenta gratis</a>
          </div>
        </div>
      )}
    </nav>

    {/* HERO */}
    <section className="lh">
      <div className="lh-bg">
        <div className="lh-photo" style={{backgroundImage:`url('/hero-bg.png')`}} />
        <div className="lh-ov" />
        <div className="lh-grid" />
      </div>
      <div className="lh-inner">
        <div className="lh-left">
          <div className="ley">
            <span className="ley-dot" />
            Software de gestión para talleres mecánicos
          </div>
          <h1 className="lh1">
            Se acabaron las llamadas de<br/>
            <span className="ltw" style={{fontStyle:'italic'}}>&ldquo;¿Cómo va mi carro?&rdquo;</span>
          </h1>
          <p className="lh-sub">Tus clientes ven el estado en vivo y aprueban por WhatsApp. Tú cobras más rápido, no se te escapa un trabajo y los clientes regresan solos.</p>
          <div className="lh-ctas">
            <a href="/registro" className="lb-pri">Crear mi cuenta gratis <ArrowRight size={16}/></a>
            <a href="/demo" className="lb-out">Ver cómo lo ve el cliente</a>
          </div>
          <div className="ltrust">
            {['Sin tarjeta de crédito','14 días con todo abierto','Después sigues gratis','Cancela cuando quieras'].map(t => (
              <div key={t} className="ltrust-p"><Check size={11} strokeWidth={3} className="lck"/><span>{t}</span></div>
            ))}
            {stats.total > 0 && (
              <div className="ltrust-p" style={{color:'#94a3b8'}}>
                <Users size={11} className="lck" style={{color:'#94a3b8'}}/>
                <span>+{stats.total} talleres registrados</span>
              </div>
            )}
          </div>
        </div>
        <div className="lh-right">
          <div className="lmock">
            <Image src="/Gemini_Generated_Image_t2xuqlt2xuqlt2xu.png" alt="TallerOS Dashboard" width={895} height={1200} priority sizes="(max-width: 900px) 92vw, 44vw" className="lmock-s" />
            <div className="lfl lfl-wa">
              <div className="lfl-ic" style={{background:'#22c55e'}}><MessageCircle size={15} color="#fff"/></div>
              <div><p className="lfl-l">Cliente aprobó</p><p className="lfl-v">Cambio de frenos</p></div>
            </div>
            <div className="lfl lfl-rv">
              <div className="lfl-ic" style={{background:'#f59e0b'}}><Star size={15} color="#fff"/></div>
              <div><p className="lfl-l">Nueva reseña</p><p className="lfl-v">5 estrellas Google</p></div>
            </div>
          </div>
        </div>
      </div>
    </section>

    {/* MARQUEE */}
    <div className="lmq"><div className="lmq-t">{[...MARQUEE,...MARQUEE].map((item,i) => (<span key={i} className="lmq-i">{item}<span className="lmq-d">·</span></span>))}</div></div>

    {/* STATS */}
    <section className="ls lprob">
      <div className="li">
        <div className="lsl">El problema real</div>
        <h2 className="lsh2">Los números que tu competencia ignora</h2>
        <p className="lssub">No se trata de trabajar más horas. Se trata de que no se te escape el dinero que ya estás generando.</p>
        <div className="lstg">
          {STATS_DATA.map((s,i) => (
            <div key={i} id={`st-${i}`} data-animate className={`lstc${isV(`st-${i}`)?' v':''}`} style={{transitionDelay:`${i*80}ms`}}>
              <div className="lsti" style={{background:`${s.color}15`,border:`1px solid ${s.color}25`}}><s.icon size={22} style={{color:s.color}}/></div>
              <div className="lstn" style={{color:s.color}}>{s.valor}</div>
              <p className="lstxt">{s.texto}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* VERSUS */}
    <section className="lver">
      <div className="li">
        <div className="lver-w">
          <div className="lver-img">
            <img src={HF.mechanic2} alt="Sin sistema" loading="lazy" decoding="async" className="lvimg"/>
            <div className="lvimg-c bad">Sin TallerOS</div>
          </div>
          <div className="lver-cnt">
            <div className="lsl">Lo que cambia</div>
            <h2 className="lver-h2">Tu trabajo está bien hecho.<br/>Lo que se pierde es todo lo demás.</h2>
            <p className="lver-sub">El cliente aprueba, tú lo apuntas donde puedes y a fin de mes nadie sabe qué se cobró, qué falta por entregar ni quién no ha vuelto en un año. No es que trabajes mal: es que nada queda registrado.</p>
            <div className="lver-rows">
              {[
                ['Clientes llaman sin parar para preguntar por su carro','Portal en tiempo real - el cliente ve el avance solo'],
                ['Aprobaciones verbales que generan disputas','Aprobación por WhatsApp con registro digital'],
                ['Sin evidencia de daños preexistentes','Fotos del diagnóstico antes de tocar el vehículo'],
                ['Pierdes clientes que no regresan nunca','Recordatorios automáticos cada 3-6 meses'],
                ['Reseñas solo cuando algo sale mal','Reseña en Google solicitada automáticamente'],
              ].map(([bad,good],i) => (
                <div key={i} className="lvrow">
                  <div className="lvbad"><span className="lvx">x</span>{bad}</div>
                  <div className="lvgood"><span className="lvch">v</span>{good}</div>
                </div>
              ))}
            </div>
            <a href="/registro" className="lb-pri" style={{marginTop:'2rem',display:'inline-flex'}}>Crear mi cuenta gratis <ArrowRight size={16}/></a>
          </div>
        </div>
      </div>
    </section>

    {/* FEATURES */}
    <section id="caracteristicas" className="ls lfeat-s">
      <div className="li">
        <div className="lsl">Por qué nos eligen</div>
        <h2 className="lsh2">6 herramientas que transforman tu taller en 30 días</h2>
        <p className="lssub">Cada función resuelve un problema real que cuesta clientes y dinero todos los días.</p>
        <div className="lfg">
          {DIFERENCIADORES.map((d,i) => (
            <div key={i} id={`dif-${i}`} data-animate className={`lfc${isV(`dif-${i}`)?' v':''}`} style={{transitionDelay:`${i*70}ms`}}>
              <div className="lfc-iw">
                <Image src={d.img} alt={d.titulo} width={896} height={640} sizes="(max-width: 768px) 92vw, 30vw" className="lfc-img"/>
                <div className="lfc-iov"/>
                <span className="lfc-tag">{d.tag}</span>
              </div>
              <div className="lfc-b">
                <h3 className="lfc-t">{d.titulo}</h3>
                <p className="lfc-d">{d.desc}</p>
                <a href={d.url} className="lfc-lnk">Ver en acción <ArrowRight size={13}/></a>
              </div>
            </div>
          ))}
        </div>
        <div className="lmods-tira">
          <span className="lmods-lbl">Y además incluye</span>
          <div className="lmods-chips">
            {MODULOS.map((m,i) => (
              <span key={i} className="lmod-chip" title={m.desc}>
                <m.icon size={14} style={{color:m.color}}/>{m.label}
              </span>
            ))}
          </div>
        </div>
        <div className="lcta-c"><a href="/registro" className="lb-pri">Probar todas las funciones gratis <ArrowRight size={16}/></a></div>
      </div>
    </section>


    {/* GALLERY */}
    <section className="lgal">
      <div className="lgal-i">
        <div className="lgal-t">
          <h2 className="lgal-h2">Talleres como el tuyo ya dieron el salto</h2>
          <p className="lgal-sub">Dueños de taller en México, Colombia, Perú y toda Latinoamérica ya administran su negocio con TallerOS.</p>
          <a href="/registro" className="lb-pri">Unirme a ellos <ArrowRight size={16}/></a>
        </div>
        <div className="lgal-grid">
          {[
            { img:'/taller-garcia.png',   nombre:'Taller García',               ciudad:'Ciudad de México, MX' },
            { img:'/taller-herrera.png',  nombre:'Servicio Automotriz Herrera',  ciudad:'Guadalajara, MX'      },
            { img:'/taller-ramirez.png',  nombre:'Mecánica Automotriz Ramírez',  ciudad:'Bogotá, CO'           },
            { img:'/taller-vargas.png',   nombre:'Centro Automotriz Vargas',     ciudad:'Lima, PE'             },
          ].map((t,i) => (
            <div key={i} className="lgal-card">
              <Image src={t.img} alt={t.nombre} width={1024} height={1024} sizes="(max-width: 768px) 46vw, 23vw" className="lgal-card-img"/>
              <div className="lgal-card-info">
                <p className="lgal-card-name">{t.nombre}</p>
                <p className="lgal-card-city">{t.ciudad}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* TESTIMONIALES */}
    <section id="testimoniales" className="ls ltesti-s">
      <div className="li">
        <h2 className="lsh2">Lo que dicen nuestros clientes</h2>
        <div className="ltg">
          {TESTIMONIALES.map((t,i) => (
            <div key={i} id={`tes-${i}`} data-animate className={`ltc${isV(`tes-${i}`)?' v':''}`} style={{transitionDelay:`${i*100}ms`}}>
              <div className="ltc-b">
                <div className="lstr">{"★".repeat(t.estrellas)}</div>
                <p className="ltc-txt">"{t.texto}"</p>
                <div className="ltc-auth">
                  <div className="ltc-av" style={{background:t.color}}>{t.nombre.split(' ').map((n:string)=>n[0]).join('').slice(0,2)}</div>
                  <div><p className="ltc-n">{t.nombre}</p><p className="ltc-r">{t.rol}</p></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* PRECIOS */}
    <section id="precios" className="ls lprice-s">
      <div className="li">
        <div className="lsl">Cuesta menos que un servicio</div>
        <h2 className="lsh2">Sin sorpresas.<br/>Sin letra chica.</h2>
        <p className="lssub">Empiezas gratis y sigues gratis. Los primeros 14 días tienes todas las funciones desbloqueadas; después tu cuenta sigue abierta con el plan Gratuito.</p>
        <div className="ltog-w">
          <div className="ltog">
            {['Mensual','Anual'].map((label,i) => (
              <button key={label} onClick={() => setAnual(i===1)} className={`ltb${(i===1)===anual?' a':''}`}>
                {label}{i===1 && <span className="ltbadge">-20%</span>}
              </button>
            ))}
          </div>
        </div>
        <div className="lpg">
          {PLANES.map(plan => {
            const pa  = anual ? plan.precio_anual : plan.precio_mensual
            const por = anual ? plan.precio_original_anual : plan.precio_original_mensual
            // Los importes salen de `lib/precios.ts`, la misma tabla que decide
            // qué cobra Stripe. Antes se calculaban aquí con una tasa escrita a
            // mano, y por eso a un argentino se le enseñaba un 31% menos de lo
            // que se le iba a cobrar.
            const txt = textosPlan(plan.nombre, pais, anual)
            const pct = Math.round((1 - pa / por) * 100)
            return (
              <div key={plan.nombre} className={`lplan${plan.popular?' pop':''}${plan.nombre==='Esencial'?' esencial':''}`}>
                {plan.popular && <div className="lplan-b">Más popular</div>}
                <div className="lplan-h">
                  <div className="lplan-ic"><plan.icono size={22}/></div>
                  <h3 className="lplan-n">{plan.nombre}</h3>
                  {!plan.gratis && <span className="lplan-pct">-{pct}% hoy</span>}
                  {plan.gratis && <span className="lplan-free">Para siempre gratis</span>}
                </div>
                <p className="lplan-ideal">{plan.ideal}</p>
                <div className="lplan-pb">
                  {plan.gratis ? (
                    <div className="lplan-pr"><span className="lplan-num">$0</span><span className="lplan-per">/mes</span></div>
                  ) : (
                    <>
                      <div className="lplan-or">{montoYmoneda(txt ? txt.tachado : `$${por}`)[0]}</div>
                      <div className="lplan-pr">
                        <span className="lplan-num">{montoYmoneda(txt ? txt.principal : `$${pa}`)[0]}</span>
                        <span className="lplan-cur">{montoYmoneda(txt ? txt.principal : `$${pa}`)[1]}</span>
                        <span className="lplan-per">/mes</span>
                      </div>
                      {anual
                        ? <p className="lplan-an">{txt ? `${txt.anualTotal} al año` : ''}</p>
                        : <p className="lplan-an">Ahorras {!cM ? convertir(plan.precio_mensual*12 - plan.total_anual) : `$${plan.precio_mensual*12 - plan.total_anual} USD`} pagando al año</p>}
                      {/* Solo cuando el cobro va en dólares. Donde hay precio en
                          moneda local el número de arriba ES el cargo. */}
                      {txt?.enDolares && !cM && (
                        <p className="lplan-an" style={{opacity:.75}}>
                          Se cobra en dólares · ≈ {convertir(anual ? Math.round(plan.total_anual/12) : pa)}
                        </p>
                      )}
                    </>
                  )}
                </div>
                <ul className="lplan-fl">
                  {plan.features.map(f => (<li key={f}><span className="lfck"><Check size={11} strokeWidth={3}/></span>{f}</li>))}
                </ul>
                <a href="/registro" className={`lplan-cta${plan.popular?' pop':''}`}>
                  {plan.gratis ? 'Empezar gratis' : `Elegir ${plan.nombre}`} <ArrowRight size={15}/>
                </a>
                <p className="lplan-nt">
                  {plan.gratis
                    ? 'Sin tarjeta de crédito'
                    : 'Empiezas gratis. Sin permanencia, cancelas cuando quieras.'}
                </p>
              </div>
            )
          })}
        </div>
        {stats.total > 0 && (
        <div className="lproof">
          <div className="lpavs">
            {[HF.mechanic1, HF.customer, HF.team1, HF.workshop1].map((src,i) => (
              <img key={i} src={src} alt="" loading="lazy" decoding="async" className="lpav" style={{marginLeft:i===0?0:-10}}/>
            ))}
          </div>
          <p className="lproof-t"><strong>+{stats.total} talleres</strong> ya crearon su cuenta</p>
        </div>
        )}
      </div>
    </section>

    {/* ── 5 ERRORES ── */}
    <section className="llm">
      <div className="li">
        <div className="llm-solo">
          <div className="lsl" style={{textAlign:'center',color:'#93c5fd'}}>Para tener en cuenta</div>
          <h2 className="llm-h2" style={{textAlign:'center'}}>5 errores que le cuestan clientes a tu taller mecánico</h2>
          <p className="llm-sub" style={{textAlign:'center',maxWidth:'560px',margin:'0 auto 28px'}}>Si alguno de estos te suena familiar, TallerOS lo resuelve desde el primer día.</p>
          <ul className="llm-list llm-list-center">
            {['El cliente dice que le rompiste algo que ya estaba roto — y no tienes cómo probarlo','Aprobaste un trabajo de palabra y el cliente lo niega cuando llega la cuenta','Un cliente no regresa en 2 años y tú ni te acuerdas de él','Dejas de recibir clientes nuevos porque no tienes reseñas en Google','No sabes cuánto ganaste la semana pasada sin revisar papeles'].map((item,i) => (
              <li key={i} className="llm-item">
                <span className="llm-num">{String(i+1).padStart(2,'0')}</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <div style={{display:'flex',justifyContent:'center',marginTop:'2rem'}}>
            <a href="/registro" className="lb-pri">Crear mi cuenta gratis <ArrowRight size={16}/></a>
          </div>
        </div>
      </div>
    </section>

    {/* CTA FINAL */}
    <section className="lcta">
      <div className="lcta-bg" style={{backgroundImage:`url(${HF.workshop1})`}}/>
      <div className="lcta-ov"/>
      <div className="lcta-i">
        <div className="lsl" style={{color:'#93c5fd'}}>Empieza hoy</div>
        <h2 className="lcta-h2">Cada cliente que no regresa es dinero que se queda en la calle.</h2>
        <p className="lcta-sub">Sin tarjeta, sin contratos y sin fecha de vencimiento. Tu cuenta gratis no caduca.</p>
        <div className="lcta-bts">
          <a href="/registro" className="lb-pri">Crear mi cuenta gratis <ArrowRight size={16}/></a>
          <a href="/login" className="lb-wh">Ya tengo cuenta</a>
        </div>
      </div>
    </section>

    {/* PREGUNTAS FRECUENTES — responden las objeciones antes de la compra y
        alimentan el resultado enriquecido de Google (FAQPage). */}
    <section className="ls lfaq-s">
      <div className="li">
        <div className="lsl">Antes de que preguntes</div>
        <h2 className="lsh2">Lo que todos nos preguntan</h2>
        <div className="lfaq">
          {PREGUNTAS.map(({ p, r }) => (
            <details key={p} className="lfaq-i">
              <summary className="lfaq-q">{p}<span className="lfaq-ic" aria-hidden="true">+</span></summary>
              <p className="lfaq-r">{r}</p>
            </details>
          ))}
        </div>
      </div>
    </section>


    {/* FOOTER */}
    <footer className="lfoot">
      <div className="lfoot-i">
        <div className="lfoot-l"><Image src="/icon-512.png" alt="TallerOS" width={72} height={72} className="ll-img sm"/><span className="ll-t sm">Taller<em>OS</em></span></div>
        <p className="lfoot-c">2026 TallerOS. Gestión inteligente para talleres mecánicos en Latinoamérica.</p>
        <div className="lfoot-cols">
          <div className="lfoot-lnks">
            {[{l:'Blog',h:'/blog'},{l:'Privacidad',h:'/privacidad'},{l:'Términos',h:'/terminos'}].map(x => (<a key={x.l} href={x.h}>{x.l}</a>))}
          </div>
          <div className="lfoot-cont">
            <a href="https://wa.me/14284362377" target="_blank" rel="noopener noreferrer" className="lfoot-wa">
              <MessageCircle size={15}/> Soporte por WhatsApp
            </a>
            <a href="mailto:hola@tallerosapp.com" className="lfoot-mail">hola@tallerosapp.com</a>
          </div>
        </div>
      </div>
    </footer>

    {/* BARRA FLOTANTE MÓVIL */}
    <div className="lmobile-cta">
      <a href="/registro" className="lmobile-cta-btn">
        Crear mi cuenta gratis →
      </a>
      <p className="lmobile-cta-sub">Sin tarjeta · Cancela cuando quieras</p>
    </div>

    {/* El CSS va por dangerouslySetInnerHTML y no como hijo de texto: React
        escapa las comillas al renderizar en el servidor (" pasa a &quot;,
        ' a &#x27;), pero dentro de <style> el navegador no decodifica
        entidades. El texto del servidor y el del cliente no coincidían y
        React tiraba todo el HTML del servidor para repintar en el cliente.
        El contenido es una plantilla fija nuestra, sin datos de nadie. */}
    <style dangerouslySetInnerHTML={{ __html: `
      *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
      html{scroll-behavior:smooth;}
      :root{
        --ink:#0f172a;--ink2:#334155;--ink3:#4a5468;--ink4:#94a3b8;
        /* --muted se usaba en tres reglas sin estar definida: al ser una
           variable inválida, esos textos heredaban el color del padre en vez
           de atenuarse. La columna "Sin TallerOS" se veía igual de negra que
           la buena, que es justo lo contrario de lo que debía comunicar. */
        --muted:#6b7688;
        --blue:#2563eb;--blue-d:#1d4ed8;--green:#22c55e;
        /* Naranja de señal: reservado al dinero — precio, descuento y el plan
           de arriba. Si se usa en cualquier otro sitio deja de significar algo. */
        --sig:#e2600a;--sig-d:#c24f05;--sig-sf:#fff3e9;--sig-bd:#fbd7b8;
        --surf:#fff;--surf2:#f8fafc;--surf3:#f1f5f9;
        --bdr:rgba(15,23,42,0.08);--bdr2:rgba(15,23,42,0.12);
        --r:14px;--rl:20px;--rxl:28px;
        --sh-sm:0 1px 3px rgba(15,23,42,0.08),0 1px 2px rgba(15,23,42,0.06);
        --sh-md:0 4px 16px rgba(15,23,42,0.10);
        --sh-lg:0 16px 48px rgba(15,23,42,0.14);
        --sh-bl:0 8px 32px rgba(37,99,235,0.25);
      }
      .lr{background:var(--surf);color:var(--ink);overflow-x:hidden;min-height:100dvh;}

      .l-toast{position:fixed;bottom:24px;left:24px;z-index:300;display:flex;align-items:center;gap:10px;background:var(--ink);border-radius:12px;padding:12px 18px;box-shadow:var(--sh-lg);animation:tIn .4s cubic-bezier(.34,1.56,.64,1);}
      @keyframes tIn{from{transform:translateY(16px);opacity:0;}to{transform:translateY(0);opacity:1;}}
      .l-dot{width:8px;height:8px;border-radius:50%;background:var(--green);box-shadow:0 0 8px var(--green);animation:pu 2s ease infinite;flex-shrink:0;}
      @keyframes pu{0%,100%{box-shadow:0 0 6px var(--green);}50%{box-shadow:0 0 14px var(--green);}}
      .l-toast-t{font-size:13px;font-weight:600;color:#f8fafc;}
      .l-toast-x{background:none;border:none;color:#64748b;cursor:pointer;font-size:12px;padding:2px 4px;margin-left:4px;}

      .ln{position:fixed;top:0;left:0;right:0;z-index:100;transition:background .25s,box-shadow .25s;}
      .ln.sc{background:rgba(255,255,255,0.96);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);box-shadow:0 1px 0 var(--bdr);}
      .ln-i{max-width:1280px;margin:0 auto;display:flex;align-items:center;height:68px;padding:0 28px;gap:32px;}
      .ll{display:flex;align-items:center;gap:10px;text-decoration:none;flex-shrink:0;}
      .ll-img{width:36px;height:36px;border-radius:10px;object-fit:contain;}
      .ll-img.sm{width:28px;height:28px;}
      .ll-t{font-size:20px;font-weight:900;color:var(--ink);letter-spacing:-.5px;}
      .ll-t em{font-style:normal;color:var(--blue);}
      .ll-t.sm{font-size:16px;}
      .ln-links{display:flex;align-items:center;gap:24px;flex:1;}
      .ln-a{font-size:14px;font-weight:600;color:var(--ink3);text-decoration:none;transition:color .15s;}
      .ln-a:hover{color:var(--ink);}
      .ln-r{display:flex;align-items:center;gap:8px;flex-shrink:0;}
      .ln-login{font-size:14px;font-weight:600;color:var(--ink3);text-decoration:none;padding:8px 14px;transition:color .15s;}
      .ln-login:hover{color:var(--ink);}
      .ln-cta{display:inline-flex;align-items:center;gap:4px;font-size:14px;font-weight:700;color:#fff;text-decoration:none;background:var(--blue);padding:9px 18px;border-radius:10px;box-shadow:var(--sh-bl);transition:background .15s,transform .1s;}
      .ln-cta:hover{background:var(--blue-d);transform:translateY(-1px);}
      .ln-ham{display:none;background:none;border:none;cursor:pointer;color:var(--ink);padding:4px;margin-left:auto;}
      /* Sobre el hero el nav es transparente y el fondo es oscuro: el logo y los
         enlaces van en blanco hasta que aparece la barra blanca al hacer scroll. */
      .ln:not(.sc) .ll-t{color:#fff;}
      .ln:not(.sc) .ll-t em{color:#93c5fd;}
      .ln:not(.sc) .ln-a{color:rgba(255,255,255,0.82);}
      .ln:not(.sc) .ln-a:hover{color:#fff;}
      .ln:not(.sc) .ln-login{color:rgba(255,255,255,0.82);}
      .ln:not(.sc) .ln-login:hover{color:#fff;}
      .ln:not(.sc) .ln-ham{color:#fff;}
      .ln-mob{background:var(--surf);border-top:1px solid var(--bdr);padding:12px 24px 20px;}
      .ln-mob-a{display:block;font-size:16px;font-weight:600;color:var(--ink2);text-decoration:none;padding:13px 0;border-bottom:1px solid var(--bdr);}
      .ln-mob-act{display:flex;flex-direction:column;gap:10px;margin-top:16px;}
      .ln-mob-login{text-align:center;color:var(--ink3);font-size:15px;font-weight:600;text-decoration:none;padding:12px;border:1px solid var(--bdr2);border-radius:10px;}
      .ln-mob-cta{text-align:center;background:var(--blue);color:#fff;font-size:15px;font-weight:700;text-decoration:none;padding:13px;border-radius:10px;}

      .lb-pri{display:inline-flex;align-items:center;gap:8px;font-size:15px;font-weight:700;color:#fff;text-decoration:none;background:var(--blue);padding:13px 24px;border-radius:12px;box-shadow:var(--sh-bl);transition:background .15s,transform .1s;}
      .lb-pri:hover{background:var(--blue-d);transform:translateY(-2px);}
      .lb-out{display:inline-flex;align-items:center;gap:6px;font-size:15px;font-weight:600;color:rgba(255,255,255,0.85);text-decoration:none;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.25);padding:13px 22px;border-radius:12px;transition:background .15s;}
      .lb-out:hover{background:rgba(255,255,255,0.18);color:#fff;}
      .lb-wh{display:inline-flex;align-items:center;gap:6px;font-size:15px;font-weight:600;color:#fff;text-decoration:none;border:1.5px solid rgba(255,255,255,0.4);padding:13px 22px;border-radius:12px;transition:border-color .15s,background .15s;}
      .lb-wh:hover{border-color:#fff;background:rgba(255,255,255,0.1);}

      .lh{min-height:100dvh;display:flex;align-items:center;padding:100px 28px 80px;position:relative;overflow:hidden;background:#0a0f1e;}
      .lh-bg{position:absolute;inset:0;}
      .lh-photo{position:absolute;inset:0;background-size:cover;background-position:center;filter:saturate(0.4);}
      .lh-ov{position:absolute;inset:0;background:linear-gradient(135deg,rgba(10,15,30,0.93) 40%,rgba(10,15,30,0.75) 100%);}
      .lh-grid{position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,0.018) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.018) 1px,transparent 1px);background-size:56px 56px;mask-image:radial-gradient(ellipse 80% 80% at 50% 50%,black,transparent);}
      .lh-inner{max-width:1280px;margin:0 auto;width:100%;display:grid;grid-template-columns:1fr 1fr;gap:64px;align-items:center;position:relative;z-index:1;}
      .lh-left{display:flex;flex-direction:column;gap:24px;}
      .ley{display:inline-flex;align-items:center;gap:8px;background:rgba(37,99,235,0.15);border:1px solid rgba(37,99,235,0.3);border-radius:999px;padding:6px 16px;width:fit-content;font-size:12px;font-weight:600;color:#93c5fd;}
      .ley-dot{width:7px;height:7px;border-radius:50%;background:var(--green);box-shadow:0 0 8px var(--green);animation:pu 2s infinite;flex-shrink:0;}
      /* El interletrado va en em y no en px: con clamp, un -2px fijo que
         funciona a 68px deja el titular ilegible a 36px en el teléfono. */
      .lh1{font-size:clamp(36px,5.5vw,68px);font-weight:800;line-height:1.02;letter-spacing:-.03em;color:#f8fafc;}
      .ltw{display:block;color:#60a5fa;min-height:1.1em;}
      @keyframes blink{0%,100%{opacity:1;}50%{opacity:0;}}
      .lh-sub{font-size:clamp(15px,1.5vw,18px);color:#94a3b8;line-height:1.75;max-width:500px;}
      .lh-ctas{display:flex;gap:12px;flex-wrap:wrap;}
      .ltrust{display:flex;flex-wrap:wrap;gap:16px;}
      /* Iba en #475569 sobre un hero casi negro: se leía a duras penas justo en
         la línea que quita el miedo a registrarse. */
      .ltrust-p{display:flex;align-items:center;gap:6px;font-size:12.5px;font-weight:500;color:#b6c2d4;}
      .lck{color:var(--green);}
      .lh-right{display:flex;justify-content:center;align-items:center;}
      .lmock{position:relative;width:100%;max-width:560px;}
      .lmock-s{width:100%;border-radius:16px;box-shadow:0 40px 80px rgba(0,0,0,0.5),0 0 0 1px rgba(255,255,255,0.06);animation:fl 6s ease-in-out infinite;}
      @keyframes fl{0%,100%{transform:translateY(0);}50%{transform:translateY(-10px);}}
      .lfl{position:absolute;display:flex;align-items:center;gap:10px;background:rgba(15,23,42,0.9);backdrop-filter:blur(12px);border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:10px 14px;min-width:180px;}
      .lfl-wa{bottom:24px;left:-32px;animation:fl 6s 1s ease-in-out infinite;}
      .lfl-rv{top:24px;right:-24px;animation:fl 6s 2s ease-in-out infinite;}
      .lfl-ic{width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
      .lfl-l{font-size:10px;color:#64748b;font-weight:600;margin-bottom:2px;}
      .lfl-v{font-size:13px;color:#f1f5f9;font-weight:700;}

      .lmq{border-top:1px solid var(--bdr);border-bottom:1px solid var(--bdr);overflow:hidden;padding:14px 0;background:var(--surf2);}
      .lmq-t{display:flex;width:max-content;animation:mq 40s linear infinite;}
      @keyframes mq{from{transform:translateX(0);}to{transform:translateX(-50%);}}
      .lmq-i{font-size:13px;font-weight:600;color:var(--ink4);white-space:nowrap;}
      .lmq-d{margin:0 20px;color:var(--blue);}

      .li{max-width:1200px;margin:0 auto;padding:0 28px;}
      .ls{padding:72px 0;}
      .lsl{font-size:13px;font-weight:800;color:var(--blue);letter-spacing:2.5px;text-transform:uppercase;margin-bottom:16px;text-align:center;}
      /* El gancho de precio va en naranja de señal, no en verde: el verde en
         esta página confirma cosas ya logradas (funciones incluidas, ahorro),
         y esto es una llamada a actuar. */
      .lprice-s .lsl{display:block;width:fit-content;margin:0 auto 18px;font-size:15px;letter-spacing:1.6px;color:var(--sig-d);background:var(--sig-sf);border:1px solid var(--sig-bd);border-radius:999px;padding:9px 22px;}
      .lsh2{font-size:clamp(31px,4.6vw,54px);font-weight:800;letter-spacing:-.028em;line-height:1.06;color:var(--ink);text-align:center;margin-bottom:16px;text-wrap:balance;}
      .lssub{font-size:17px;color:var(--ink3);text-align:center;max-width:580px;margin:0 auto 44px;line-height:1.7;}

      .lprob{background:var(--surf2);}
      .lstg{display:grid;grid-template-columns:repeat(4,1fr);gap:0;border-top:1px solid var(--bdr);border-bottom:1px solid var(--bdr);}
      .lstc{background:transparent;border:none;border-left:1px solid var(--bdr);border-radius:0;padding:40px 26px 36px;opacity:0;transform:translateY(20px);transition:opacity .5s,transform .5s;text-align:center;}
      .lstc:first-child{border-left:none;}
      .lstc.v{opacity:1;transform:translateY(0);}
      .lstc:hover{box-shadow:var(--sh-md);transform:translateY(-4px);}
      .lsti{width:52px;height:52px;border-radius:14px;display:flex;align-items:center;justify-content:center;margin:0 auto 20px;}
      .lstn{font-size:clamp(52px,7vw,80px);font-weight:900;letter-spacing:-.05em;line-height:.92;margin-bottom:14px;font-variant-numeric:tabular-nums;}
      .lstxt{font-size:14.5px;color:var(--ink2);line-height:1.55;font-weight:500;max-width:210px;margin:0 auto;}

      .lver{padding:72px 0;background:var(--surf);}
      .lver-w{max-width:1100px;margin:0 auto;display:grid;grid-template-columns:1fr 1.4fr;gap:64px;align-items:center;}
      .lver-img{position:relative;border-radius:var(--rl);overflow:hidden;}
      .lvimg{width:100%;height:500px;object-fit:cover;display:block;}
      .lvimg-c{position:absolute;bottom:16px;left:16px;font-size:12px;font-weight:800;padding:5px 12px;border-radius:999px;}
      .lvimg-c.bad{background:rgba(239,68,68,0.9);color:#fff;}
      .lver-cnt{display:flex;flex-direction:column;}
      .lver-h2{font-size:clamp(28px,4.2vw,46px);font-weight:800;letter-spacing:-.028em;line-height:1.08;color:var(--ink);margin-bottom:16px;text-align:left;text-wrap:balance;}
      .lver-sub{font-size:16px;color:var(--ink3);line-height:1.65;margin-bottom:30px;max-width:520px;}
      .lver-rows{display:flex;flex-direction:column;border:1px solid var(--bdr);border-radius:var(--rl);overflow:hidden;}
      .lvrow{display:grid;grid-template-columns:1fr 1fr;}
      .lvrow:not(:last-child){border-bottom:1px solid var(--bdr);}
      .lvbad{display:flex;align-items:flex-start;gap:9px;padding:15px 18px;font-size:13.5px;color:var(--muted);background:var(--surf2);line-height:1.45;text-decoration:line-through;text-decoration-color:rgba(148,163,184,.5);}
      .lvgood{display:flex;align-items:flex-start;gap:9px;padding:15px 18px;font-size:13.5px;font-weight:600;color:var(--ink);background:#fff;line-height:1.45;border-left:1px solid var(--bdr);}
      .lvx{font-weight:800;flex-shrink:0;color:#ef4444;}
      .lvch{font-weight:800;flex-shrink:0;color:#22c55e;}

      .lfeat-s{background:var(--surf2);}
      .lfg{display:grid;grid-template-columns:repeat(3,1fr);gap:24px;}
      .lfc{background:var(--surf);border:1px solid var(--bdr);border-radius:var(--rl);overflow:hidden;opacity:0;transform:translateY(24px);transition:opacity .5s,transform .5s,box-shadow .2s;}
      .lfc.v{opacity:1;transform:translateY(0);}
      .lfc:hover{box-shadow:var(--sh-lg);transform:translateY(-6px);}
      .lfc-iw{position:relative;overflow:hidden;height:200px;}
      .lfc-img{width:100%;height:100%;object-fit:cover;transition:transform .4s;}
      .lfc:hover .lfc-img{transform:scale(1.04);}
      .lfc-iov{position:absolute;inset:0;background:linear-gradient(to bottom,transparent 40%,rgba(15,23,42,0.6));}
      .lfc-tag{position:absolute;top:12px;right:12px;font-size:10px;font-weight:800;padding:4px 10px;border-radius:999px;background:rgba(37,99,235,0.9);color:#fff;letter-spacing:.3px;}
      .lfc-b{padding:24px;}
      .lfc-t{font-size:18px;font-weight:800;color:var(--ink);margin-bottom:8px;letter-spacing:-.3px;}
      .lfc-d{font-size:14px;color:var(--ink3);line-height:1.7;margin-bottom:16px;}
      .lfc-lnk{display:inline-flex;align-items:center;gap:6px;font-size:13px;font-weight:700;color:var(--blue);text-decoration:none;transition:gap .15s;}
      .lfc-lnk:hover{gap:10px;}
      .lcta-c{display:flex;justify-content:center;margin-top:3rem;}

      .lmods-tira{margin-top:40px;padding-top:28px;border-top:1px solid var(--bdr);display:flex;flex-wrap:wrap;align-items:center;gap:12px 16px;justify-content:center;}
      .lmods-lbl{font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);}
      .lmods-chips{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;}
      .lmod-chip{display:inline-flex;align-items:center;gap:7px;font-size:13.5px;font-weight:600;color:var(--ink);background:var(--surf);border:1px solid var(--bdr);border-radius:999px;padding:7px 14px;}
      .lmod-s{background:var(--surf);}
      .lmw{display:grid;grid-template-columns:1fr 1fr;gap:56px;align-items:start;}
      .lmimgs{display:flex;flex-direction:column;gap:16px;position:sticky;top:100px;}
      .lmimg{width:100%;border-radius:var(--rl);object-fit:cover;box-shadow:var(--sh-md);height:240px;}
      .lmimg2{height:180px;}
      .lmgrid{display:flex;flex-direction:column;border:1px solid var(--bdr);border-radius:var(--rl);overflow:hidden;}
      .lmc{display:flex;align-items:center;gap:16px;padding:18px 20px;border-bottom:1px solid var(--bdr);opacity:0;transform:translateX(-12px);transition:opacity .45s,transform .45s,background .15s;}
      .lmc:last-child{border-bottom:none;}
      .lmc.v{opacity:1;transform:translateX(0);}
      .lmc:hover{background:var(--surf2);}
      .lmc-ic{width:44px;height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
      .lmc-l{font-size:14px;font-weight:700;color:var(--ink);margin-bottom:2px;}
      .lmc-d{font-size:12px;color:var(--ink4);line-height:1.4;}

      .lgal{padding:72px 0;background:var(--surf2);overflow:hidden;}
      .lgal-i{max-width:1200px;margin:0 auto;padding:0 28px;display:grid;grid-template-columns:1fr 1.4fr;gap:64px;align-items:center;}
      .lgal-t{display:flex;flex-direction:column;gap:20px;}
      .lgal-h2{font-size:clamp(30px,4.4vw,50px);font-weight:800;letter-spacing:-.028em;line-height:1.08;color:var(--ink);text-align:center;text-wrap:balance;}
      .lgal-sub{font-size:15px;color:var(--ink3);line-height:1.7;max-width:420px;text-align:left;}
      .lgal-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;}
      .lgal-card{border-radius:var(--r);overflow:hidden;box-shadow:var(--sh-md);transition:transform .3s,box-shadow .3s;}
      .lgal-card:hover{transform:translateY(-4px);box-shadow:var(--sh-lg);}
      .lgal-card-img{width:100%;height:180px;object-fit:cover;display:block;}
      .lgal-card-info{background:var(--surf);padding:12px 14px;}
      .lgal-card-name{font-size:13px;font-weight:700;color:var(--ink);margin-bottom:2px;}
      .lgal-card-city{font-size:11px;color:var(--ink4);display:flex;align-items:center;gap:4px;}
      .lgal-card-city::before{content:'📍';font-size:10px;}

      .ltesti-s{background:var(--ink);padding:96px 0;}
      .ltesti-s .lsl{color:#60a5fa;}
      .ltesti-s .lsh2{color:#f8fafc;}
      .ltg{display:grid;grid-template-columns:repeat(3,1fr);gap:24px;}
      .ltc{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:var(--rl);overflow:hidden;opacity:0;transform:translateY(20px);transition:opacity .5s,transform .5s,border-color .2s;}
      .ltc.v{opacity:1;transform:translateY(0);}
      .ltc:hover{border-color:rgba(255,255,255,0.16);}
      .ltc-auth{display:flex;align-items:center;gap:12px;margin-top:16px;}
      .ltc-av{width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:800;color:#fff;flex-shrink:0;}
      .ltc-iov{position:absolute;inset:0;background:linear-gradient(to bottom,transparent 30%,rgba(15,23,42,0.8));}
      .ltc-b{padding:24px;}
      .lstr{color:#f59e0b;font-size:14px;letter-spacing:3px;margin-bottom:12px;}
      .ltc-txt{font-size:14px;color:#94a3b8;line-height:1.8;font-style:italic;margin-bottom:20px;}
      .ltc-n{font-size:14px;font-weight:700;color:#f1f5f9;}
      .ltc-r{font-size:12px;color:#475569;margin-top:2px;}

      .lprice-s{background:var(--surf2);}
      .ltog-w{display:flex;justify-content:center;margin-bottom:40px;}
      .ltog{display:inline-flex;background:var(--surf);border:1px solid var(--bdr2);border-radius:12px;padding:4px;}
      .ltb{display:flex;align-items:center;gap:6px;padding:8px 20px;border-radius:9px;border:none;cursor:pointer;font-size:14px;font-weight:600;background:transparent;color:var(--ink3);transition:all .2s;font-family:inherit;}
      .ltb.a{background:var(--blue);color:#fff;}
      .ltbadge{font-size:10px;background:var(--sig);color:#fff;padding:1px 6px;border-radius:999px;font-weight:700;}
      .lpg{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:24px;max-width:1000px;margin:0 auto 48px;}
      .lplan{background:var(--surf);border:1px solid var(--bdr2);border-radius:var(--rxl);padding:36px 32px;position:relative;transition:box-shadow .2s,transform .2s;display:flex;flex-direction:column;}
      .lplan:hover{box-shadow:var(--sh-lg);transform:translateY(-4px);}
      /* "Más popular" cuelga de la tarjeta de Esencial: va del color de esa
         tarjeta. En ámbar chocaba con el plan Pro y parecía señalarlo a él. */
      .lplan.pop{border-color:var(--blue);border-width:2px;box-shadow:0 0 0 1px rgba(37,99,235,0.3),0 8px 32px rgba(37,99,235,0.14);}
      .lplan-b{position:absolute;top:-14px;left:50%;transform:translateX(-50%);background:var(--blue);color:#fff;font-size:11px;font-weight:800;padding:5px 18px;border-radius:999px;white-space:nowrap;letter-spacing:.3px;}
      .lplan-h{display:flex;flex-direction:column;align-items:center;gap:8px;margin-bottom:10px;text-align:center;}
      .lplan-ic{width:56px;height:56px;border-radius:16px;background:rgba(100,116,139,0.10);display:flex;align-items:center;justify-content:center;color:var(--ink3);}
      .lplan.esencial{border-color:#3b82f6;border-width:2px;box-shadow:0 0 0 1px rgba(59,130,246,0.3),0 8px 24px rgba(59,130,246,0.1);}
      .lplan.esencial .lplan-ic{background:rgba(37,99,235,0.12);color:#2563eb;}
      .lplan.esencial .lplan-num{color:#2563eb;}
      .lplan.esencial .lplan-pb{background:rgba(59,130,246,0.04);border-color:rgba(59,130,246,0.15);}
      .lplan.esencial .lplan-cta{background:#2563eb;border-color:#2563eb;color:#fff;box-shadow:0 4px 16px rgba(37,99,235,0.25);}
      .lplan.esencial .lplan-cta:hover{background:#1d4ed8;box-shadow:0 6px 24px rgba(37,99,235,0.35);}
      .lplan.pop .lplan-ic{background:rgba(37,99,235,0.12);color:#2563eb;}
      /* Pro se queda con el naranja de señal en vez de su ámbar anterior: así
         la página entera tiene un solo color cálido y no dos casi iguales. */
      .lplan:last-child .lplan-ic{background:rgba(226,96,10,0.12);color:var(--sig);}
      .lplan-ideal{font-size:13.5px;color:var(--ink3);margin:0 0 18px;line-height:1.55;text-align:center;min-height:42px;}
      .lplan-n{font-size:29px;font-weight:800;color:var(--ink);letter-spacing:-.022em;line-height:1;}
      .lplan-pct{font-size:11px;font-weight:800;background:var(--sig-sf);color:var(--sig-d);border:1px solid var(--sig-bd);padding:3px 10px;border-radius:999px;}
      .lplan-pb{background:var(--surf2);border:1px solid var(--bdr);border-radius:14px;padding:20px 14px;margin-bottom:22px;text-align:center;}
      .lplan.pop .lplan-pb{background:rgba(37,99,235,0.05);border-color:rgba(37,99,235,0.18);}
      .lplan:last-child .lplan-pb{background:rgba(226,96,10,0.05);border-color:rgba(226,96,10,0.18);}
      .lplan-or{font-size:17px;color:var(--ink4);text-decoration:line-through;font-weight:600;margin-bottom:2px;}
      .lplan-pr{display:flex;align-items:baseline;gap:5px;justify-content:center;flex-wrap:nowrap;}
      .lplan-num{font-size:clamp(38px,3.6vw,54px);font-weight:900;color:var(--blue);letter-spacing:-.035em;line-height:1;white-space:nowrap;}
      .lplan-cur{font-size:13px;font-weight:800;color:var(--ink4);letter-spacing:.5px;}
      .lplan.pop .lplan-num{color:#2563eb;}
      .lplan:last-child .lplan-num{color:var(--sig);}
      .lplan-per{font-size:15px;color:var(--ink3);font-weight:600;white-space:nowrap;}
      .lplan-an{font-size:12.5px;color:#059669;font-weight:700;margin-top:8px;}
      .lplan-fl{list-style:none;display:flex;flex-direction:column;gap:10px;margin-bottom:24px;flex:1;}
      .lplan-fl li{display:flex;align-items:flex-start;gap:10px;font-size:14px;color:var(--ink2);}
      .lplan-cta{display:flex;align-items:center;justify-content:center;gap:8px;background:var(--surf2);border:1.5px solid var(--bdr2);color:var(--ink);font-size:15px;font-weight:700;text-decoration:none;padding:14px 20px;border-radius:12px;transition:all .2s;}
      .lplan-cta:hover{background:var(--surf3);}
      .lplan-cta.pop{background:var(--blue);border-color:var(--blue);color:#fff;box-shadow:0 4px 20px rgba(37,99,235,0.3);}
      .lplan-cta.pop:hover{background:var(--blue-d);box-shadow:0 6px 28px rgba(37,99,235,0.4);}
      .lplan-nt{text-align:center;font-size:11.5px;color:var(--ink4);margin-top:11px;line-height:1.45;}
      .lplan-free{font-size:12px;color:var(--muted);font-weight:600;}
      .lproof{display:flex;align-items:center;justify-content:center;gap:14px;}
      .lpavs{display:flex;}
      .lpav{width:32px;height:32px;border-radius:50%;object-fit:cover;border:2px solid var(--surf2);}
      .lproof-t{font-size:14px;color:var(--ink3);}
      .lproof-t strong{color:var(--ink);}

      .lcta{position:relative;padding:128px 28px;text-align:center;overflow:hidden;}
      .lcta-bg{position:absolute;inset:0;background-size:cover;background-position:center;filter:saturate(0.3);}
      .lcta-ov{position:absolute;inset:0;background:linear-gradient(135deg,rgba(10,15,30,0.94),rgba(10,15,30,0.88));}
      .lcta-i{position:relative;z-index:1;max-width:640px;margin:0 auto;}
      .lcta-h2{font-size:clamp(32px,5vw,60px);font-weight:800;letter-spacing:-.03em;line-height:1.06;color:#f8fafc;margin:12px 0 16px;text-wrap:balance;}
      .lcta-sub{font-size:clamp(15px,1.8vw,18px);color:#94a3b8;line-height:1.7;margin-bottom:36px;}
      .lcta-bts{display:flex;justify-content:center;flex-wrap:wrap;gap:12px;}

      .lfoot{border-top:1px solid var(--bdr);padding:32px 28px;background:var(--surf);}
      .lfoot-i{max-width:1200px;margin:0 auto;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:16px;}
      .lfoot-l{display:flex;align-items:center;gap:8px;}
      .lfoot-c{font-size:12px;color:var(--ink4);}
      .lfoot-lnks{display:flex;gap:24px;}
      .lfoot-cols{display:flex;align-items:center;gap:28px;flex-wrap:wrap;justify-content:center;}
      .lfoot-cont{display:flex;align-items:center;gap:18px;flex-wrap:wrap;justify-content:center;}
      .lfoot-wa{display:inline-flex;align-items:center;gap:7px;font-weight:700;color:#15803d !important;background:#f0fdf4;border:1px solid #bbf7d0;padding:8px 14px;border-radius:999px;}
      .lfoot-mail{font-weight:600;}
      .lfoot-lnks a{font-size:13px;color:var(--ink4);text-decoration:none;transition:color .15s;}
      .lfoot-lnks a:hover{color:var(--ink2);}

      /* ── 5 ERRORES ─────────────────────────────────────────────────────── */
      .llm{padding:96px 0;background:linear-gradient(135deg,#1e3a5f 0%,#1d4ed8 100%);}
      .llm .lsl{color:#93c5fd;}
      .llm-solo{max-width:680px;margin:0 auto;}
      .llm-h2{font-size:clamp(24px,3.5vw,40px);font-weight:800;letter-spacing:-.025em;color:#fff;line-height:1.12;margin-bottom:16px;text-wrap:balance;}
      .llm-sub{font-size:15px;color:#bfdbfe;line-height:1.7;}
      .llm-list{list-style:none;display:flex;flex-direction:column;gap:12px;}
      .llm-list-center{max-width:560px;margin:0 auto;}
      .llm-item{display:flex;align-items:flex-start;gap:12px;font-size:14px;color:#e0f2fe;line-height:1.5;}
      .llm-num{background:rgba(255,255,255,0.15);border-radius:6px;padding:2px 8px;font-size:11px;font-weight:800;color:#fff;flex-shrink:0;letter-spacing:.5px;}

      @media(max-width:1024px){
        .lstg{grid-template-columns:repeat(2,1fr);}
        .lstc:nth-child(2n+1){border-left:none;}
        .lstc:nth-child(n+3){border-top:1px solid var(--bdr);}
        .lfg{grid-template-columns:repeat(2,1fr);}
        .lmw{grid-template-columns:1fr;}
        .lmimgs{position:static;display:grid;grid-template-columns:1fr 1fr;}
        .lmimg,.lmimg2{height:180px;}
      }
      @media(max-width:900px){
        .ln-links,.ln-r{display:none;}
        .ln-ham{display:block;}
        .lh-inner{grid-template-columns:1fr;}
        .lh-right{display:none;}
        .lver-w{grid-template-columns:1fr;}
        .lver-img{display:none;}
        .ltg{grid-template-columns:1fr;}
        .lgal-i{grid-template-columns:1fr;}
        .lgal-grid{grid-template-columns:1fr 1fr;}
        .llm .lsl{text-align:center;}
      }
      .lfaq-s{background:var(--surf);}
      .lfaq{max-width:760px;margin:0 auto;border-top:1px solid var(--bdr);}
      .lfaq-i{border-bottom:1px solid var(--bdr);}
      .lfaq-q{display:flex;align-items:center;justify-content:space-between;gap:18px;cursor:pointer;list-style:none;padding:22px 4px;font-size:17px;font-weight:700;color:var(--ink);line-height:1.4;text-align:left;}
      .lfaq-q::-webkit-details-marker{display:none;}
      .lfaq-ic{flex-shrink:0;width:26px;height:26px;border-radius:50%;background:var(--surf2);border:1px solid var(--bdr);display:flex;align-items:center;justify-content:center;font-size:17px;font-weight:700;color:var(--blue);transition:transform .2s;}
      .lfaq-i[open] .lfaq-ic{transform:rotate(45deg);}
      .lfaq-r{padding:0 4px 24px;font-size:15.5px;color:var(--ink3);line-height:1.7;max-width:660px;text-align:left;}
      .lmobile-cta{display:none;}
      @media(max-width:900px){
        /* En pantalla de teléfono todo el bloque de texto va centrado */
        .lh-left,.lfc-b,.lver-cnt,.lplan-h,.lplan-ideal{text-align:center;}
        /* En columna flex el text-align no alinea la caja: hace falta align-items */
        .lh-left,.lgal-t{align-items:center;}
        .lver-h2,.lver-sub,.lgal-t{text-align:center;}
        /* Las filas de comparación son listas: centrarlas descoloca el icono
           respecto al texto y se leen peor. Se quedan a la izquierda. */
        .lvbad,.lvgood{text-align:left;}
        /* la píldora del gancho de precio cabe en un renglón en pantalla chica */
        .lprice-s .lsl{font-size:12.5px;letter-spacing:1.1px;padding:8px 16px;}
        .lver-sub{margin-left:auto;margin-right:auto;}
        .lh-ctas,.ltrust{justify-content:center;}
        .lfc-lnk{justify-content:center;}
        .lstc{padding:30px 16px;}
      }
      @media(max-width:640px){
        .lh{padding:90px 16px 60px;}
        .li{padding:0 16px;}
        .ls{padding:48px 0;}
        .lver,.lgal{padding:48px 0;}
        .lssub{margin-bottom:34px;}
        .lh-ctas{flex-direction:column;}
        .lb-pri,.lb-out{width:100%;justify-content:center;max-width:340px;}
        .lstg{grid-template-columns:1fr 1fr;}
        .lstc:nth-child(2n+1){border-left:none;}
        .lstc:nth-child(n+3){border-top:1px solid var(--bdr);}
        .lfg{grid-template-columns:1fr;}
        .lpg{grid-template-columns:1fr;}
        .lvrow{grid-template-columns:1fr;}
        .lvbad{border-radius:0;}
        .l-toast{left:12px;right:12px;bottom:16px;}
        .lcta-bts{flex-direction:column;align-items:center;}
        .lfoot{padding-bottom:110px;}
        .lfoot-i{flex-direction:column;text-align:center;gap:20px;}
        .lfoot-cols{flex-direction:column;gap:18px;}
        .lfoot-lnks{gap:22px;flex-wrap:wrap;justify-content:center;}
        .lfoot-cont{flex-direction:column;gap:12px;}
        .lmobile-cta{display:flex;flex-direction:column;align-items:center;position:fixed;bottom:0;left:0;right:0;background:#fff;border-top:1px solid #e2e8f0;padding:12px 16px 20px;box-shadow:0 -4px 20px rgba(0,0,0,0.08);z-index:100;}
        .lmobile-cta-btn{display:block;width:100%;background:#2563eb;color:#fff;text-align:center;font-size:15px;font-weight:700;padding:13px;border-radius:12px;text-decoration:none;}
        .lmobile-cta-sub{font-size:11px;color:#94a3b8;margin:6px 0 0;}
      }
    ` }} />
    </div>
    </>
  )
}
