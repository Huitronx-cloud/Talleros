'use client'

// Red de seguridad: si la página pública de citas truena, el visitante ve
// esto en lugar de quedarse colgado en el splash global.
export default function ErrorCitaPublica({ reset }: { error: Error; reset: () => void }) {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: 24,
      textAlign: 'center', background: '#f8fafc', fontFamily: 'system-ui, sans-serif',
    }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>🔧</div>
      <h1 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>
        Algo salió mal al cargar la agenda
      </h1>
      <p style={{ fontSize: 14, color: '#64748b', maxWidth: 400, lineHeight: 1.6, marginBottom: 20 }}>
        Intenta de nuevo en unos segundos. Si el problema sigue, contacta al taller
        directamente por teléfono o WhatsApp.
      </p>
      <button
        onClick={reset}
        style={{
          background: '#2563eb', color: '#fff', fontSize: 14, fontWeight: 600,
          border: 'none', borderRadius: 10, padding: '12px 24px', cursor: 'pointer',
        }}
      >
        Reintentar
      </button>
    </div>
  )
}
