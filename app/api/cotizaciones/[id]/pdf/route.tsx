import { renderToBuffer } from '@react-pdf/renderer'
import { createClient } from '@/lib/supabase/server'
import { Cotizacion, Taller } from '@/types'
import CotizacionDocumento from '@/lib/pdf/cotizacion-documento'

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()

  // Verificar sesión
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('No autorizado', { status: 401 })

  // Cargar cotización
  const { data: cotizacion, error: errCot } = await supabase
    .from('cotizaciones')
    .select('*, clientes(nombre, telefono, email)')
    .eq('id', params.id)
    .single()

  if (errCot || !cotizacion) {
    return new Response('Cotización no encontrada', { status: 404 })
  }

  // Cargar datos del taller via función security definer (evita recursión en RLS)
  const { data: taller, error: errTaller } = await supabase
    .rpc('get_taller_para_pdf', { p_taller_id: cotizacion.taller_id })

  if (!taller) return new Response('Taller no encontrado', { status: 404 })

  try {
    const buffer = await renderToBuffer(
      <CotizacionDocumento
        cotizacion={cotizacion as Cotizacion}
        taller={taller as Taller}
      />
    )

    const numero = String(cotizacion.numero_cotizacion).padStart(4, '0')

    return new Response(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="cotizacion-${numero}.pdf"`,
      },
    })
  } catch (e) {
    console.error('[PDF] Error generando PDF:', e)
    return new Response('Error al generar el PDF', { status: 500 })
  }
}
