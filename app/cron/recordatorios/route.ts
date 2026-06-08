import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { createClient } from '@/lib/supabase/server'
import { enviarNotificacion, mensajeRecordatorioMantenimiento } from '@/lib/notificaciones'

export async function GET(request: Request) {
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const supabase = createClient()
  const hoy = new Date().toISOString().split('T')[0]

  const { data: ordenes, error } = await supabase
    .from('ordenes')
    .select('id, taller_id, cliente_id, vehiculo_marca, vehiculo_modelo, clientes(nombre, telefono)')
    .eq('recordatorio_fecha', hoy)
    .eq('recordatorio_enviado', false)
    .eq('estado', 'entregado')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const resultados = await Promise.allSettled(
    (ordenes ?? []).map(async (orden) => {
      const { data: taller } = await supabase
        .from('talleres')
        .select('nombre')
        .eq('id', orden.taller_id)
        .single()

      const cliente = (Array.isArray(orden.clientes) ? orden.clientes[0] : orden.clientes) as { nombre: string; telefono: string | null } | null
      if (!cliente) return

      const mensaje = mensajeRecordatorioMantenimiento({
        nombre: cliente.nombre,
        marca: orden.vehiculo_marca,
        modelo: orden.vehiculo_modelo,
        tallerNombre: taller?.nombre ?? 'el taller',
      })

      await enviarNotificacion({
        supabase,
        tallerId: orden.taller_id,
        ordenId: orden.id,
        clienteId: orden.cliente_id,
        telefono: cliente.telefono,
        tipo: 'recordatorio',
        mensaje,
      })

      await supabase
        .from('ordenes')
        .update({ recordatorio_enviado: true })
        .eq('id', orden.id)
    })
  )

  const enviados = resultados.filter(r => r.status === 'fulfilled').length
  const fallidos = resultados.filter(r => r.status === 'rejected').length

  return NextResponse.json({ enviados, fallidos, total: ordenes?.length ?? 0 })
}