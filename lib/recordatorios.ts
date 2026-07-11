import { createClient } from '@supabase/supabase-js'
import { ClienteParaRecordatorio, RecordatorioConfig } from '@/types/recordatorios'

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function getClientesParaRecordar(
  tallerId: string,
  mesesIntervalo: number
): Promise<ClienteParaRecordatorio[]> {
  const fechaLimite = new Date()
  fechaLimite.setMonth(fechaLimite.getMonth() - mesesIntervalo)

  const supabaseAdmin = getSupabaseAdmin()
  const { data: ordenes, error } = await supabaseAdmin
    .from('ordenes')
    .select('id, fecha_entrega, cliente_id, clientes(id, nombre, telefono, email), vehiculos(marca, modelo, anio)')
    .eq('taller_id', tallerId)
    .in('estado', ['entregado', 'completado'])
    .lte('fecha_entrega', fechaLimite.toISOString())
    .order('fecha_entrega', { ascending: false })

  if (error || !ordenes) return []

  const clientesMap = new Map<string, ClienteParaRecordatorio>()

  for (const orden of ordenes as any[]) {
    const cliente = orden.clientes
    const vehiculo = orden.vehiculos

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

    const vehiculoStr = vehiculo
      ? `${vehiculo.anio || ''} ${vehiculo.marca || ''} ${vehiculo.modelo || ''}`.trim()
      : 'tu vehículo'

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