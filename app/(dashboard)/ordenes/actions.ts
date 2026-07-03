'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { EstadoOrden, FormaPago, ServicioItem, HistorialItem } from '@/types'
import { enviarNotificacion, mensajeOrdenLista } from '@/lib/notificaciones'
import { enviarResenaOrden } from '@/lib/resenas'
import { getLimites, puedeCrear } from '@/lib/plan-limits'
import { PlantillaWhatsApp, construirMensajeWhatsApp } from '@/lib/whatsapp-templates'

export interface OrdenForm {
  cliente_id: string | null
  vehiculo_marca: string
  vehiculo_modelo: string
  vehiculo_año: string
  placas: string
  kilometraje: string
  descripcion_problema: string
  diagnostico: string
  servicios_realizados: ServicioItem[]
  mecanico_asignado: string
  estado: EstadoOrden
  fecha_entrada: string
  fecha_prometida: string
  subtotal: number
  descuento: number
  impuestos: number
  tasa_iva: number
  total: number
  forma_pago: FormaPago
  notas_internas: string
  vin?: string | null
  numero_factura?: string | null
}

async function getTallerId(): Promise<string | null> {
  const supabase = createClient()
  const { data } = await supabase.rpc('get_my_taller_id')
  return data as string | null
}

export async function crearOrden(datos: OrdenForm) {
  const supabase = createClient()
  const tallerId = await getTallerId()
  if (!tallerId) return { error: 'No se encontró el taller' }

  const { data: suscripcion } = await supabase
    .from('suscripciones')
    .select('plan')
    .eq('taller_id', tallerId)
    .single()

  const limites   = getLimites(suscripcion?.plan ?? 'trial')
  const mesActual = new Date().toISOString().slice(0, 7)
  const { count: ordenesEsteMes } = await supabase
    .from('ordenes')
    .select('*', { count: 'exact', head: true })
    .eq('taller_id', tallerId)
    .gte('created_at', `${mesActual}-01`)
    .lt('created_at', `${mesActual}-31`)

  if (!puedeCrear(ordenesEsteMes ?? 0, limites.ordenes_mes)) {
    return { error: 'Alcanzaste el límite de órdenes de tu plan este mes. Actualiza tu plan para seguir creando órdenes.' }
  }

  const { data: numero } = await supabase.rpc('siguiente_numero_orden', {
    p_taller_id: tallerId,
  })

  const historialInicial: HistorialItem[] = [{
    estado: datos.estado,
    fecha: new Date().toISOString(),
    nota: 'Orden creada',
  }]

  // Recalculamos los totales en el servidor en vez de confiar en los que
  // mandó el cliente — solo se confía en servicios_realizados y la tasa de
  // IVA (acotada a un rango razonable, ya que varía por país).
  const subtotalCalc = Math.round(
    datos.servicios_realizados.reduce((acc, s) => acc + s.cantidad * s.precio_unitario, 0) * 100
  ) / 100
  const tasaIvaCalc   = Math.min(Math.max(datos.tasa_iva || 0, 0), 0.3)
  const descuentoCalc = Math.min(Math.max(datos.descuento || 0, 0), subtotalCalc)
  const baseIvaCalc   = Math.max(0, subtotalCalc - descuentoCalc)
  const impuestosCalc = Math.round(baseIvaCalc * tasaIvaCalc * 100) / 100
  const totalCalc     = Math.round((baseIvaCalc + impuestosCalc) * 100) / 100

  const { error, data } = await supabase.from('ordenes').insert({
    taller_id:            tallerId,
    cliente_id:           datos.cliente_id || null,
    numero_orden:         numero,
    vehiculo_marca:       datos.vehiculo_marca   || null,
    vehiculo_modelo:      datos.vehiculo_modelo  || null,
    vehiculo_año:         datos.vehiculo_año     ? parseInt(datos.vehiculo_año)     : null,
    placas:               datos.placas           || null,
    kilometraje:          datos.kilometraje      ? parseInt(datos.kilometraje)      : null,
    descripcion_problema: datos.descripcion_problema || null,
    diagnostico:          datos.diagnostico      || null,
    servicios_realizados: datos.servicios_realizados,
    mecanico_asignado:    datos.mecanico_asignado || null,
    estado:               datos.estado,
    fecha_entrada:        datos.fecha_entrada,
    fecha_prometida:      datos.fecha_prometida  || null,
    subtotal:             subtotalCalc,
    descuento:            descuentoCalc,
    impuestos:            impuestosCalc,
    tasa_iva:             tasaIvaCalc,
    total:                totalCalc,
    forma_pago:           datos.forma_pago,
    notas_internas:       datos.notas_internas   || null,
    historial:            historialInicial,
    vin:                  datos.vin ?? null,
    numero_factura:       datos.numero_factura ?? null,
  }).select('id').single()

  if (error) return { error: error.message }

  // Notificar al mecánico si fue asignado
  if (datos.mecanico_asignado && data?.id) {
    notificarMecanicoAsignado(data.id, datos.mecanico_asignado, tallerId).catch(console.error)
  }

  revalidatePath('/ordenes')
  return { error: null, id: data.id }
}

