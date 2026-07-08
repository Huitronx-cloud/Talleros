import { EstadoOrden } from '@/types'

export type PlantillaWhatsApp =
  | 'recibido'
  | 'diagnostico_listo'
  | 'en_progreso'
  | 'listo_entrega'
  | 'garantia'

export const PLANTILLA_LABEL: Record<PlantillaWhatsApp, string> = {
  recibido:           'Vehículo recibido',
  diagnostico_listo:  'Diagnóstico listo · aprobación',
  en_progreso:        'Reparación en progreso',
  listo_entrega:      'Listo para entrega',
  garantia:           'Garantía digital',
}

// Plantilla sugerida según el estatus actual de la orden. Se usa solo para
// preseleccionar — el empleado del taller puede cambiarla libremente en el modal.
export const ESTADO_PLANTILLA_DEFAULT: Record<EstadoOrden, PlantillaWhatsApp> = {
  recibido:   'recibido',
  en_proceso: 'diagnostico_listo',
  listo:      'listo_entrega',
  entregado:  'garantia',
}

export interface DatosPlantillaWhatsApp {
  clienteNombre:   string
  vehiculoMarca?:  string | null
  vehiculoModelo?: string | null
  placas?:         string | null
  tallerNombre:    string
  portalUrl?:      string | null
  garantiaDias?:   number | null
  garantiaKm?:     number | null
}

function nombreVehiculo(marca?: string | null, modelo?: string | null): string {
  return [marca, modelo].filter(Boolean).join(' ') || 'tu vehículo'
}

function conPlacas(vehiculo: string, placas?: string | null): string {
  return placas ? `${vehiculo} (placas ${placas})` : vehiculo
}

function primerNombre(nombre: string): string {
  return nombre.trim().split(/\s+/)[0] ?? nombre
}

function lineaPortal(portalUrl?: string | null): string {
  return portalUrl ? `\n\n🔗 Sigue el estado en tiempo real aquí:\n${portalUrl}` : ''
}

function firma(tallerNombre: string): string {
  return `\n\n— ${tallerNombre}`
}

// ── Plantillas ────────────────────────────────────────────────────────────────

function mensajeRecibido(d: DatosPlantillaWhatsApp): string {
  const vehiculo = conPlacas(nombreVehiculo(d.vehiculoMarca, d.vehiculoModelo), d.placas)
  return `Hola ${primerNombre(d.clienteNombre)} 👋 Te confirmamos que ya recibimos tu ${vehiculo} en *${d.tallerNombre}*. En breve nuestro equipo revisará el vehículo y te avisamos con el diagnóstico.${lineaPortal(d.portalUrl)}${firma(d.tallerNombre)}`
}

function mensajeDiagnosticoListo(d: DatosPlantillaWhatsApp): string {
  const vehiculo = conPlacas(nombreVehiculo(d.vehiculoMarca, d.vehiculoModelo), d.placas)
  return `Hola ${primerNombre(d.clienteNombre)} 🔧 Ya terminamos el diagnóstico de tu ${vehiculo}. Puedes ver las fotos y el detalle de la reparación propuesta, y aprobarla directamente desde el link.${lineaPortal(d.portalUrl)}\n\nCualquier duda, respóndenos por este medio.${firma(d.tallerNombre)}`
}

function mensajeEnProgreso(d: DatosPlantillaWhatsApp): string {
  const vehiculo = conPlacas(nombreVehiculo(d.vehiculoMarca, d.vehiculoModelo), d.placas)
  return `Hola ${primerNombre(d.clienteNombre)} 👋 Solo para mantenerte al tanto: tu ${vehiculo} sigue en proceso de reparación en *${d.tallerNombre}*. Te avisamos en cuanto esté listo para recoger.${lineaPortal(d.portalUrl)}${firma(d.tallerNombre)}`
}

function mensajeListoEntrega(d: DatosPlantillaWhatsApp): string {
  const vehiculo = conPlacas(nombreVehiculo(d.vehiculoMarca, d.vehiculoModelo), d.placas)
  return `Hola ${primerNombre(d.clienteNombre)} ✅ Tu ${vehiculo} ya está listo para recoger en *${d.tallerNombre}*. Te esperamos en nuestro horario de atención.${lineaPortal(d.portalUrl)}${firma(d.tallerNombre)}`
}

function mensajeGarantia(d: DatosPlantillaWhatsApp): string {
  const vehiculo = conPlacas(nombreVehiculo(d.vehiculoMarca, d.vehiculoModelo), d.placas)
  const dias = d.garantiaDias ?? 30
  const km   = d.garantiaKm   ?? 1000
  return `Hola ${primerNombre(d.clienteNombre)} ✅ Tu ${vehiculo} fue entregado por *${d.tallerNombre}*.\n\n🛡 Tu reparación cuenta con garantía de ${dias} días o ${km} km, lo que ocurra primero. Guarda este mensaje como comprobante.${lineaPortal(d.portalUrl)}${firma(d.tallerNombre)}`
}

