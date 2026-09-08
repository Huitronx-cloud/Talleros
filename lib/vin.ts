/**
 * El VIN: validarlo, leer lo que dice por sí mismo, y ordenar lo que
 * responde NHTSA.
 *
 * Todo lo de este archivo es local y no llama a nadie. Es a propósito: un
 * taller sin conexión, o con NHTSA caída, sigue pudiendo comprobar que el VIN
 * está bien escrito y sacarle el año.
 */

/** Las letras que NO existen en un VIN: se confunden con 1 y 0. */
const PROHIBIDAS = ['I', 'O', 'Q']

/** Valor de cada carácter para el dígito de control. */
const VALORES: Record<string, number> = {
  '0': 0, '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
  A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8,
  J: 1, K: 2, L: 3, M: 4, N: 5, P: 7, R: 9,
  S: 2, T: 3, U: 4, V: 5, W: 6, X: 7, Y: 8, Z: 9,
}

const PESOS = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2]

/** Códigos de año de la posición 10, en orden. El ciclo dura 30 años. */
const CODIGOS_ANIO = [
  'A','B','C','D','E','F','G','H','J','K','L','M','N','P','R','S','T','V','W','X','Y',
  '1','2','3','4','5','6','7','8','9',
]

/** Sin espacios ni guiones y en mayúsculas. Lo que se guarda y se compara. */
export function normalizarVin(valor?: string | null): string {
  return (valor ?? '').replace(/[^A-Za-z0-9]/g, '').toUpperCase()
}

/**
 * El dígito que debería ir en la posición 9, calculado a partir de las otras
 * dieciséis. Es lo que convierte un VIN en algo comprobable sin preguntarle a
 * nadie: cambiar un solo carácter lo rompe.
 */
export function digitoControlEsperado(vin: string): string | null {
  const v = normalizarVin(vin)
  if (v.length !== 17) return null

  let total = 0
  for (let i = 0; i < 17; i++) {
    const valor = VALORES[v[i]]
    if (valor === undefined) return null
    total += valor * PESOS[i]
  }

  const resto = total % 11
  return resto === 10 ? 'X' : String(resto)
}

/**
 * Si el dígito de control cuadra.
 *
 * OJO con cómo se usa esto: en Norteamérica es obligatorio, pero en Europa y
 * parte de Asia no todos los fabricantes lo respetan. Por eso NO sirve para
 * rechazar un VIN — solo para avisar. Un VIN que no cuadra casi siempre es un
 * dedazo, pero a veces es un coche legítimo de un fabricante que no sigue la
 * norma, y bloquearlo dejaría al mecánico sin poder trabajar.
 */
export function digitoControlCuadra(vin: string): boolean {
  const v = normalizarVin(vin)
  const esperado = digitoControlEsperado(v)
  return esperado !== null && esperado === v[8]
}

/**
 * Qué le pasa a este VIN, en una frase, o null si está bien.
 *
 * Solo devuelve problema cuando el VIN es IMPOSIBLE (largo o caracteres). El
 * dígito de control se avisa aparte, porque no descalifica.
 */
export function problemaVin(valor?: string | null): string | null {
  const v = normalizarVin(valor)
  if (v.length === 0)  return 'Escribe el VIN.'
  if (v.length !== 17) return `Un VIN tiene 17 caracteres y este tiene ${v.length}.`

  const mala = PROHIBIDAS.find(letra => v.includes(letra))
  if (mala) return `Los VIN no llevan la letra ${mala}. Suele ser un ${mala === 'O' ? '0 (cero)' : '1 (uno)'}.`

  return null
}

/** Un VIN con el que se puede trabajar: 17 caracteres y sin letras imposibles. */
export function vinValido(valor?: string | null): boolean {
  return problemaVin(valor) === null
}

/**
 * Los años que puede tener este VIN según su posición 10.
 *
 * El código se repite cada 30 años, así que una "N" es 1992 O 2022. NHTSA se
 * equivocó con esto en un Virtus de 2022 y respondió 1992, sin marca de duda.
 * Aquí se devuelven los dos y se elige el más reciente que no esté en el
 * futuro, que es el que acierta en la práctica: los coches de hace treinta
 * años casi nunca llegan a un taller con el VIN completo capturado.
 */
export function aniosPosibles(vin: string): number[] {
  const v = normalizarVin(vin)
  if (v.length !== 17) return []

  const indice = CODIGOS_ANIO.indexOf(v[9])
  if (indice === -1) return []

  const limite = new Date().getFullYear() + 1
  const anios: number[] = []
  // 1980 es el primer año del esquema moderno de 17 caracteres.
  for (let anio = 1980 + indice; anio <= limite; anio += 30) anios.push(anio)

  return anios
}

/** El año más probable: el más reciente que no esté en el futuro. */
export function anioProbable(vin: string): number | null {
  const anios = aniosPosibles(vin)
  return anios.length > 0 ? anios[anios.length - 1] : null
}

// ── NHTSA ───────────────────────────────────────────────────────────────────

