import { renderToBuffer } from '@react-pdf/renderer'
import { createClient } from '@/lib/supabase/server'
import { Orden, Taller } from '@/types'
import OrdenDocumento from '@/lib/pdf/orden-documento'

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('No autorizado', { status: 401 })

  const { data: orden, error } = await supabase
    .from('ordenes')
    .select('*, clientes(nombre, telefono)')
    .eq('id', params.id)
    .single()

  if (error || !orden) return new Response('Orden no encontrada', { status: 404 })

  const { data: taller } = await supabase
    .rpc('get_taller_para_pdf', { p_taller_id: orden.taller_id })

  if (!taller) return new Response('Taller no encontrado', { status: 404 })

  try {
    const buffer = await renderToBuffer(
      <OrdenDocumento
        orden={orden as Orden}
        taller={taller as Taller}
      />
    )

    const numero = String(orden.numero_orden).padStart(4, '0')

    return new Response(buffer as unknown as BodyInit, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="orden-${numero}.pdf"`,
      },
    })
  } catch (e) {
    console.error('[PDF Orden] Error:', e)
    return new Response('Error al generar PDF', { status: 500 })
  }
}