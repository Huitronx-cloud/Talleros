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
    .select('plan')
    .eq('taller_id', tallerId)
    .single()

  const limites = getLimites(suscripcion?.plan ?? 'trial')
  const { count: totalClientes } = await supabase
    .from('clientes')
    .select('*', { count: 'exact', head: true })
    .eq('taller_id', tallerId)

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

  const { error } = await supabase.from('clientes').insert({
    ...datos,
    vehiculo_año: datos.vehiculo_año ? Number(datos.vehiculo_año) : null,
    taller_id: tallerId,
  })

  if (error) return { error: error.message }

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

      const mensaje = `Hola ${nombreCliente} 👋 Te damos la bienvenida a *${nombreTaller}*. A partir de ahora te mantendremos informado sobre el estado de tu vehículo por este medio. ¡Gracias por preferirnos! 🔧`

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
