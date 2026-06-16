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

  // 10 dígitos = México (+52), cualquier otra longitud ya trae código de país
  const to = telefonoLimpio.length === 10
    ? `whatsapp:+52${telefonoLimpio}`
    : `whatsapp:+${telefonoLimpio}`

  const from = process.env.TWILIO_WHATSAPP_FROM!
  await getClient().messages.create({
    from: from.startsWith('whatsapp:') ? from : `whatsapp:${from}`,
    to,
    body: mensaje,
  })
}
