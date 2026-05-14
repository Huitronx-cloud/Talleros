'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface ConfiguracionForm {
  nombre: string
  telefono: string
  direccion: string
  email: string
  moneda: string
  vigencia_dias: number
  logo_url?: string
  google_review_url?: string
}

export async function guardarConfiguracion(datos: ConfiguracionForm) {
  const supabase = createClient()
  const { data: tallerId } = await supabase.rpc('get_my_taller_id')
  if (!tallerId) return { error: 'No se encontró el taller' }

  const { error } = await supabase
    .from('talleres')
    .update({
      nombre:             datos.nombre,
      telefono:           datos.telefono      || null,
      direccion:          datos.direccion     || null,
      email:              datos.email         || null,
      moneda:             datos.moneda,
      vigencia_dias:      datos.vigencia_dias,
      ...(datos.logo_url !== undefined && { logo_url: datos.logo_url }),
      ...(datos.google_review_url !== undefined && { google_review_url: datos.google_review_url }),
    })
    .eq('id', tallerId)

  if (error) return { error: error.message }

  revalidatePath('/configuracion')
  return { error: null }
}