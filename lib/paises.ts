// ── País → moneda e impuesto ──────────────────────────────────────────────────
//
// Fuente única. Existe porque el país se guarda en dos formatos distintos según
// por dónde entró el taller: el formulario de registro guarda el código ISO
// ('AR', 'MX', 'PE') y las altas viejas guardaron el nombre en español
// ('México'). La tabla de IVA estaba indexada solo por nombre, así que para
// TODOS los talleres registrados por el formulario la búsqueda fallaba en
// silencio y caía al 16% por defecto:
//
//   - Argentina cobraba 16% en vez de 21%
//   - Colombia    16% en vez de 19%
//   - Perú        16% y con la etiqueta "IVA" en vez de "IGV 18%"
//   - México salía bien de pura casualidad, porque su tasa es la del default
//
// Aquí se acepta cualquiera de los dos formatos y se normaliza antes de buscar.
// Añadir un país es añadir una fila.

export interface DatosPais {
  nombre:   string
  moneda:   string
  tasa:     number
  etiqueta: string
  /** Zona IANA, para mandar la hora correcta a Google Calendar. */
  zona:     string
}

const PAISES: Record<string, DatosPais> = {
  MX: { nombre: 'México',               moneda: 'MXN', tasa: 0.16, etiqueta: 'IVA 16%', zona: 'America/Mexico_City' },
  CO: { nombre: 'Colombia',             moneda: 'COP', tasa: 0.19, etiqueta: 'IVA 19%', zona: 'America/Bogota' },
  AR: { nombre: 'Argentina',            moneda: 'ARS', tasa: 0.21, etiqueta: 'IVA 21%', zona: 'America/Argentina/Buenos_Aires' },
  CL: { nombre: 'Chile',                moneda: 'CLP', tasa: 0.19, etiqueta: 'IVA 19%', zona: 'America/Santiago' },
  PE: { nombre: 'Perú',                 moneda: 'PEN', tasa: 0.18, etiqueta: 'IGV 18%', zona: 'America/Lima' },
  EC: { nombre: 'Ecuador',              moneda: 'USD', tasa: 0.15, etiqueta: 'IVA 15%', zona: 'America/Guayaquil' },
  VE: { nombre: 'Venezuela',            moneda: 'USD', tasa: 0.16, etiqueta: 'IVA 16%', zona: 'America/Caracas' },
  BO: { nombre: 'Bolivia',              moneda: 'BOB', tasa: 0.13, etiqueta: 'IVA 13%', zona: 'America/La_Paz' },
  PY: { nombre: 'Paraguay',             moneda: 'PYG', tasa: 0.10, etiqueta: 'IVA 10%', zona: 'America/Asuncion' },
  UY: { nombre: 'Uruguay',              moneda: 'UYU', tasa: 0.22, etiqueta: 'IVA 22%', zona: 'America/Montevideo' },
  GT: { nombre: 'Guatemala',            moneda: 'GTQ', tasa: 0.12, etiqueta: 'IVA 12%', zona: 'America/Guatemala' },
  CR: { nombre: 'Costa Rica',           moneda: 'CRC', tasa: 0.13, etiqueta: 'IVA 13%', zona: 'America/Costa_Rica' },
  PA: { nombre: 'Panamá',               moneda: 'USD', tasa: 0.07, etiqueta: 'ITBMS 7%', zona: 'America/Panama' },
  HN: { nombre: 'Honduras',             moneda: 'HNL', tasa: 0.15, etiqueta: 'ISV 15%', zona: 'America/Tegucigalpa' },
  SV: { nombre: 'El Salvador',          moneda: 'USD', tasa: 0.13, etiqueta: 'IVA 13%', zona: 'America/El_Salvador' },
  NI: { nombre: 'Nicaragua',            moneda: 'NIO', tasa: 0.15, etiqueta: 'IVA 15%', zona: 'America/Managua' },
  DO: { nombre: 'República Dominicana', moneda: 'DOP', tasa: 0.18, etiqueta: 'ITBIS 18%', zona: 'America/Santo_Domingo' },
  US: { nombre: 'Estados Unidos',       moneda: 'USD', tasa: 0,    etiqueta: 'Sin impuesto', zona: 'America/New_York' },
  CA: { nombre: 'Canadá',               moneda: 'CAD', tasa: 0.05, etiqueta: 'GST 5%', zona: 'America/Toronto' },
}

// Ecuador, Venezuela, Panamá y El Salvador operan en dólares: no llevan moneda
// propia en la tabla de arriba a propósito, no es un olvido.

const POR_NOMBRE: Record<string, string> = Object.fromEntries(
  Object.entries(PAISES).map(([codigo, d]) => [normalizar(d.nombre), codigo])
)

/** Minúsculas y sin acentos, para que 'Perú', 'peru' y 'PERU' sean lo mismo. */
function normalizar(txt: string): string {
  // \u0300-\u036f y no los caracteres combinantes literales: escritos tal cual
  // se pierden al copiar el archivo entre editores y la regex deja de funcionar
  // sin dar error.
  return txt.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

const POR_DEFECTO: DatosPais = PAISES.MX

/**
 * Datos de un país aceptando código ISO ('AR') o nombre ('Argentina', 'peru').
 * Sin coincidencia devuelve México, que es de donde viene la mayoría.
 */
export function getPais(pais?: string | null): DatosPais {
  if (!pais) return POR_DEFECTO
  const limpio = pais.trim()
  const porCodigo = PAISES[limpio.toUpperCase()]
  if (porCodigo) return porCodigo
  const codigo = POR_NOMBRE[normalizar(limpio)]
  return codigo ? PAISES[codigo] : POR_DEFECTO
}

/**
 * Código ISO de un país aceptando código o nombre. Sin coincidencia, 'MX'.
 *
 * Existe para que nadie más tenga que repetir la tabla de nombres: antes
 * `lib/whatsapp-link.ts` llevaba su propia copia con los veinte países en
 * español, y mantener dos listas es mantener una que se queda atrás.
 */
export function codigoDePais(pais?: string | null): string {
  if (!pais) return 'MX'
  const limpio = pais.trim()
  if (PAISES[limpio.toUpperCase()]) return limpio.toUpperCase()
  return POR_NOMBRE[normalizar(limpio)] ?? 'MX'
}

/** Moneda que le corresponde a un país. */
export function monedaDePais(pais?: string | null): string {
  return getPais(pais).moneda
}

/** Lista para selectores, ordenada por nombre. */
export function listaPaises(): Array<{ codigo: string } & DatosPais> {
  return Object.entries(PAISES)
    .map(([codigo, d]) => ({ codigo, ...d }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
}
