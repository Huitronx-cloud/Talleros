import QRCode from 'qrcode'
import { buildWhatsAppLink } from './whatsapp-link'

const TEXTO_OPT_IN = 'Hola, quiero recibir actualizaciones de mi auto por WhatsApp'

// Genera un QR (data URL PNG) con un link wa.me de opt-in al WhatsApp del
// taller, para imprimir en el PDF de la orden. Si el taller no configuró su
// número, no hay nada que generar.
export async function generarQrOptInWhatsApp(whatsappNumero?: string | null): Promise<string | null> {
  if (!whatsappNumero?.trim()) return null
  try {
    const link = buildWhatsAppLink(whatsappNumero, TEXTO_OPT_IN)
    return await QRCode.toDataURL(link, { margin: 1, width: 200, errorCorrectionLevel: 'M' })
  } catch (e) {
    console.error('Error generando QR de opt-in WhatsApp:', e)
    return null
  }
}
