import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sin conexión — TallerOS',
  robots: { index: false, follow: false },
}

// Página de respaldo que sirve el service worker cuando no hay red.
// Debe ser 100% estática: se precachea en la instalación del SW.
export default function OfflinePage() {
  return (
    <div style={{
      minHeight: '100vh', background: '#111827', color: '#f1f5f9',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: 24, textAlign: 'center',
      fontFamily: 'system-ui, sans-serif',
    }}>
      <div style={{ fontSize: 56, marginBottom: 16 }}>📡</div>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Sin conexión</h1>
      <p style={{ fontSize: 15, color: '#94a3b8', maxWidth: 420, lineHeight: 1.6, marginBottom: 24 }}>
        No pudimos conectar con TallerOS. Revisa tu conexión a internet e intenta de nuevo —
        tus datos están seguros y nada se perdió.
      </p>
      <a
        href="/dashboard"
        style={{
          background: '#2563eb', color: '#fff', fontSize: 14, fontWeight: 600,
          borderRadius: 10, padding: '12px 24px', textDecoration: 'none',
        }}
      >
        Reintentar
      </a>
    </div>
  )
}
