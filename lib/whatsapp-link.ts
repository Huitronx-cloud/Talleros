// ── Links wa.me — comunicación taller→cliente sin depender de Twilio/Meta ──
// El empleado del taller envía el mensaje con un tap desde SU PROPIO WhatsApp.
// No hay ninguna API de por medio: wa.me solo abre WhatsApp con el número y el
// texto pre-llenados, el envío real lo hace la persona.

// Código de discado por país. Claves en dos formatos porque `talleres.pais` no
// es consistente en todo el código: el registro guarda el código corto (MX,
// CO, PE...) pero otras partes del sistema (ej. el PDF) usan el nombre en
// español. Se aceptan ambos para no depender de cuál esté guardado.
const DIAL_POR_CODIGO: Record<string, string> = {
  MX: '52', CO: '57', AR: '54', PE: '51', CL: '56', EC: '593',
  GT: '502', CR: '506', DO: '1', VE: '58', CA: '1', US: '1',
  BO: '591', PY: '595', UY: '598', HN: '504', SV: '503', PA: '507', NI: '505',
}

const DIAL_POR_NOMBRE: Record<string, string> = {
  mexico: '52', colombia: '57', argentina: '54', peru: '51', chile: '56',
  ecuador: '593', guatemala: '502', 'costa rica': '506',
  'republica dominicana': '1', 'rep. dominicana': '1', venezuela: '58',
  canada: '1', 'estados unidos': '1', bolivia: '591', paraguay: '595',
  uruguay: '598', honduras: '504', 'el salvador': '503', panama: '507',
  nicaragua: '505',
}

function sinAcentos(txt: string): string {
  return txt.normalize('NFD').replace(/[̀-ͯ]/g, '')
}

function dialCodeDelPais(pais?: string | null): string {
  if (!pais) return '52' // fallback México
  const limpio = pais.trim()
  const porCodigo = DIAL_POR_CODIGO[limpio.toUpperCase()]
  if (porCodigo) return porCodigo
  const porNombre = DIAL_POR_NOMBRE[sinAcentos(limpio.toLowerCase())]
  if (porNombre) return porNombre
  return '52'
}

/**
 * Normaliza un teléfono a puros dígitos con código de país, listo para wa.me
 * (wa.me no lleva "+" en la URL). Si el teléfono ya trae código de país
 * (11+ dígitos, o menos si el país del taller usa código corto tipo +1),
 * se respeta tal cual. Si son 10 dígitos (número local sin código de país,
 * el caso más común en México/Colombia/Perú), se le antepone el código del
 * país del taller.
 */
export function normalizarTelefonoWaMe(telefono: string, paisTaller?: string | null): string {
  const soloDigitos = telefono.replace(/\D/g, '')
  if (!soloDigitos) return ''

  const dial = dialCodeDelPais(paisTaller)

  // Ya trae "+" explícito en el original → confiar en que ya está completo
  if (telefono.trim().startsWith('+')) return soloDigitos

  // 10 dígitos = número local sin código de país (convención usada en todo
  // el proyecto, ver lib/twilio.ts normalizarTelefonoWhatsApp)
  if (soloDigitos.length === 10) return `${dial}${soloDigitos}`

  // Cualquier otra longitud: asumimos que ya incluye código de país
  return soloDigitos
}

/**
 * Arma el link wa.me con el teléfono y el mensaje pre-llenado.
 * `telefono` puede venir crudo (con o sin espacios/guiones/código de país);
 * se normaliza aquí mismo. `paisTaller` es opcional y solo se usa como
 * fallback cuando el teléfono no trae código de país (10 dígitos).
 */
export function buildWhatsAppLink(telefono: string, mensaje: string, paisTaller?: string | null): string {
  const numero = normalizarTelefonoWaMe(telefono, paisTaller)
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`
}
