import type { Metadata } from 'next'

export const dynamic = 'force-static'

export const metadata: Metadata = {
  title: 'TallerOS',
  robots: { index: false, follow: false },
}

// Página puente de arranque de la PWA (manifest start_url apunta aquí).
// Es 100% estática y el service worker la precachea: pinta el splash al
// INSTANTE del tap, mientras el dashboard (auth + queries, varios segundos)
// carga en segundo plano. Sin esto, iOS muestra pantalla blanca hasta que
// el servidor responde.
// El redirect es un script inline (sin dependencia de chunks de JS): aunque
// la versión cacheada quede vieja tras un deploy, siempre funciona.
export default function AbriendoPage() {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 10000,
      background: '#0f172a', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 20,
      fontFamily: 'system-ui, sans-serif',
    }}>
      <svg viewBox="0 0 40 40" width="72" height="72" style={{ borderRadius: 18 }} xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="10" fill="#2563eb" />
        <path d="M12 20h6l2-6 4 12 2-6h6" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
      <p style={{ color: '#f8fafc', fontSize: 22, fontWeight: 800, margin: 0 }}>
        Taller<span style={{ color: '#3b82f6' }}>OS</span>
      </p>
      <p style={{ color: '#94a3b8', fontSize: 13, fontWeight: 500, margin: 0 }}>
        Iniciando tu taller...
      </p>

      {/* La salida de emergencia.
          Sin esto, si la navegación al panel no prosperaba —red lenta, arranque
          en frío, un tirón— esta pantalla se quedaba puesta para siempre: sin
          reintento, sin aviso y sin nada que tocar. Cerrar la app y volver a
          abrirla lo arreglaba, pero eso solo lo sabe quien conoce la app por
          dentro; un taller piensa que el programa no sirve y lo cierra.
          Aparece a los 8 segundos, que es mucho más de lo que tarda el panel
          incluso arrancando en frío. */}
      <div id="tarda" style={{ display: 'none', textAlign: 'center', marginTop: 8 }}>
        <p style={{ color: '#94a3b8', fontSize: 13, margin: '0 0 14px' }}>
          Está tardando más de lo normal.
        </p>
        <a
          href="/dashboard"
          style={{
            display: 'inline-block', background: '#2563eb', color: '#fff',
            fontSize: 14, fontWeight: 600, textDecoration: 'none',
            padding: '10px 22px', borderRadius: 10,
          }}
        >
          Entrar al panel
        </a>
      </div>

      <script
        dangerouslySetInnerHTML={{
          __html: `
            window.location.replace('/dashboard');
            // Si seguimos aquí a los 8 segundos, la navegación no prosperó.
            // No se reintenta sola: cancelar una petición que sigue viva y
            // empezar de cero empeora las conexiones malas, que es justo donde
            // esto pasa. Se le da al usuario un botón y él decide.
            setTimeout(function () {
              var t = document.getElementById('tarda');
              if (t) t.style.display = 'block';
            }, 8000);
          `,
        }}
      />
    </div>
  )
}
