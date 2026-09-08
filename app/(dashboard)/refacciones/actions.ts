'use server'

import { createClient, getTallerId } from '@/lib/supabase/server'
import { normalizarVin, vinValido } from '@/lib/vin'

/** El coche tal y como lo tiene registrado el taller. Este dato es el fiable. */
export interface CocheDelTaller {
  vehiculo_id: string | null
  marca:       string | null
  modelo:      string | null
  anio:        number | null
  placas:      string | null
  cliente_id:   string | null
  cliente_nombre: string | null
  visitas:     number
}

/**
 * Busca un VIN dentro del taller.
 *
 * Se mira en `vehiculos` y también en las órdenes: hay coches que solo
 * existieron dentro de una orden, y un mecánico que teclea el VIN espera
 * encontrarlos igual. Si no aparece nada no pasa nada — la pantalla sigue
 * pudiendo decodificar y buscar la refacción, que es lo que pidió el dueño:
 * no obligar a dar de alta al cliente para poder trabajar.
 */
export async function buscarVinEnTaller(vinCrudo: string): Promise<{
  error: string | null
  coche: CocheDelTaller | null
}> {
  const vin = normalizarVin(vinCrudo)
  if (!vinValido(vin)) return { error: null, coche: null }

  const supabase = createClient()
  const tallerId = await getTallerId()
  if (!tallerId) return { error: 'No se encontró el taller', coche: null }

  // ── El vehículo registrado ───────────────────────────────────────────────
  const { data: vehiculo, error: errorVehiculo } = await supabase
    .from('vehiculos')
    .select('id, marca, modelo, anio, placas, cliente_id, clientes(nombre)')
    .eq('taller_id', tallerId)
    .eq('vin', vin)
    .limit(1)
    .maybeSingle()

  if (errorVehiculo) return { error: errorVehiculo.message, coche: null }

  if (vehiculo) {
    const { count } = await supabase
      .from('ordenes')
      .select('*', { count: 'exact', head: true })
      .eq('taller_id', tallerId)
      .eq('vehiculo_id', vehiculo.id)

    const cliente = vehiculo.clientes as any
    return {
      error: null,
      coche: {
        vehiculo_id:    vehiculo.id,
        marca:          vehiculo.marca,
        modelo:         vehiculo.modelo,
        anio:           vehiculo.anio,
        placas:         vehiculo.placas,
        cliente_id:     vehiculo.cliente_id,
        cliente_nombre: Array.isArray(cliente) ? cliente[0]?.nombre ?? null : cliente?.nombre ?? null,
        visitas:        count ?? 0,
      },
    }
  }

  // ── Sin vehículo: puede estar solo dentro de una orden ───────────────────
  const { data: orden, error: errorOrden } = await supabase
    .from('ordenes')
    // El año va entre comillas: la ñ del nombre rompe el analizador de tipos
    // de supabase-js si se pone suelto en la lista de columnas.
    .select('vehiculo_marca, vehiculo_modelo, "vehiculo_año", placas, cliente_id, clientes(nombre)')
    .eq('taller_id', tallerId)
    .eq('vin', vin)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (errorOrden) return { error: errorOrden.message, coche: null }
  if (!orden)     return { error: null, coche: null }

  const cliente = orden.clientes as any
  return {
    error: null,
    coche: {
      vehiculo_id:    null,
      marca:          orden.vehiculo_marca,
      modelo:         orden.vehiculo_modelo,
      anio:           (orden as any).vehiculo_año ?? null,
      placas:         orden.placas,
      cliente_id:     orden.cliente_id,
      cliente_nombre: Array.isArray(cliente) ? cliente[0]?.nombre ?? null : cliente?.nombre ?? null,
      visitas:        0,
    },
  }
}
