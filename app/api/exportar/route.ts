import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import * as XLSX from 'xlsx'

export async function GET() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('taller_id')
    .eq('id', user.id)
    .single()

  const tallerId = usuario?.taller_id ?? ''

  const [
    { data: clientes },
    { data: ordenes },
    { data: cotizaciones },
  ] = await Promise.all([
    supabase.from('clientes').select('*').eq('taller_id', tallerId).order('created_at', { ascending: false }),
    supabase.from('ordenes').select('*, clientes(nombre)').eq('taller_id', tallerId).order('created_at', { ascending: false }),
    supabase.from('cotizaciones').select('*, clientes(nombre)').eq('taller_id', tallerId).order('created_at', { ascending: false }),
  ])

  const wb = XLSX.utils.book_new()

  // Hoja de Clientes
  const clientesData = (clientes ?? []).map(c => ({
    'Nombre': c.nombre,
    'Teléfono': c.telefono ?? '',
    'Email': c.email ?? '',
    'Marca': c.vehiculo_marca ?? '',
    'Modelo': c.vehiculo_modelo ?? '',
    'Año': c.vehiculo_año ?? '',
    'Placas': c.placas ?? '',
    'Fecha registro': new Date(c.created_at).toLocaleDateString('es-MX'),
  }))
  const wsClientes = XLSX.utils.json_to_sheet(clientesData)
  XLSX.utils.book_append_sheet(wb, wsClientes, 'Clientes')

  // Hoja de Órdenes
  const ordenesData = (ordenes ?? []).map((o: any) => ({
    'No. Orden': o.numero_orden,
    'Cliente': o.clientes?.nombre ?? '',
    'Estado': o.estado,
    'Problema': o.descripcion_problema ?? '',
    'Mecánico': o.mecanico_asignado ?? '',
    'Subtotal': o.subtotal ?? 0,
    'Descuento': o.descuento ?? 0,
    'Total': o.total ?? 0,
    'Forma de pago': o.forma_pago ?? '',
    'Fecha entrada': o.fecha_entrada ?? '',
    'Fecha prometida': o.fecha_prometida ?? '',
    'Fecha entrega': o.fecha_entrega ?? '',
  }))
  const wsOrdenes = XLSX.utils.json_to_sheet(ordenesData)
  XLSX.utils.book_append_sheet(wb, wsOrdenes, 'Órdenes')

  // Hoja de Cotizaciones
  const cotizacionesData = (cotizaciones ?? []).map((c: any) => ({
    'No. Cotización': c.numero_cotizacion,
    'Cliente': c.clientes?.nombre ?? '',
    'Estado': c.estado,
    'Subtotal': c.subtotal ?? 0,
    'Descuento': c.descuento ?? 0,
    'Total': c.total ?? 0,
    'Moneda': c.moneda ?? 'MXN',
    'Fecha': new Date(c.created_at).toLocaleDateString('es-MX'),
  }))
  const wsCotizaciones = XLSX.utils.json_to_sheet(cotizacionesData)
  XLSX.utils.book_append_sheet(wb, wsCotizaciones, 'Cotizaciones')

  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="talleros-export-${new Date().toISOString().split('T')[0]}.xlsx"`,
    },
  })
}