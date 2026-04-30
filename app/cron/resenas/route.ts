import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { enviarNotificacion, mensajeResena } from '@/lib/notificaciones'

export async function GET(request: Request) {
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const supabase = createClient()

  const hace3Dias = new Date()
  hace3Dias.setDate(hace3Dias.getDate() - 3)
  const fecha3Dias = hace3Dias.toISOString().split('T')[0]

  const { data: ordenes, error } = await supabase
    .from('ordenes')
    .select('id, taller_id, cliente_id, vehiculo_marca, vehiculo_modelo, clientes(nombre, telefono), talleres(nombre, google_review_url)')
    .eq('estado', 'entregado')
    .eq('resena_enviada', false)
    .lte('fecha_entrega', fecha3Dias)
    .not('fecha_entrega', 'is', null)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const resultados = await Promise.allSettled(
    (ordenes ?? []).map(async (orden) => {
      const cliente = (Array.isArray(orden.clientes) ? orden.clientes[0] : orden.clientes) as { nombre: string; telefono: string | null } | null
      const taller = (Array.isArray(orden.talleres) ? orden.talleres[0] : orden.talleres) as { nombre: string; google_review_url: string | null } | null

      if (!cliente || !taller?.google_review_url) return

      const mensaje = mensajeResena({
        nombre: cliente.nombre,
        marca: orden.vehiculo_marca,
        modelo: orden.vehiculo_modelo,
        tallerNombre: taller.nombre,
        googleReviewUrl: taller.google_review_url,
      })

      await enviarNotificacion({
        supabase,
        tallerId: orden.taller_id,
        ordenId: orden.id,
        clienteId: orden.cliente_id,
        telefono: cliente.telefono,
        tipo: 'seguimiento',
        mensaje,
      })

      await supabase
        .from('ordenes')
        .update({ resena_enviada: true })
        .eq('id', orden.id)
    })
  )

  const enviados = resultados.filter(r => r.status === 'fulfilled').length
  const fallidos = resultados.filter(r => r.status === 'rejected').length

  return NextResponse.json({ enviados, fallidos, total: ordenes?.length ?? 0 })
}