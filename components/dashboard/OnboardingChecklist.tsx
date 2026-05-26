'use client'

import { useState, useEffect } from 'react'
import { Check, X, Settings, Users, ClipboardList, ChevronRight, Sparkles } from 'lucide-react'

interface Props {
  tallerNombre: string
  tieneClientes: boolean
  tieneOrdenes: boolean
  tallerId: string
}

const PASOS = [
  {
    id: 'configuracion',
    icon: Settings,
    titulo: 'Configura tu taller',
    desc: 'Agrega tu logo, teléfono, horario y moneda local.',
    href: '/configuracion',
    cta: 'Ir a configuración',
    color: '#2563eb',
    bg: 'rgba(37,99,235,0.1)',
  },
  {
    id: 'cliente',
    icon: Users,
    titulo: 'Agrega tu primer cliente',
    desc: 'Registra un cliente con su vehículo para empezar.',
    href: '/clientes',
    cta: 'Agregar cliente',
    color: '#0891b2',
    bg: 'rgba(8,145,178,0.1)',
  },
  {
    id: 'orden',
    icon: ClipboardList,
    titulo: 'Crea tu primera orden',
    desc: 'Abre una orden de trabajo y comienza a operar.',
    href: '/ordenes',
    cta: 'Crear orden',
    color: '#16a34a',
    bg: 'rgba(22,163,74,0.1)',
  },
]

export default function OnboardingChecklist({ tallerNombre, tieneClientes, tieneOrdenes, tallerId }: Props) {
  const [visible, setVisible] = useState(false)
  const [cerrado, setCerrado] = useState(false)

  const completados = {
    configuracion: true, // siempre tiene nombre al registrarse
    cliente: tieneClientes,
    orden: tieneOrdenes,
  }

  const totalCompletados = Object.values(completados).filter(Boolean).length
  const porcentaje = Math.round((totalCompletados / PASOS.length) * 100)
  const todoCompleto = totalCompletados === PASOS.length

  useEffect(() => {
    const key = `onboarding_cerrado_${tallerId}`
    if (typeof window === 'undefined') return
    const yaCerrado = localStorage.getItem(key)
    if (!yaCerrado && !todoCompleto) setVisible(true)
  }, [tallerId, todoCompleto])

  const handleCerrar = () => {
    if (typeof window !== 'undefined') localStorage.setItem(`onboarding_cerrado_${tallerId}`, '1')
    setCerrado(true)
  }

  if (!visible || cerrado) return null

  return (
    <div style={{
      background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
      border: '1px solid rgba(99,102,241,0.3)',
      borderRadius: '20px',
      padding: '28px',
      position: 'relative',
      overflow: 'hidden',
      marginBottom: '8px',
    }}>
      {/* Glow */}
      <div style={{
        position: 'absolute', top: -40, right: -40, width: 200, height: 200,
        borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.15), transparent)',
        pointerEvents: 'none',
      }} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Sparkles size={18} color="#818cf8" />
          </div>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#818cf8', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 2 }}>
              Primeros pasos
            </p>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#f1f5f9', margin: 0 }}>
              Bienvenido a TallerOS, {tallerNombre} 🎉
            </h3>
          </div>
        </div>
        <button onClick={handleCerrar} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: '#475569', padding: 4, borderRadius: 6,
          transition: 'color .15s',
        }}>
          <X size={16} />
        </button>
      </div>

      {/* Progress bar */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>
            {totalCompletados} de {PASOS.length} completados
          </span>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#818cf8' }}>{porcentaje}%</span>
        </div>
        <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 999, overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 999,
            background: 'linear-gradient(90deg, #6366f1, #2563eb)',
            width: `${porcentaje}%`,
            transition: 'width .6s ease',
          }} />
        </div>
      </div>

      {/* Pasos */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {PASOS.map((paso) => {
          const hecho = completados[paso.id as keyof typeof completados]
          return (
            <a
              key={paso.id}
              href={hecho ? undefined : paso.href}
              style={{
                display: 'flex', alignItems: 'center', gap: 14,
                background: hecho ? 'rgba(34,197,94,0.06)' : paso.bg,
                border: `1px solid ${hecho ? 'rgba(34,197,94,0.2)' : `${paso.color}25`}`,
                borderRadius: 14, padding: '14px 16px',
                textDecoration: 'none',
                cursor: hecho ? 'default' : 'pointer',
                transition: 'border-color .2s, background .2s',
                opacity: hecho ? 0.7 : 1,
              }}
            >
              {/* Icono estado */}
              <div style={{
                width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                background: hecho ? 'rgba(34,197,94,0.15)' : paso.bg,
                border: `1px solid ${hecho ? 'rgba(34,197,94,0.3)' : `${paso.color}30`}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {hecho
                  ? <Check size={15} color="#22c55e" strokeWidth={3} />
                  : <paso.icon size={15} color={paso.color} />
                }
              </div>

              {/* Texto */}
              <div style={{ flex: 1 }}>
                <p style={{
                  fontSize: 13, fontWeight: 700, margin: 0,
                  color: hecho ? '#4ade80' : '#f1f5f9',
                  textDecoration: hecho ? 'line-through' : 'none',
                }}>
                  {paso.titulo}
                </p>
                {!hecho && (
                  <p style={{ fontSize: 11, color: '#64748b', margin: '2px 0 0', lineHeight: 1.4 }}>
                    {paso.desc}
                  </p>
                )}
              </div>

              {/* CTA */}
              {!hecho && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  fontSize: 12, fontWeight: 700, color: paso.color,
                  flexShrink: 0,
                }}>
                  {paso.cta} <ChevronRight size={13} />
                </div>
              )}
            </a>
          )
        })}
      </div>
    </div>
  )
}