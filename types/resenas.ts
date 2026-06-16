export interface ResenaConfig {
  id: string
  taller_id: string
  activo: boolean
  canal: 'whatsapp' | 'email' | 'ambos'
  horas_espera: number
  google_review_url: string
  mensaje_whatsapp: string
  mensaje_email_asunto: string
  mensaje_email_cuerpo: string
  created_at: string
  updated_at: string
}

export interface ResenaEnviada {
  id: string
  taller_id: string
  cliente_id: string
  orden_id: string
  canal: string
  estado: 'enviado' | 'fallido'
  enviado_at: string
  mensaje_enviado: string | null
  error_detalle: string | null
  created_at: string
  clientes?: {
    nombre: string
    telefono: string
    email: string
  }
}