export interface RecordatorioConfig {
  id: string
  taller_id: string
  activo: boolean
  meses_intervalo: 3 | 4 | 5 | 6
  canal: 'whatsapp' | 'email' | 'ambos'
  mensaje_whatsapp: string
  mensaje_email_asunto: string
  mensaje_email_cuerpo: string
  created_at: string
  updated_at: string
}

export interface RecordatorioEnviado {
  id: string
  taller_id: string
  cliente_id: string
  orden_id: string | null
  canal: string
  estado: 'enviado' | 'fallido' | 'respondido'
  fecha_envio: string
  fecha_proxima_accion: string | null
  mensaje_enviado: string | null
  error_detalle: string | null
  created_at: string
  // Joins
  clientes?: {
    nombre: string
    telefono: string
    email: string
  }
}

export interface ClienteParaRecordatorio {
  cliente_id: string
  nombre: string
  telefono: string | null
  email: string | null
  ultima_orden_fecha: string
  ultima_orden_id: string
  vehiculo: string
  meses_desde_ultima_visita: number
}