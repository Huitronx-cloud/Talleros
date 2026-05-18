export type Plan = 'gratis' | 'basico' | 'pro'

export type RolUsuario = 'propietario' | 'admin' | 'tecnico' | 'recepcion'

export interface Taller {
  id: string
  nombre: string
  telefono: string | null
  ciudad: string | null
  pais: string | null
  plan: Plan
  direccion: string | null
  email: string | null
  logo_url: string | null
  moneda: string
  vigencia_dias: number
  google_review_url: string | null
  horario: string | null
  instagram: string | null
  facebook: string | null
  firma_pdf: string | null
  created_at: string
}

export type EstadoCotizacion = 'borrador' | 'enviada' | 'aprobada' | 'rechazada'

export interface Cotizacion {
  id: string
  taller_id: string
  cliente_id: string | null
  orden_id: string | null
  numero_cotizacion: number
  servicios: ServicioItem[]
  subtotal: number
  descuento: number
  impuestos: number
  total: number
  moneda: string
  estado: EstadoCotizacion
  notas: string | null
  vigencia_dias: number
  created_at: string
  clientes?: { nombre: string; telefono: string | null; email: string | null } | null
}

export interface Usuario {
  id: string
  taller_id: string
  nombre: string
  email: string
  rol: RolUsuario
  created_at: string
}

export interface Sesion {
  usuario: Usuario
  taller: Taller
}

export interface Cliente {
  id: string
  taller_id: string
  nombre: string
  telefono: string | null
  email: string | null
  vehiculo_marca: string | null
  vehiculo_modelo: string | null
  vehiculo_año: number | null
  placas: string | null
  vin: string | null
  notas: string | null
  foto_vehiculo_url: string | null
  created_at: string
}

export type ClienteForm = Omit<Cliente, 'id' | 'taller_id' | 'created_at'>

export type EstadoOrden = 'recibido' | 'en_proceso' | 'listo' | 'entregado'
export type FormaPago   = 'efectivo' | 'transferencia' | 'tarjeta'

export interface ServicioItem {
  descripcion: string
  cantidad: number
  precio_unitario: number
  total: number
}

export interface HistorialItem {
  estado: EstadoOrden
  fecha: string
  nota?: string
}

export type TipoNotificacion = 'orden_lista' | 'recordatorio' | 'seguimiento'
export type EstadoNotificacion = 'pendiente' | 'enviada' | 'fallida'

export interface Notificacion {
  id: string
  taller_id: string
  orden_id: string | null
  cliente_id: string | null
  tipo: TipoNotificacion
  mensaje: string
  estado: EstadoNotificacion
  error_mensaje: string | null
  created_at: string
}

export interface Orden {
  id: string
  taller_id: string
  cliente_id: string | null
  numero_orden: number
  vehiculo_marca: string | null
  vehiculo_modelo: string | null
  vehiculo_año: number | null
  placas: string | null
  vin: string | null
  kilometraje: number | null
  descripcion_problema: string | null
  diagnostico: string | null
  servicios_realizados: ServicioItem[]
  mecanico_asignado: string | null
  estado: EstadoOrden
  fecha_entrada: string
  fecha_prometida: string | null
  fecha_entrega: string | null
  subtotal: number
  descuento: number
  impuestos: number
  tasa_iva: number
  total: number
  moneda?: string | null
  forma_pago: FormaPago
  cobrado: boolean
  fecha_cobro: string | null
  notas_internas: string | null
  historial: HistorialItem[]
  created_at: string
  clientes?: { nombre: string; telefono: string | null } | null
}