export async function cambiarEstado(
  ordenId: string,
  nuevoEstado: EstadoOrden,
  nota?: string
) {
  const supabase = createClient()

  const { data: orden } = await supabase
    .from('ordenes')
    .select('historial, estado, taller_id, cliente_id, vehiculo_marca, vehiculo_modelo, placas, total, clientes(nombre, telefono)')
    .eq('id', ordenId)
    .single()

  if (!orden) return { error: 'Orden no encontrada' }

  const historial: HistorialItem[] = [
    ...(orden.historial ?? []),
    {
      estado: nuevoEstado,
      fecha: new Date().toISOString(),
      nota: nota || undefined,
    },
  ]

  const actualizacion: Record<string, unknown> = {
    estado: nuevoEstado,
    historial,
  }

  if (nuevoEstado === 'entregado') {
    actualizacion.fecha_entrega = new Date().toISOString().split('T')[0]
  }

  const { error } = await supabase
    .from('ordenes')
    .update(actualizacion)
    .eq('id', ordenId)
    .eq('taller_id', orden.taller_id)

  if (error) return { error: error.message }

  // Notificación automática al marcar como listo
  if (nuevoEstado === 'listo' && orden.clientes) {
    const { data: taller } = await supabase.rpc('get_taller_para_pdf', { p_taller_id: orden.taller_id })
    const cliente = (orden.clientes as any) as { nombre: string; telefono: string | null }

    const mensaje = mensajeOrdenLista({
      nombre:       cliente.nombre,
      marca:        orden.vehiculo_marca,
      modelo:       orden.vehiculo_modelo,
      placas:       orden.placas,
      tallerNombre: taller?.nombre ?? 'el taller',
      total:        orden.total ?? 0,
      moneda:       taller?.moneda,
    })

    enviarNotificacion({
      supabase,
      tallerId:  orden.taller_id,
      ordenId,
      clienteId: orden.cliente_id,
      telefono:  cliente.telefono,
      tipo:      'orden_lista',
      mensaje,
    }).catch(console.error)
  }

  // Reseña automática de Google al marcar como entregado, según la
  // configuración de reseñas del taller (resenas_config: activo, canal, plantillas)
  if (nuevoEstado === 'entregado' && orden.clientes) {
    enviarResenaOrden(ordenId, orden.taller_id).catch(console.error)
  }

  revalidatePath('/ordenes')
  revalidatePath(`/ordenes/${ordenId}`)
  return { error: null }
}

export async function agregarNotaInterna(ordenId: string, nota: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from('ordenes')
    .update({ notas_internas: nota })
    .eq('id', ordenId)

  if (error) return { error: error.message }
  revalidatePath(`/ordenes/${ordenId}`)
  return { error: null }
}

export async function eliminarOrden(id: string) {
  const supabase = createClient()
  const { error } = await supabase.from('ordenes').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/ordenes')
  return { error: null }
}

