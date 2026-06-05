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

export async function enviarWhatsApp(telefono: string, mensaje: string): Promise<void> {
  const telefonoLimpio = telefono.replace(/\D/g, '')
  if (!telefonoLimpio) throw new Error('Teléfono inválido')

  // Asegurar formato internacional
  // 10 dígitos sin código de país → asumir México (+52)
  // 11+ dígitos → ya incluye código de país
  const to = telefonoLimpio.length === 10
    ? `whatsapp:+52${telefonoLimpio}`
    : `whatsapp:+${telefonoLimpio}`

  await getClient().messages.create({
    from: process.env.TWILIO_WHATSAPP_FROM!,
    to,
    body: mensaje,
  })
}
