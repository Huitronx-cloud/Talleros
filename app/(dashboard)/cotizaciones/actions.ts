'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { ServicioItem, EstadoCotizacion } from '@/types'

export interface CotizacionForm {
  cliente_id: string
  orden_id: string
  servicios: ServicioItem[]
  subtotal: number
  descuento: number
  impuestos: number
  total: number
  moneda: 'MXN' | 'COP'
  estado: EstadoCotizacion
  notas: string
  vigencia_dias: number
  aplicar_iva: boolean
}

async function getTallerId(): Promise<string | null> {
  const supabase = createClient()
  const { data } = await supabase.rpc('get_my_taller_id')
  return data as string | null
}

export async function crearCotizacion(datos: CotizacionForm) {
  const supabase = createClient()
  const tallerId = await getTallerId()
  if (!tallerId) return { error: 'No se encontró el taller', id: null }

  const { data: numero } = await supabase.rpc('siguiente_numero_cotizacion', {
    p_taller_id: tallerId,
  })

  const { error, data } = await supabase.from('cotizaciones').insert({
    taller_id:         tallerId,
    cliente_id:        datos.cliente_id  || null,
    orden_id:          datos.orden_id    || null,
    numero_cotizacion: numero,
    servicios:         datos.servicios,
    subtotal:          datos.subtotal,
    descuento:         datos.descuento,
    impuestos:         datos.impuestos,
    total:             datos.total,
    moneda:            datos.moneda,
    estado:            datos.estado,
    notas:             datos.notas       || null,
    vigencia_dias:     datos.vigencia_dias,
  }).select('id').single()

  if (error) return { error: error.message, id: null }

  revalidatePath('/cotizaciones')
  return { error: null, id: data.id }
}

export async function cambiarEstadoCotizacion(id: string, estado: EstadoCotizacion) {
  const supabase = createClient()
  const { error } = await supabase.from('cotizaciones').update({ estado }).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/cotizaciones')
  revalidatePath(`/cotizaciones/${id}`)
  return { error: null }
}

export async function eliminarCotizacion(id: string) {
  const supabase = createClient()
  const { error } = await supabase.from('cotizaciones').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/cotizaciones')
  return { error: null }
}
