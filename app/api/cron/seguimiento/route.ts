import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const maxDuration = 60
import { createServiceClient } from '@/lib/supabase/service'
import { enviarNotificacion, mensajeSeguimiento } from '@/lib/notificaciones'

function autorizado(request: Request) {
  const auth = request.headers.get('authorization')
  return auth === `Bearer ${process.env.CRON_SECRET}`
}

// GET, no POST: el orquestador (/api/cron/daily) llama a todas las tareas con
// GET. Mientras esto fue POST, el cron nunca se ejecutó — ningún taller estaba
// dando el seguimiento post-servicio.
export async function GET(request: Request) {
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
    .eq('es_ejemplo', false)   // la orden de ejemplo lleva el teléfono del propio dueño
    .eq('fecha_entrega', fecha3Dias)
    .limit(50) // tope por corrida, igual que el resto de los crons

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
        // 'pendiente' cuenta como ya procesada: con el canal wa.me la
        // notificación se encola para que el taller la envíe y se queda en
        // 'pendiente' — filtrar solo por 'enviada' nunca encontraba nada.
        .eq('tipo', 'seguimiento')
        .in('estado', ['pendiente', 'enviada'])
        .limit(1)
        .maybeSingle()

      if (yaEnviado) return // Ya se envió, saltar

      // Esta consulta pedía `link_google_maps`, una columna que NO EXISTE en
      // `talleres`. PostgREST rechaza la consulta entera cuando se le pide una
      // columna desconocida, así que `taller` venía siempre en nulo y el
      // mensaje caía al respaldo:
      //
      //   "¿cómo ha funcionado su Jetta después del servicio en el taller?"
      //
      // "el taller". A un cliente de FASTCAR, firmado por nadie. El mensaje
      // parecía de un sistema en vez de de su mecánico, que es justo lo
      // contrario de lo que tiene que parecer.
      const { data: taller, error: errorTaller } = await supabase
        .from('talleres')
        .select('nombre')
        .eq('id', orden.taller_id)
        .single()

      // supabase-js no lanza: sin esto, el día que alguien vuelva a tocar el
      // nombre de una columna, los mensajes vuelven a decir "el taller" y no
      // se entera nadie.
      if (errorTaller) {
        console.error('[cron seguimiento] no se pudo leer el taller:', errorTaller.message)
      }

      // El enlace de reseña vive en `resenas_config`, que es donde lo guarda la
      // pantalla de Reseñas. `talleres.google_review_url` es de un flujo
      // anterior y está vacía en los 83 talleres.
      const { data: configResenas } = await supabase
        .from('resenas_config')
        .select('google_review_url')
        .eq('taller_id', orden.taller_id)
        .maybeSingle()

      const cliente = orden.clientes as { nombre: string; telefono: string | null } | null
      if (!cliente) return

      const mensaje = mensajeSeguimiento({
        nombre:       cliente.nombre,
        marca:        orden.vehiculo_marca,
        modelo:       orden.vehiculo_modelo,
        tallerNombre: taller?.nombre ?? 'el taller',
        linkResena:   configResenas?.google_review_url ?? null,
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
