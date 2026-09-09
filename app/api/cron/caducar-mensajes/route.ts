import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
export const revalidate = 0
import { createServiceClient } from '@/lib/supabase/service'
import { DIAS_DE_VIDA } from '@/lib/mensajes-pendientes'

/**
 * Retira de la cola los mensajes a los que se les pasó el momento.
 *
 * Un aviso de "su vehículo está listo" mandado a las siete semanas le llega a
 * un cliente que recogió el coche hace mes y medio, y deja al taller peor que
 * si no le hubiera escrito. Los plazos y el porqué de cada uno están en
 * lib/mensajes-pendientes.ts.
 *
 * Marca, no borra: `caducado` es un estado distinto de `descartado`, que
 * significa que una persona decidió que no. Saber cuál de las dos cosas pasa
 * es justo lo que nos dice si la función está funcionando.
 */
export async function GET(request: Request) {
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  // Service role: el cron corre sin sesión, y los talleres solo pueden
  // actualizar los suyos por RLS.
  const supabase = createServiceClient()

  let caducados = 0
  const fallos: string[] = []

  // Una pasada por tipo. Son siete tipos con dos o tres plazos distintos, y
  // así cada consulta es un `update ... where` simple en vez de un `case`
  // metido a mano en SQL desde el cliente.
  for (const [tipo, dias] of Object.entries(DIAS_DE_VIDA)) {
    const limite = new Date(Date.now() - dias * 24 * 60 * 60 * 1000).toISOString()

    const { data, error } = await supabase
      .from('mensajes_pendientes')
      .update({ estado: 'caducado' })
      .eq('estado', 'pendiente')
      .eq('tipo', tipo)
      .lt('created_at', limite)
      .select('id')

    // supabase-js no lanza: sin esto, un fallo aquí sería indistinguible de
    // "no había nada que caducar" y la cola se seguiría pudriendo en silencio.
    if (error) {
      console.error(`[caducar] ${tipo}:`, error.message)
      fallos.push(tipo)
      continue
    }

    caducados += data?.length ?? 0
  }

  console.log(`[cron caducar-mensajes] caducados=${caducados} fallos=${fallos.length}`)

  return NextResponse.json({ caducados, fallos })
}
