import { createClient } from '@supabase/supabase-js'
import { ClienteParaRecordatorio, RecordatorioConfig } from '@/types/recordatorios'

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/**
 * El coche como se le nombra al cliente en el WhatsApp: "2020 Toyota Corolla".
 *
 * Vive aparte para poder probarlo. La versión anterior era
 * `${anio} ${marca} ${modelo}`.trim(), y `trim()` solo limpia los extremos: a
 * una orden sin marca pero con modelo le salía un hueco doble en medio
 * ("2020  Corolla"). Con partes sueltas eso no se ve al leer el código, pero el
 * cliente sí lo ve en su teléfono.
 *
 * Sin ningún dato devuelve "tu vehículo", que es lo que encaja en la frase del
 * mensaje ("ya toca revisar tu vehículo").
 */
export function describirVehiculo(
  marca?: string | null,
  modelo?: string | null,
  anio?: number | string | null,
): string {
  const partes = [anio, marca, modelo]
    .map(p => String(p ?? '').trim())
    // El '0' se descarta aparte de lo vacío: un año guardado como 0 es un dato
    // malo, no un año, y "0 Toyota Corolla" es peor que no decir el año.
    .filter(p => p !== '' && p !== '0')

  return partes.length > 0 ? partes.join(' ') : 'tu vehículo'
}

export async function getClientesParaRecordar(
  tallerId: string,
  mesesIntervalo: number
): Promise<ClienteParaRecordatorio[]> {
  const fechaLimite = new Date()
  fechaLimite.setMonth(fechaLimite.getMonth() - mesesIntervalo)

  const supabaseAdmin = getSupabaseAdmin()
  // El vehículo sale de la propia orden. Antes esto pedía una unión con la
  // tabla `vehiculos`, que NO EXISTE en la base: la consulta fallaba entera,
  // el error se tragaba abajo, y la campaña de mantenimiento llevaba desde
  // siempre devolviendo cero clientes cada día sin mandar un solo mensaje. Se
  // veía igual que "hoy no le toca a nadie".
  //
  // La unión nunca hizo falta: las órdenes ya guardan los datos del coche tal
  // como entró al taller, que además es lo correcto aquí — si el cliente
  // vendió el coche, el recordatorio habla del que trajo.
  const { data: ordenes, error } = await supabaseAdmin
    .from('ordenes')
    .select('id, fecha_entrega, cliente_id, vehiculo_marca, vehiculo_modelo, vehiculo_año, clientes(id, nombre, telefono, email)')
    .eq('taller_id', tallerId)
    .in('estado', ['entregado', 'completado'])
    .lte('fecha_entrega', fechaLimite.toISOString())
    .order('fecha_entrega', { ascending: false })

  // Antes era un `return []` mudo, y eso es lo que mantuvo el fallo escondido
  // meses: el cron anotaba "0 clientes encontrados" y terminaba bien.
  if (error) {
    console.error(`[recordatorios] taller ${tallerId}: no se pudieron leer las órdenes: ${error.message}`)
    return []
  }
  if (!ordenes) return []

  const clientesMap = new Map<string, ClienteParaRecordatorio>()

  for (const orden of ordenes as any[]) {
    const cliente = orden.clientes

    if (!cliente || clientesMap.has(cliente.id)) continue

    const yaEnviado = await verificarRecordatorioReciente(
      tallerId,
      cliente.id,
      mesesIntervalo
    )
    if (yaEnviado) continue

    const fechaOrden = new Date(orden.fecha_entrega)
    const ahora = new Date()
    const mesesTranscurridos = Math.floor(
      (ahora.getTime() - fechaOrden.getTime()) / (1000 * 60 * 60 * 24 * 30)
    )

    const vehiculoStr = describirVehiculo(
      orden.vehiculo_marca,
      orden.vehiculo_modelo,
      orden.vehiculo_año,
    )

    clientesMap.set(cliente.id, {
      cliente_id: cliente.id,
      nombre: cliente.nombre,
      telefono: cliente.telefono,
      email: cliente.email,
      ultima_orden_fecha: orden.fecha_entrega,
      ultima_orden_id: orden.id,
      vehiculo: vehiculoStr,
      meses_desde_ultima_visita: mesesTranscurridos,
    })
  }

  return Array.from(clientesMap.values())
}

async function verificarRecordatorioReciente(
  tallerId: string,
  clienteId: string,
  mesesIntervalo: number
): Promise<boolean> {
  const supabaseAdmin = getSupabaseAdmin()
  const fechaLimite = new Date()
  fechaLimite.setMonth(fechaLimite.getMonth() - Math.floor(mesesIntervalo / 2))

  const { data } = await supabaseAdmin
    .from('recordatorios_enviados')
    .select('id')
    .eq('taller_id', tallerId)
    .eq('cliente_id', clienteId)
    .in('estado', ['enviado', 'encolado'])
    .gte('fecha_envio', fechaLimite.toISOString())
    .limit(1)

  return (data?.length ?? 0) > 0
}

export function personalizarMensaje(
  plantilla: string,
  variables: {
    nombre: string
    taller: string
    vehiculo: string
    meses: number
  }
): string {
  return plantilla
    .replace(/{{nombre}}/g, variables.nombre)
    .replace(/{{taller}}/g, variables.taller)
    .replace(/{{vehiculo}}/g, variables.vehiculo)
    .replace(/{{meses}}/g, variables.meses.toString())
}

export async function registrarRecordatorioEnviado(params: {
  tallerId: string
  clienteId: string
  ordenId: string | null
  canal: string
  estado: 'enviado' | 'fallido' | 'encolado'
  mensajeEnviado: string
  errorDetalle?: string
}) {
  const supabaseAdmin = getSupabaseAdmin()
  const proximaAccion = new Date()
  proximaAccion.setMonth(proximaAccion.getMonth() + 3)

  await supabaseAdmin.from('recordatorios_enviados').insert({
    taller_id: params.tallerId,
    cliente_id: params.clienteId,
    orden_id: params.ordenId,
    canal: params.canal,
    estado: params.estado,
    mensaje_enviado: params.mensajeEnviado,
    error_detalle: params.errorDetalle || null,
    fecha_envio: new Date().toISOString(),
    fecha_proxima_accion: proximaAccion.toISOString(),
  })
}