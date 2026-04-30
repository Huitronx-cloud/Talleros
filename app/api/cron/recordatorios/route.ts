import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { enviarNotificacion, mensajeRecordatorio } from '@/lib/notificaciones'

// Protección básica con secret header
function autorizado(request: Request) {
  const auth = request.headers.get('authorization')
  return auth === `Bearer ${process.env.CRON_SECRET}`
}

export async function POST(request: Request) {
  if (!autorizado(request)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const supabase = createServiceClient()

  // Buscar órdenes con fecha_prometida = mañana y estado != listo/entregado
  const mañana = new Date()
  mañana.setDate(mañana.getDate() + 1)
  const fechaMañana = mañana.toISOString().split('T')[0]

  const { data: ordenes, error } = await supabase
    .from('ordenes')
    .select('id, taller_id, cliente_id, vehiculo_marca, vehiculo_modelo, placas, fecha_prometida, clientes(nombre, telefono)')
    .eq('fecha_prometida', fechaMañana)
    .in('estado', ['recibido', 'en_proceso'])

  if (error) {
    console.error('[CRON recordatorios]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const resultados = await Promise.allSettled(
    (ordenes ?? []).map(async (orden) => {
      const { data: taller } = await supabase
        .from('talleres')
        .select('nombre')
        .eq('id', orden.taller_id)
        .single()

      const cliente = orden.clientes as { nombre: string; telefono: string | null } | null
      if (!cliente) return

      const mensaje = mensajeRecordatorio({
        nombre:         cliente.nombre,
        marca:          orden.vehiculo_marca,
        modelo:         orden.vehiculo_modelo,
        tallerNombre:   taller?.nombre ?? 'el taller',
        fechaPrometida: orden.fecha_prometida!,
      })

      await enviarNotificacion({
        supabase,
        tallerId:  orden.taller_id,
        ordenId:   orden.id,
        clienteId: orden.cliente_id,
        telefono:  cliente.telefono,
        tipo:      'recordatorio',
        mensaje,
      })
    })
  )

  const enviados = resultados.filter(r => r.status === 'fulfilled').length
  const fallidos = resultados.filter(r => r.status === 'rejected').length

  return NextResponse.json({ enviados, fallidos, total: ordenes?.length ?? 0 })
}
