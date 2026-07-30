// ── Agente de ventas/soporte de TallerOS por WhatsApp ─────────────────────────
// Reúsa el conocimiento de "Taller AI" pero orientado a PROSPECTOS que escriben
// por WhatsApp preguntando por el producto. Responde de verdad (precios, países,
// funciones, cómo empezar) y marca cuándo pasar el hilo a un humano.

const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY!

const SYSTEM_PROMPT = `Eres el asistente de ventas de TallerOS por WhatsApp. Le escribes a dueños de taller mecánico que preguntan por el producto. Tu meta: resolver su duda al instante y acercarlos a probarlo gratis.

QUÉ ES TALLEROS: software para digitalizar un taller mecánico — órdenes de trabajo, clientes y vehículos, cotizaciones, inventario, citas con página pública, reportes, y comunicación con el cliente por WhatsApp (avisos, aprobación de cotizaciones, portal del cliente, reseñas de Google).

DÓNDE FUNCIONA: en toda Latinoamérica EXCEPTO Brasil (México, Colombia, Perú, Costa Rica, Argentina, Chile, Ecuador, etc.). Precios en dólares (USD).

PRECIOS:
- Plan Esencial: 24 USD/mes — funciones base.
- Plan Pro: 49 USD/mes — todo + automatizaciones (recordatorios de mantenimiento, reseñas automáticas de Google, promociones masivas).
- 14 días GRATIS, sin tarjeta de crédito.
- Para empezar: https://www.tallerosapp.com/registro

CÓMO RESPONDES (es WhatsApp, no un correo):
- Español, cercano y directo. MUY breve: 2 a 4 líneas máximo.
- Responde EXACTAMENTE lo que preguntan. Si preguntan precio, da el precio. Si preguntan si sirve en su país, responde directo.
- Máximo 1-2 emojis.
- Cuando tenga sentido, invita a probar gratis con el link de registro.
- NUNCA inventes funciones, precios ni datos. Si no estás seguro, dilo y escala.

CUÁNDO ESCALAR A UN HUMANO (escalar = true):
- Quiere contratar, pagar o pide hablar con una persona.
- Pide algo especial: descuento, factura particular, migrar sus datos, una demo en vivo.
- Hace una pregunta que no puedes responder con certeza.
- Se muestra molesto o con un problema serio.

FORMATO DE SALIDA — responde SOLO con un objeto JSON válido, sin nada de texto antes o después:
{"respuesta": "<el mensaje que se le enviará al prospecto por WhatsApp>", "escalar": <true o false>, "motivo": "<breve, por qué escalas; vacío si no escalas>"}
Si escalas, en "respuesta" incluye un puente amable ("déjame conectarte con el equipo, te escriben en un momento 👌") además de lo que sí puedas adelantar.`

export interface RespuestaAgente {
  respuesta: string
  escalar:   boolean
  motivo:    string
}

type Turno = { role: 'user' | 'assistant'; content: string }

// Convierte el historial del CRM (crm_mensajes) en turnos alternados para la API
// de Anthropic: 'entrante' = user, 'saliente' = assistant. Fusiona mensajes
// consecutivos del mismo lado y garantiza que arranque con el usuario.
export function construirMensajesIA(hist: { sentido: string; mensaje: string }[]): Turno[] {
  const msgs: Turno[] = []
  for (const h of hist) {
    const role: 'user' | 'assistant' = h.sentido === 'saliente' ? 'assistant' : 'user'
    const content = (h.mensaje ?? '').trim()
    if (!content) continue
    const last = msgs[msgs.length - 1]
    if (last && last.role === role) {
      last.content += '\n' + content
    } else {
      msgs.push({ role, content })
    }
  }
  while (msgs.length && msgs[0].role === 'assistant') msgs.shift()
  return msgs
}

// Detecta contestadores automáticos de OTROS negocios para no entrar en un
// bucle "dos bots hablándose" (pasaba: el bot le mandaba el link de la demo al
// auto-respondedor de otro taller).
export function pareceMensajeAutomatico(mensaje: string): boolean {
  const m = mensaje.toLowerCase()
  const señales = [
    'gracias por comunicarte', 'gracias por tu mensaje', 'gracias por contactarnos',
    'gracias por escribir', 'fuera de horario', 'horario laboral', 'horario de atención',
    'no podemos responder', 'lo antes posible', 'a la brevedad', 'bienvenido a',
    'estás hablando con', 'cómo podemos ayudarte', 'en qué te podemos', 'en q te podemos',
    'lun-vie', 'lunes a viernes', 'lunes a sábado', 'lun a sab', 'lun a sáb',
    'nuestro horario', 'responderemos', 'te responderemos',
  ]
  return señales.some(s => m.includes(s))
}

function parseRespuesta(texto: string): RespuestaAgente {
  try {
    const match = texto.match(/\{[\s\S]*\}/)
    if (match) {
      const obj = JSON.parse(match[0])
      return {
        respuesta: String(obj.respuesta ?? '').trim(),
        escalar:   Boolean(obj.escalar),
        motivo:    String(obj.motivo ?? '').trim(),
      }
    }
  } catch {
    // cae al fallback
  }
  // Si el modelo no devolvió JSON, usamos el texto tal cual como respuesta.
  return { respuesta: texto.trim(), escalar: false, motivo: '' }
}

export async function generarRespuestaWhatsApp(messages: Turno[]): Promise<RespuestaAgente> {
  if (messages.length === 0) {
    return { respuesta: '', escalar: true, motivo: 'sin contenido' }
  }
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model:      'claude-haiku-4-5-20251001',
        max_tokens: 400,
        system:     SYSTEM_PROMPT,
        messages,
      }),
    })
    const data = await res.json()
    if (!res.ok) {
      return { respuesta: '', escalar: true, motivo: `Error IA: ${data.error?.message ?? 'API'}` }
    }
    const texto = data.content?.[0]?.text ?? ''
    return parseRespuesta(texto)
  } catch (e: any) {
    return { respuesta: '', escalar: true, motivo: `Excepción IA: ${e?.message ?? 'desconocida'}` }
  }
}
