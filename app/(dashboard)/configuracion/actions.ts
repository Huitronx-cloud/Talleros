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
  horario?: string
  instagram?: string
  facebook?: string
  firma_pdf?: string
  whatsapp_numero?: string
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
      ...(datos.logo_url !== undefined          && { logo_url:          datos.logo_url }),
      ...(datos.horario !== undefined           && { horario:           datos.horario }),
      ...(datos.instagram !== undefined         && { instagram:         datos.instagram }),
      ...(datos.facebook !== undefined          && { facebook:          datos.facebook }),
      ...(datos.firma_pdf !== undefined         && { firma_pdf:         datos.firma_pdf }),
      ...(datos.whatsapp_numero !== undefined   && { whatsapp_numero:   datos.whatsapp_numero || null }),
    })
    .eq('id', tallerId)

  if (error) return { error: error.message }

  // El logo y el nombre del taller los pinta la barra lateral, que vive en
  // `app/(dashboard)/layout.tsx` — o sea, fuera de /configuracion. Revalidando
  // solo esta ruta, el layout seguía sirviéndose de la caché del router con el
  // logo viejo hasta que el dueño recargaba a mano. `layout` alcanza al grupo
  // entero, que es donde de verdad se lee.
  revalidatePath('/configuracion')
  revalidatePath('/', 'layout')
  return { error: null }
}

/**
 * Guarda solo el logo, en cuanto termina de subirse.
 *
 * Existe aparte de `guardarConfiguracion` porque la tarjeta del logo se
 * comporta como algo independiente —tiene su botón, su "Subiendo…" y su vista
 * previa— y hasta ahora no escribía nada en la base: el `logo_url` viajaba en
 * el envío del formulario completo. Quien subía el logo y salía de la página
 * perdía el cambio sin enterarse.
 *
 * Cadena vacía = quitar el logo. Por eso el parámetro no es opcional: aquí
 * `''` es una instrucción, no un "no me han dicho nada".
 */
export async function guardarLogo(logoUrl: string) {
  const supabase = createClient()
  const { data: tallerId } = await supabase.rpc('get_my_taller_id')
  if (!tallerId) return { error: 'No se encontró el taller' }

  const { error } = await supabase
    .from('talleres')
    .update({ logo_url: logoUrl || null })
    .eq('id', tallerId)

  if (error) return { error: error.message }

  revalidatePath('/configuracion')
  revalidatePath('/', 'layout')
  return { error: null }
}