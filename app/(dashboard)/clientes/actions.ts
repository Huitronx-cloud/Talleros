'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { ClienteForm } from '@/types'

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

  const { error } = await supabase.from('clientes').insert({
    ...datos,
    vehiculo_año: datos.vehiculo_año ? Number(datos.vehiculo_año) : null,
    taller_id: tallerId,
  })

  if (error) return { error: error.message }
  revalidatePath('/clientes')
  return { error: null }
}

export async function editarCliente(id: string, datos: ClienteForm) {
  const supabase = createClient()

  const { error } = await supabase
    .from('clientes')
    .update({
      ...datos,
      vehiculo_año: datos.vehiculo_año ? Number(datos.vehiculo_año) : null,
    })
    .eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/clientes')
  return { error: null }
}

export async function eliminarCliente(id: string) {
  const supabase = createClient()

  const { error } = await supabase
    .from('clientes')
    .delete()
    .eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/clientes')
  return { error: null }
}
