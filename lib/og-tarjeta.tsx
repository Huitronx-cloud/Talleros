/**
 * La tarjeta que WhatsApp enseña al pegar un enlace del taller.
 *
 * Hasta ahora salía la imagen de TallerOS: el cliente de un taller recibía por
 * WhatsApp el anuncio del software que usa su mecánico. La estrella tiene que
 * ser el taller — nosotros brillamos con él, no delante de él.
 *
 * Se genera a 1200×630 y no se manda el logo a secas porque WhatsApp recorta y
 * encoge: un logo cuadrado de 200px se ve como una miniatura triste. Aquí el
 * logo va compuesto sobre una tarjeta del tamaño que WhatsApp espera, con el
 * nombre del taller en grande.
 */

/** Extensiones que satori sabe pintar. SVG y webp quedan fuera a propósito. */
const TIPOS_OK = ['image/png', 'image/jpeg', 'image/jpg']

/**
 * Comprueba que el logo existe y es un formato que se puede pintar.
 *
 * Sin esto, un logo roto o un SVG tumban la generación entera y el enlace se
 * queda sin tarjeta — peor que no tener logo. Devuelve la URL si sirve, null
 * si no, y nunca lanza.
 */
export async function logoUsable(url?: string | null): Promise<string | null> {
  if (!url) return null
  try {
    const res = await fetch(url, { method: 'GET' })
    if (!res.ok) return null
    const tipo = (res.headers.get('content-type') ?? '').split(';')[0].trim().toLowerCase()
    return TIPOS_OK.includes(tipo) ? url : null
  } catch {
    return null
  }
}

/** La inicial del taller, para cuando no hay logo que pintar. */
function inicial(nombre: string): string {
  const limpio = nombre.trim()
  return limpio ? limpio[0].toUpperCase() : '·'
}

interface Props {
  tallerNombre: string
  logoUrl:      string | null
  /** La línea de debajo: "Estado de tu Toyota Corolla", "Historial de servicio"… */
  linea:        string
  /** Placas u otro dato corto. Opcional. */
  pie?:         string | null
}

/**
 * El contenido de la tarjeta. Solo flex: satori no entiende grid, y cualquier
 * div con más de un hijo necesita display flex explícito.
 */
export function TarjetaTaller({ tallerNombre, logoUrl, linea, pie }: Props) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ffffff',
        padding: '60px',
      }}
    >
      {/* Franja superior: el único guiño de color, para que la tarjeta no se
          vea como una hoja en blanco en el hilo de WhatsApp. */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '1200px',
          height: '12px',
          display: 'flex',
          backgroundColor: '#2563eb',
        }}
      />

      {logoUrl ? (
        <img
          src={logoUrl}
          width={280}
          height={160}
          style={{ objectFit: 'contain', marginBottom: '36px' }}
        />
      ) : (
        <div
          style={{
            width: '132px',
            height: '132px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '32px',
            backgroundColor: '#2563eb',
            color: '#ffffff',
            fontSize: '68px',
            fontWeight: 700,
            marginBottom: '36px',
          }}
        >
          {inicial(tallerNombre)}
        </div>
      )}

      <div
        style={{
          display: 'flex',
          fontSize: '64px',
          fontWeight: 700,
          color: '#0f172a',
          textAlign: 'center',
          lineHeight: 1.1,
        }}
      >
        {tallerNombre}
      </div>

      <div
        style={{
          display: 'flex',
          fontSize: '34px',
          color: '#64748b',
          marginTop: '20px',
          textAlign: 'center',
        }}
      >
        {linea}
      </div>

      {pie && (
        <div
          style={{
            display: 'flex',
            fontSize: '26px',
            color: '#94a3b8',
            marginTop: '14px',
          }}
        >
          {pie}
        </div>
      )}
    </div>
  )
}