// ── Comunicación por WhatsApp vía link wa.me (sin Twilio/Meta) ────────────────
// El mensaje se genera aquí (necesita datos de cliente/taller + token del
// portal, protegidos por RLS), pero el envío real lo hace el empleado del
// taller con un tap desde su propio WhatsApp — nunca se manda nada solo.

export interface DatosMensajeWhatsApp {
  telefono:   string
  mensaje:    string
  paisTaller: string | null
  plantilla:  PlantillaWhatsApp
}

async function obtenerOCrearTokenPortal(
  supabase: ReturnType<typeof createClient>,
  ordenId: string,
  tallerId: string
): Promise<string | null> {
  const { data: existente } = await supabase
    .from('portal_tokens')
    .select('token')
    .eq('orden_id', ordenId)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (existente?.token) return existente.token

  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  const { data: nuevo } = await supabase
    .from('portal_tokens')
    .insert({ orden_id: ordenId, taller_id: tallerId, expires_at: expires })
    .select('token')
    .single()

  return nuevo?.token ?? null
}

export async function generarMensajeWhatsApp(
  ordenId: string,
  plantilla: PlantillaWhatsApp,
  opts?: { garantiaDias?: number; garantiaKm?: number }
): Promise<{ error: string | null; datos?: DatosMensajeWhatsApp }> {
  const supabase = createClient()

  const { data: orden, error } = await supabase
    .from('ordenes')
    .select('id, taller_id, vehiculo_marca, vehiculo_modelo, placas, clientes(nombre, telefono), talleres(nombre, pais)')
    .eq('id', ordenId)
    .single()

  if (error || !orden) return { error: 'Orden no encontrada' }

  const cliente = orden.clientes as any
  const taller  = orden.talleres as any

  if (!cliente?.telefono) return { error: 'El cliente no tiene teléfono registrado' }
  if (!taller) return { error: 'No se pudo obtener la información del taller' }

  const token     = await obtenerOCrearTokenPortal(supabase, ordenId, orden.taller_id)
  const baseUrl   = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.tallerosapp.com'
  const portalUrl = token ? `${baseUrl}/portal/${token}` : null

  const mensaje = construirMensajeWhatsApp(plantilla, {
    clienteNombre:  cliente.nombre,
    vehiculoMarca:  orden.vehiculo_marca,
    vehiculoModelo: orden.vehiculo_modelo,
    placas:         orden.placas,
    tallerNombre:   taller.nombre,
    portalUrl,
    garantiaDias:   opts?.garantiaDias,
    garantiaKm:     opts?.garantiaKm,
  })

  return {
    error: null,
    datos: {
      telefono:   cliente.telefono,
      mensaje,
      paisTaller: taller.pais ?? null,
      plantilla,
    },
  }
}

export async function registrarEnvioWhatsApp(params: {
  ordenId:   string
  plantilla: PlantillaWhatsApp
  telefono:  string
  mensaje:   string
}): Promise<{ error: string | null }> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const tallerId = await getTallerId()
  if (!tallerId) return { error: 'No se encontró el taller' }

  const { error } = await supabase.from('mensajes_whatsapp_log').insert({
    orden_id:   params.ordenId,
    taller_id:  tallerId,
    usuario_id: user?.id ?? null,
    plantilla:  params.plantilla,
    telefono:   params.telefono,
    mensaje:    params.mensaje,
  })

  if (error) return { error: error.message }
  return { error: null }
}

async function notificarMecanicoAsignado(
  ordenId: string,
  mecanicoNombre: string,
  tallerId: string
) {
  try {
    const supabase = createClient()
    const { data: mecanico } = await supabase
      .from('usuarios')
      .select('id')
      .eq('taller_id', tallerId)
      .eq('nombre', mecanicoNombre)
      .single()

    if (!mecanico) return

    await fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? 'https://tallerosapp.com'}/api/push/enviar`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        usuarioId: mecanico.id,
        titulo:    '🔧 Nueva orden asignada',
        cuerpo:    'Te han asignado una nueva orden de trabajo.',
        url:       `/ordenes/${ordenId}`,
      }),
    })
  } catch (e) {
    console.error('Error notificando mecánico:', e)
  }
}