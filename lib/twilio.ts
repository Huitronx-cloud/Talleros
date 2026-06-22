import twilio from 'twilio'

let _client: ReturnType<typeof twilio> | null = null

function getClient() {
  if (!_client) {
    _client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    )
  }
  return _client
}

const ERRORES_TWILIO: Record<number, string> = {
  63016: 'El cliente no ha escrito al WhatsApp del taller en las últimas 24 horas, así que no se le puede enviar este mensaje todavía.',
  21211: 'El número de teléfono no es válido.',
  21408: 'El taller no tiene permiso para enviar WhatsApp a este número.',
  20429: 'Se alcanzó el límite de mensajes por minuto. Intenta de nuevo en un momento.',
  63018: 'Se alcanzó el límite de mensajes de WhatsApp del taller. Intenta más tarde.',
}

export function mapearErrorTwilio(err: any): string {
  const mensajeClaro = ERRORES_TWILIO[err?.code]
  return mensajeClaro ?? err?.message ?? 'No se pudo enviar el mensaje de WhatsApp'
}

export function normalizarTelefonoWhatsApp(telefono: string): string {
  const telefonoLimpio = telefono.replace(/\D/g, '')
  // 10 dígitos = México (+52), cualquier otra longitud ya trae código de país
  return telefonoLimpio.length === 10
    ? `whatsapp:+52${telefonoLimpio}`
    : `whatsapp:+${telefonoLimpio}`
}

// El From y el To de Twilio deben usar el mismo "canal" (whatsapp:+... en ambos
// lados) o falla con "Invalid From and To pair". TWILIO_WHATSAPP_FROM se guarda
// sin el prefijo, así que hay que añadirlo siempre antes de usarlo como From.
export function normalizarFromWhatsApp(from: string): string {
  return from.startsWith('whatsapp:') ? from : `whatsapp:${from}`
}

export async function enviarWhatsApp(telefono: string, mensaje: string): Promise<void> {
  const telefonoLimpio = telefono.replace(/\D/g, '')
  if (!telefonoLimpio) throw new Error('Teléfono inválido')

  const to   = normalizarTelefonoWhatsApp(telefono)
  const from = normalizarFromWhatsApp(process.env.TWILIO_WHATSAPP_FROM!)

  try {
    await getClient().messages.create({
      from,
      to,
      body: mensaje,
    })
  } catch (err: any) {
    throw new Error(mapearErrorTwilio(err))
  }
}
