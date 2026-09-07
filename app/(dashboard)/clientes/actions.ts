'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { ClienteForm } from '@/types'
import { enviarWhatsApp } from '@/lib/twilio'
import { getLimites, puedeCrear } from '@/lib/plan-limits'

async function getTallerId() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase.rpc('get_my_taller_id')
  return data as string | null
}

export async function crearCliente(datos: ClienteForm) {
  const supabase = createClient()
  const tallerId = await getTallerId()
  if (!tallerId) return { error: 'No se encontró el taller' }

  const { data: suscripcion } = await supabase
    .from('suscripciones')
    .select('plan, trial_fin')
    .eq('taller_id', tallerId)
    .single()

  const limites = getLimites(suscripcion?.plan ?? 'trial', suscripcion?.trial_fin)
  // Los clientes de muestra no gastan cupo: se sembraron sin pedirlos.
  const { count: totalClientes } = await supabase
    .from('clientes')
    .select('*', { count: 'exact', head: true })
    .eq('taller_id', tallerId)
    .eq('es_ejemplo', false)

  if (!puedeCrear(totalClientes ?? 0, limites.clientes)) {
    return { error: 'Alcanzaste el límite de clientes de tu plan. Actualiza tu plan para seguir agregando clientes.' }
  }

  if (datos.telefono?.trim()) {
    const { data: porTelefono } = await supabase
      .from('clientes')
      .select('id')
      .eq('taller_id', tallerId)
      .eq('telefono', datos.telefono.trim())
      .limit(1)
    if (porTelefono?.length) return { error: 'Ya existe un cliente con ese teléfono.' }
  }
  if (datos.email?.trim()) {
    const { data: porEmail } = await supabase
      .from('clientes')
      .select('id')
      .eq('taller_id', tallerId)
      .eq('email', datos.email.trim())
      .limit(1)
    if (porEmail?.length) return { error: 'Ya existe un cliente con ese correo.' }
  }

  const { data: creado, error } = await supabase.from('clientes').insert({
    ...datos,
    vehiculo_año: datos.vehiculo_año ? Number(datos.vehiculo_año) : null,
    taller_id: tallerId,
  }).select('id').single()

  if (error) return { error: error.message }

  // El coche que se escribió al dar de alta al cliente también va a `vehiculos`.
  //
  // Sin esto, un taller registraba al cliente CON su coche y luego abría su
  // ficha y leía "Este cliente todavía no tiene vehículos". Los datos estaban
  // —en las columnas viejas de la ficha del cliente— pero la lista de vehículos
  // mira otra tabla, la que se creó en la migración 051, y a esta tabla no la
  // alimentaba nadie salvo el botón de "Agregar" y las citas.
  //
  // Es el mismo tropiezo de siempre: se añade una tabla y no se actualizan los
  // caminos que escriben. Las columnas de `clientes` se siguen rellenando: hay
  // pantallas que todavía leen de ahí y quitarlas es otra faena.
  if (creado?.id && (datos.vehiculo_marca || datos.vehiculo_modelo || datos.placas)) {
    const { error: errorVehiculo } = await supabase.from('vehiculos').insert({
      taller_id:  tallerId,
      cliente_id: creado.id,
      marca:      datos.vehiculo_marca?.trim()  || null,
      modelo:     datos.vehiculo_modelo?.trim() || null,
      anio:       datos.vehiculo_año ? Number(datos.vehiculo_año) : null,
      placas:     datos.placas?.trim()?.toUpperCase() || null,
      vin:        datos.vin?.trim()?.toUpperCase()    || null,
      foto_url:   datos.foto_vehiculo_url || null,
    })
    // No se aborta: el cliente ya existe y perderlo por esto sería peor. Pero
    // se registra, que es justo lo que no se hacía y por eso nadie se enteró.
    if (errorVehiculo) {
      console.error(`[vehiculos] no se pudo crear el coche del cliente ${creado.id}:`, errorVehiculo.message)
    }
  }

  // Enviar WhatsApp de bienvenida si tiene teléfono
  if (datos.telefono) {
    try {
      const { data: taller } = await supabase
        .from('talleres')
        .select('nombre')
        .eq('id', tallerId)
        .single()

      const nombreTaller = taller?.nombre ?? 'nuestro taller'
      const nombreCliente = datos.nombre.split(' ')[0]

      // Limpiar el número — quitar todo excepto dígitos y el +
      const telefonoLimpio = datos.telefono.replace(/[\s\-\(\)]/g, '')

      const mensaje = `Hola ${nombreCliente}, te damos la bienvenida a *${nombreTaller}*. A partir de ahora te mantendremos informado sobre el estado de tu vehículo por este medio. Gracias por preferirnos.`

      await enviarWhatsApp(telefonoLimpio, mensaje)
    } catch (err) {
      // Si falla el WhatsApp no bloqueamos el registro del cliente,
      // pero dejamos rastro del error para poder diagnosticarlo.
      console.error('Error enviando WhatsApp de bienvenida:', err)
    }
  }

  revalidatePath('/clientes')
  return { error: null }
}

export async function editarCliente(id: string, datos: ClienteForm) {
  const supabase = createClient()
  const tallerId = await getTallerId()
  if (!tallerId) return { error: 'No se encontró el taller' }

  const { error } = await supabase
    .from('clientes')
    .update({
      ...datos,
      vehiculo_año: datos.vehiculo_año ? Number(datos.vehiculo_año) : null,
    })
    .eq('id', id)
    .eq('taller_id', tallerId)

  if (error) return { error: error.message }
  revalidatePath('/clientes')
  return { error: null }
}

export async function eliminarCliente(id: string) {
  const supabase = createClient()
  const tallerId = await getTallerId()
  if (!tallerId) return { error: 'No se encontró el taller' }

  const { error } = await supabase
    .from('clientes')
    .delete()
    .eq('id', id)
    .eq('taller_id', tallerId)

  if (error) return { error: error.message }
  revalidatePath('/clientes')
  return { error: null }
}

/**
 * Quita de una vez la muestra que se sembró al registrar el taller.
 *
 * Se borran primero las órdenes: cliente_id queda en null al borrar el cliente
 * (on delete set null), y entonces la orden de ejemplo se quedaría suelta en la
 * lista sin nombre y sin manera cómoda de encontrarla.
 */
export async function eliminarDatosEjemplo() {
  const supabase = createClient()
  const tallerId = await getTallerId()
  if (!tallerId) return { error: 'No se encontró el taller' }

  const { error: errOrdenes } = await supabase
    .from('ordenes')
    .delete()
    .eq('taller_id', tallerId)
    .eq('es_ejemplo', true)
  if (errOrdenes) return { error: errOrdenes.message }

  const { error: errClientes } = await supabase
    .from('clientes')
    .delete()
    .eq('taller_id', tallerId)
    .eq('es_ejemplo', true)
  if (errClientes) return { error: errClientes.message }

  // Si la muestra era lo único que había, el contador vuelve a cero para que la
  // primera orden de verdad sea la #0001. La función comprueba por dentro que
  // no queden órdenes, así que llamarla siempre es seguro.
  await supabase.rpc('reiniciar_contador_orden', { p_taller_id: tallerId })

  revalidatePath('/clientes')
  revalidatePath('/ordenes')
  revalidatePath('/dashboard')
  return { error: null }
}
