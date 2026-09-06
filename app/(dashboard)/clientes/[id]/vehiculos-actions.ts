'use server'

import { randomBytes } from 'crypto'
import { revalidatePath } from 'next/cache'
import { createClient, getTallerId } from '@/lib/supabase/server'
import { VehiculoForm } from '@/types'

/**
 * Los vehículos de un cliente.
 *
 * Todo va acotado por `taller_id` además del id, aunque la RLS ya lo exija:
 * explícito evita que un id equivocado toque el coche de otro taller.
 */

function limpiar(datos: VehiculoForm) {
  const texto = (v: string | null | undefined) => {
    const t = (v ?? '').trim()
    return t === '' ? null : t
  }
  return {
    marca:  texto(datos.marca),
    modelo: texto(datos.modelo),
    // El año llega del formulario como texto; un 0 o algo que no sea número
    // se guarda como nada, que es más honesto que un año imposible.
    anio:   Number(datos.anio) > 0 ? Number(datos.anio) : null,
    placas: texto(datos.placas)?.toUpperCase() ?? null,
    vin:    texto(datos.vin)?.toUpperCase() ?? null,
    notas:  texto(datos.notas),
  }
}

export async function agregarVehiculo(clienteId: string, datos: VehiculoForm) {
  const supabase = createClient()
  const tallerId = await getTallerId()
  if (!tallerId) return { error: 'No se encontró el taller' }

  const limpio = limpiar(datos)
  if (!limpio.marca && !limpio.modelo && !limpio.placas) {
    return { error: 'Pon al menos la marca, el modelo o las placas' }
  }

  const { error } = await supabase.from('vehiculos').insert({
    taller_id:  tallerId,
    cliente_id: clienteId,
    ...limpio,
  })

  if (error) return { error: error.message }

  revalidatePath(`/clientes/${clienteId}`)
  return { error: null }
}

export async function editarVehiculo(vehiculoId: string, clienteId: string, datos: VehiculoForm) {
  const supabase = createClient()
  const tallerId = await getTallerId()
  if (!tallerId) return { error: 'No se encontró el taller' }

  const limpio = limpiar(datos)
  if (!limpio.marca && !limpio.modelo && !limpio.placas) {
    return { error: 'Pon al menos la marca, el modelo o las placas' }
  }

  const { error } = await supabase
    .from('vehiculos')
    .update(limpio)
    .eq('id', vehiculoId)
    .eq('taller_id', tallerId)

  if (error) return { error: error.message }

  revalidatePath(`/clientes/${clienteId}`)
  return { error: null }
}

/**
 * Quitar un vehículo lo ARCHIVA, no lo borra.
 *
 * Sus órdenes apuntan a él, y el historial de un coche es justo lo que un
 * taller no puede perder: es lo que enseña cuando el cliente pregunta cuándo
 * se le cambió la banda. Archivado deja de ofrecerse al abrir una orden nueva
 * y desaparece de la ficha, que es lo que el usuario espera al pulsar quitar.
 */
export async function archivarVehiculo(vehiculoId: string, clienteId: string) {
  const supabase = createClient()
  const tallerId = await getTallerId()
  if (!tallerId) return { error: 'No se encontró el taller' }

  const { error } = await supabase
    .from('vehiculos')
    .update({ archivado: true })
    .eq('id', vehiculoId)
    .eq('taller_id', tallerId)

  if (error) return { error: error.message }

  revalidatePath(`/clientes/${clienteId}`)
  return { error: null }
}

/** La dirección pública desde la que se sirve la app. */
function baseUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.tallerosapp.com'
}

/**
 * El enlace permanente del historial de un coche.
 *
 * No caduca, a diferencia del portal de la orden (7 días), porque sirve para
 * otra cosa: es la libreta de servicio que el cliente guarda y enseña cuando
 * vende el coche. Un enlace que hay que pedir otra vez cada semana no es una
 * libreta.
 *
 * Se genera una sola vez. Si ya existe se devuelve el mismo, para que el que
 * el cliente tenga guardado siga sirviendo: generar uno nuevo cada vez que el
 * taller pulsa compartir dejaría muerto el anterior sin avisar a nadie.
 */
export async function generarEnlaceHistorial(vehiculoId: string, clienteId: string) {
  const supabase = createClient()
  const tallerId = await getTallerId()
  if (!tallerId) return { error: 'No se encontró el taller', url: null }

  const { data: vehiculo, error: errorLectura } = await supabase
    .from('vehiculos')
    .select('historial_token')
    .eq('id', vehiculoId)
    .eq('taller_id', tallerId)
    .single()

  if (errorLectura) return { error: errorLectura.message, url: null }
  if (!vehiculo)    return { error: 'No se encontró el vehículo', url: null }

  if (vehiculo.historial_token) {
    return { error: null, url: `${baseUrl()}/vehiculo/${vehiculo.historial_token}` }
  }

  // 32 bytes en hexadecimal: los mismos 64 caracteres que usa portal_tokens.
  // Un enlace que no caduca no puede ser adivinable a fuerza bruta.
  const token = randomBytes(32).toString('hex')

  const { error } = await supabase
    .from('vehiculos')
    .update({ historial_token: token })
    .eq('id', vehiculoId)
    .eq('taller_id', tallerId)

  if (error) return { error: error.message, url: null }

  revalidatePath(`/clientes/${clienteId}`)
  return { error: null, url: `${baseUrl()}/vehiculo/${token}` }
}

/**
 * Mata el enlace. Hace falta cuando el cliente pierde el móvil o vende el
 * coche y quiere cortar el acceso del comprador.
 *
 * Después se puede generar otro: será distinto, y el viejo seguirá muerto.
 */
export async function revocarEnlaceHistorial(vehiculoId: string, clienteId: string) {
  const supabase = createClient()
  const tallerId = await getTallerId()
  if (!tallerId) return { error: 'No se encontró el taller' }

  const { error } = await supabase
    .from('vehiculos')
    .update({ historial_token: null })
    .eq('id', vehiculoId)
    .eq('taller_id', tallerId)

  if (error) return { error: error.message }

  revalidatePath(`/clientes/${clienteId}`)
  return { error: null }
}
