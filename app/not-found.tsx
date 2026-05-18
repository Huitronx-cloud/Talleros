import Link from 'next/link'

export default function NotFound() {
  return (
    <main style={{
      minHeight: '100dvh',
      background: '#04080f',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      fontFamily: 'system-ui, sans-serif',
    }}>
      <div style={{ textAlign: 'center', maxWidth: 480 }}>
        <div style={{
          fontSize: 96,
          fontWeight: 900,
          background: 'linear-gradient(135deg,#2563eb,#0891b2)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          lineHeight: 1,
          marginBottom: 16,
        }}>404</div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#f1f5f9', marginBottom: 12 }}>
          Página no encontrada
        </h1>
        <p style={{ fontSize: 15, color: '#64748b', lineHeight: 1.7, marginBottom: 36 }}>
          La página que buscas no existe o fue movida. Vuelve al inicio y continúa gestionando tu taller.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/dashboard" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: '#2563eb', color: '#fff', fontWeight: 700,
            fontSize: 15, textDecoration: 'none',
            padding: '12px 24px', borderRadius: 12,
            boxShadow: '0 8px 24px rgba(37,99,235,0.35)',
          }}>
            Ir al dashboard
          </Link>
          <Link href="/" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: '#94a3b8', fontWeight: 600,
            fontSize: 15, textDecoration: 'none',
            padding: '12px 24px', borderRadius: 12,
          }}>
            Página principal
          </Link>
        </div>
        <div style={{ marginTop: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <img src="/icon-512.png" alt="TallerOS" style={{ width: 28, height: 28, borderRadius: 6 }} />
          <span style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>
            Taller<span style={{ color: '#2563eb' }}>OS</span>
          </span>
        </div>
      </div>
    </main>
  )
}