export const PLANTILLAS_WHATSAPP: Record<PlantillaWhatsApp, (d: DatosPlantillaWhatsApp) => string> = {
  recibido:          mensajeRecibido,
  diagnostico_listo: mensajeDiagnosticoListo,
  en_progreso:       mensajeEnProgreso,
  listo_entrega:     mensajeListoEntrega,
  garantia:          mensajeGarantia,
}

export function construirMensajeWhatsApp(plantilla: PlantillaWhatsApp, datos: DatosPlantillaWhatsApp): string {
  return PLANTILLAS_WHATSAPP[plantilla](datos)
}

// ── Contextos — envíos wa.me atados a una acción concreta, no al estatus ─────
// Mismo esquema que las plantillas por estado: el mensaje se pre-llena, el
// empleado lo edita si quiere y lo manda desde su propio WhatsApp.

export type ContextoWhatsApp =
  | 'fotos_diagnostico'
  | 'portal_cliente'
  | 'pdf_servicio'
  | 'aprobacion_extra'

export interface DatosContextoWhatsApp extends DatosPlantillaWhatsApp {
  fotos?:         { url: string; descripcion: string }[]
  pdfUrl?:        string | null
  totalFmt?:      string | null
  servicioExtra?: string | null
  costoExtraFmt?: string | null
}

function mensajeFotosDiagnostico(d: DatosContextoWhatsApp): string {
  const vehiculo = conPlacas(nombreVehiculo(d.vehiculoMarca, d.vehiculoModelo), d.placas)
  const lista = (d.fotos ?? [])
    .map((f, i) => `${i + 1}. ${f.descripcion || 'Foto del diagnóstico'}\n${f.url}`)
    .join('\n\n')
  return `Hola ${primerNombre(d.clienteNombre)} 📷 Te compartimos las fotos del diagnóstico de tu ${vehiculo} en *${d.tallerNombre}*:\n\n${lista}\n\nCualquier duda, respóndenos por este medio.${lineaPortal(d.portalUrl)}${firma(d.tallerNombre)}`
}

function mensajePortalCliente(d: DatosContextoWhatsApp): string {
  const vehiculo = conPlacas(nombreVehiculo(d.vehiculoMarca, d.vehiculoModelo), d.placas)
  return `Hola ${primerNombre(d.clienteNombre)} 👋 *${d.tallerNombre}* ya está atendiendo tu ${vehiculo}.\n\nSigue el estado de tu servicio en tiempo real aquí:\n🔗 ${d.portalUrl ?? ''}\n\nCualquier duda, respóndenos por este medio.${firma(d.tallerNombre)}`
}

function mensajePdfServicio(d: DatosContextoWhatsApp): string {
  const vehiculo = conPlacas(nombreVehiculo(d.vehiculoMarca, d.vehiculoModelo), d.placas)
  const total = d.totalFmt ? `\n\n💰 Total: ${d.totalFmt}` : ''
  return `Hola ${primerNombre(d.clienteNombre)} 📄 Aquí está el reporte de servicio de tu ${vehiculo} en *${d.tallerNombre}*.${total}\n\nDescarga el PDF con el detalle completo aquí:\n${d.pdfUrl ?? ''}\n\n¡Gracias por preferirnos! 🙏${firma(d.tallerNombre)}`
}

function mensajeAprobacionExtra(d: DatosContextoWhatsApp): string {
  const vehiculo = conPlacas(nombreVehiculo(d.vehiculoMarca, d.vehiculoModelo), d.placas)
  const costo = d.costoExtraFmt ? `\n💰 Costo adicional: ${d.costoExtraFmt}` : ''
  return `Hola ${primerNombre(d.clienteNombre)} 🔧 Durante el servicio de tu ${vehiculo} en *${d.tallerNombre}* detectamos un trabajo adicional necesario:\n\n*${d.servicioExtra ?? ''}*${costo}\n\n¿Nos autorizas a realizarlo? Responde *SÍ* o *NO* a este mensaje.${lineaPortal(d.portalUrl)}${firma(d.tallerNombre)}`
}

export const PLANTILLAS_CONTEXTO: Record<ContextoWhatsApp, (d: DatosContextoWhatsApp) => string> = {
  fotos_diagnostico: mensajeFotosDiagnostico,
  portal_cliente:    mensajePortalCliente,
  pdf_servicio:      mensajePdfServicio,
  aprobacion_extra:  mensajeAprobacionExtra,
}

export function construirMensajeContexto(contexto: ContextoWhatsApp, datos: DatosContextoWhatsApp): string {
  return PLANTILLAS_CONTEXTO[contexto](datos)
}
