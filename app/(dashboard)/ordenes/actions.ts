'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { EstadoOrden, FormaPago, ServicioItem, HistorialItem } from '@/types'
import { enviarNotificacion, mensajeOrdenLista, mensajeResena } from '@/lib/notificaciones'

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
  total: number
  forma_pago: FormaPago
  notas_internas: string
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

  const { data: numero } = await supabase.rpc('siguiente_numero_orden', {
    p_taller_id: tallerId,
  })

  const historialInicial: HistorialItem[] = [{
    estado: datos.estado,
    fecha: new Date().toISOString(),
    nota: 'Orden creada',
  }]

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
    subtotal:             datos.subtotal,
    descuento:            datos.descuento,
    total:                datos.total,
    forma_pago:           datos.forma_pago,
    notas_internas:       datos.notas_internas   || null,
    historial:            historialInicial,
  }).select('id').single()

  if (error) return { error: error.message }

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
    .select('historial, estado, taller_id, cliente_id, vehiculo_marca, vehiculo_modelo, placas, total, clientes(nombre, telefono), talleres(google_review_url, nombre, moneda)')
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

  // Reseña automática de Google al marcar como entregado (2 horas después)
  if (nuevoEstado === 'entregado' && orden.clientes) {
    const taller = (orden.talleres as any) as { google_review_url: string | null; nombre: string; moneda: string } | null
    const cliente = (orden.clientes as any) as { nombre: string; telefono: string | null }
    const reviewUrl = taller?.google_review_url

    if (reviewUrl && cliente.telefono) {
      const mensaje = mensajeResena({
        nombre:          cliente.nombre,
        marca:           orden.vehiculo_marca,
        modelo:          orden.vehiculo_modelo,
        tallerNombre:    taller?.nombre ?? 'el taller',
        googleReviewUrl: reviewUrl,
      })

      // Espera 2 horas antes de enviar (7200000 ms)
      setTimeout(() => {
        enviarNotificacion({
          supabase,
          tallerId:  orden.taller_id,
          ordenId,
          clienteId: orden.cliente_id,
          telefono:  cliente.telefono,
          tipo:      'seguimiento',
          mensaje,
        }).catch(console.error)
      }, 7200000)
    }
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