/** Lo que devuelve NHTSA, quedándonos con lo que sirve en un taller. */
export interface DatosVin {
  marca:       string | null
  modelo:      string | null
  anio:        number | null
  motor:       string | null
  version:     string | null
  transmision: string | null
  traccion:    string | null
  carroceria:  string | null
  rin:         string | null
  fabricante:  string | null
  planta:      string | null
  /**
   * NHTSA decodificó el VIN entero sin dudas (su ErrorCode "0"). Cualquier
   * otro código significa que rellenó lo que pudo, y entonces los datos se
   * enseñan marcados para que la persona los verifique.
   *
   * Esto no se puede deducir mirando si los campos vienen llenos: un Jetta con
   * ErrorCode "5,14" trajo el motor perfecto y una NP300 con el MISMO código
   * trajo una cilindrada equivocada.
   */
  limpio: boolean
}

function texto(valor: unknown): string | null {
  const t = String(valor ?? '').trim()
  return t === '' ? null : t
}

/**
 * El motor en una línea, armado con lo que haya.
 *
 * Cada fabricante manda campos distintos, y por eso no se puede depender de
 * uno solo: el Jetta trajo el motor en `EngineModel` ("1.4 TSI") con la
 * cilindrada vacía, y el Kia lo trajo repartido entre cilindrada, cilindros y
 * configuración. Se junta lo que exista y, si no existe nada, se dice.
 */
export function motorLegible(r: Record<string, unknown>): string | null {
  const partes: string[] = []

  const modelo = texto(r.EngineModel)
  if (modelo) partes.push(modelo)

  const litros = texto(r.DisplacementL)
  if (litros) {
    const n = Number(litros)
    if (Number.isFinite(n) && n > 0) partes.push(`${n.toFixed(1)}L`)
  }

  const cilindros = texto(r.EngineCylinders)
  if (cilindros) partes.push(`${cilindros} cil.`)

  const config = texto(r.EngineConfiguration)
  if (config) partes.push(config === 'In-Line' ? 'en línea' : config)

  if (texto(r.Turbo) === 'Yes') partes.push('turbo')

  const valvulas = texto(r.ValveTrainDesign)
  if (valvulas) partes.push(valvulas.includes('DOHC') ? 'DOHC' : valvulas)

  const combustible = texto(r.FuelTypePrimary)
  if (combustible) partes.push(combustible === 'Gasoline' ? 'gasolina' : combustible)

  return partes.length > 0 ? partes.join(' · ') : null
}

/** La transmisión, juntando estilo y número de velocidades. */
function transmisionLegible(r: Record<string, unknown>): string | null {
  const estilo = texto(r.TransmissionStyle)
  const veloc  = texto(r.TransmissionSpeeds)
  if (!estilo && !veloc) return null

  const nombre = estilo
    ? estilo.replace('Manual/Standard', 'Manual').replace('Automatic', 'Automática')
    : null

  return [nombre, veloc ? `${veloc} vel.` : null].filter(Boolean).join(' · ')
}

/**
 * El catálogo de refacciones que abre el botón.
 *
 * BuscaRefacciones cruza 39 catálogos, es mexicano y es gratis para talleres,
 * que es exactamente el público de esto. Lo eligió el dueño del producto.
 */
export const CATALOGO_REFACCIONES = 'https://buscarefacciones.com/'

/**
 * El coche en una línea, lista para pegar en el buscador del catálogo.
 *
 * Se copia al portapapeles al abrir el catálogo en vez de meter los datos en
 * la URL, y es una decisión, no una limitación aceptada a medias: no sabemos
 * si el buscador acepta el vehículo por parámetros o lo guarda en la sesión, y
 * un enlace con parámetros inventados lleva a una página vacía o a un 404.
 * Copiar y pegar funciona con cualquier catálogo, hoy y si mañana se cambia.
 *
 * Si resulta que sí se puede enlazar directo, esto se sustituye por la URL con
 * parámetros y el mecánico se ahorra el pegado.
 */
export function textoParaCatalogo(partes: {
  marca?: string | null
  modelo?: string | null
  anio?: number | null
  motor?: string | null
}): string | null {
  const texto = [partes.anio, partes.marca, partes.modelo, partes.motor]
    .map(p => String(p ?? '').trim())
    .filter(p => p !== '' && p !== '0')
    .join(' ')

  return texto === '' ? null : texto
}

/** De la respuesta cruda de NHTSA a lo que enseñamos. */
export function mapearNhtsa(r: Record<string, unknown>): DatosVin {
  const anioTexto = texto(r.ModelYear)
  const anio      = anioTexto && Number(anioTexto) > 1900 ? Number(anioTexto) : null

  const rinDelante = texto(r.WheelSizeFront)

  return {
    marca:       texto(r.Make),
    modelo:      texto(r.Model),
    anio,
    motor:       motorLegible(r),
    version:     texto(r.Trim),
    transmision: transmisionLegible(r),
    traccion:    texto(r.DriveType),
    carroceria:  texto(r.BodyClass),
    rin:         rinDelante ? `${rinDelante}"` : null,
    fabricante:  texto(r.Manufacturer),
    planta:      [texto(r.PlantCity), texto(r.PlantCountry)].filter(Boolean).join(', ') || null,
    limpio:      texto(r.ErrorCode) === '0',
  }
}
