import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { enviarNotificacion, mensajeSeguimiento } from '@/lib/notificaciones'

function autorizado(request: Request) {
  const auth = request.headers.get('authorization')
  return auth === `Bearer ${process.env.CRON_SECRET}`
}

export async function POST(request: Request) {
  if (!autorizado(request)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const supabase = createServiceClient()

  // Órdenes entregadas exactamente hace 3 días sin seguimiento previo
  const hace3Dias = new Date()
  hace3Dias.setDate(hace3Dias.getDate() - 3)
  const fecha3Dias = hace3Dias.toISOString().split('T')[0]

  const { data: ordenes, error } = await supabase
    .from('ordenes')
    .select('id, taller_id, cliente_id, vehiculo_marca, vehiculo_modelo, placas, clientes(nombre, telefono)')
    .eq('estado', 'entregado')
    .eq('fecha_entrega', fecha3Dias)

  if (error) {
    console.error('[CRON seguimiento]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Filtrar las que ya tienen seguimiento enviado
  const resultados = await Promise.allSettled(
    (ordenes ?? []).map(async (orden) => {
      // Verificar si ya se envió seguimiento para esta orden
      const { data: yaEnviado } = await supabase
        .from('notificaciones')
        .select('id')
        .eq('orden_id', orden.id)
        .eq('tipo', 'seguimiento')
        .eq('estado', 'enviada')
        .single()

      if (yaEnviado) return // Ya se envió, saltar

      const { data: taller } = await supabase
        .from('talleres')
        .select('nombre, link_google_maps')
        .eq('id', orden.taller_id)
        .single()

      const cliente = orden.clientes as { nombre: string; telefono: string | null } | null
      if (!cliente) return

      const mensaje = mensajeSeguimiento({
        nombre:        cliente.nombre,
        marca:         orden.vehiculo_marca,
        modelo:        orden.vehiculo_modelo,
        tallerNombre:  taller?.nombre ?? 'el taller',
        linkGoogleMaps: (taller as any)?.link_google_maps ?? null,
      })

      await enviarNotificacion({
        supabase,
        tallerId:  orden.taller_id,
        ordenId:   orden.id,
        clienteId: orden.cliente_id,
        telefono:  cliente.telefono,
        tipo:      'seguimiento',
        mensaje,
      })
    })
  )

  const enviados = resultados.filter(r => r.status === 'fulfilled').length
  const fallidos = resultados.filter(r => r.status === 'rejected').length

  return NextResponse.json({ enviados, fallidos, total: ordenes?.length ?? 0 })
}
