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
  whatsapp_numero: string | null
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
  /** Sembrado al registrar el taller: se enseña como muestra y no gasta cupo. */
  es_ejemplo: boolean
  created_at: string
}

export type ClienteForm = Omit<Cliente, 'id' | 'taller_id' | 'created_at' | 'es_ejemplo'>

/**
 * Un coche del cliente. Antes vivía dentro de la ficha del cliente en columnas
 * sueltas, y por eso solo cabía uno: un taller con clientes de confianza
 * atiende el coche del señor, el de su esposa y la camioneta del negocio.
 *
 * Las órdenes conservan SU copia de estos datos: son el registro de lo que
 * entró al taller ese día. Esto es el presente; la orden es la historia.
 */
export interface Vehiculo {
  id:         string
  taller_id:  string
  cliente_id: string
  marca:      string | null
  modelo:     string | null
  anio:       number | null
  placas:     string | null
  vin:        string | null
  foto_url:   string | null
  notas:      string | null
  /** Quitar un vehículo no borra sus órdenes: se archiva y deja de ofrecerse. */
  archivado:  boolean
  created_at: string
}

export type VehiculoForm = Pick<Vehiculo, 'marca' | 'modelo' | 'anio' | 'placas' | 'vin' | 'notas'>

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

// ── CRM interno TallerOS (prospección + WhatsApp entrante) ──
export type OrigenLead = 'prospeccion' | 'whatsapp_inbound'
export type EtapaLead  = 'nuevo' | 'contactado' | 'interesado' | 'negociacion' | 'cliente' | 'descartado'
export type SentidoMensaje = 'entrante' | 'saliente'

export interface Lead {
  id: string
  nombre: string | null
  telefono: string | null
  email: string | null
  direccion: string | null
  ciudad: string | null
  pais: string | null
  google_place_id: string | null
  website: string | null
  origen: OrigenLead
  etapa: EtapaLead
  notas: string | null
  created_at: string
  updated_at: string
}

export interface MensajeCRM {
  id: string
  lead_id: string
  sentido: SentidoMensaje
  mensaje: string
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
  /** Sembrada al registrar el taller: se enseña como muestra y no gasta cupo. */
  es_ejemplo: boolean
  created_at: string
  clientes?: { nombre: string; telefono: string | null } | null
}
