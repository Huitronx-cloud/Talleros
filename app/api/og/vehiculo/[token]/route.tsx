import { ImageResponse } from 'next/og'
import { createClient } from '@supabase/supabase-js'
import { TarjetaTaller, logoUsable } from '@/lib/og-tarjeta'

export const runtime = 'edge'

/**
 * La imagen del enlace permanente del coche.
 *
 * Este enlace acaba en manos de quien compra el vehículo, así que la tarjeta
 * es la mejor carta de presentación que tiene el taller: enseña su nombre y su
 * logo a alguien que todavía no es cliente suyo.
 */
export async function GET(
  _req: Request,
  { params }: { params: { token: string } }
) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data, error } = await supabase.rpc('get_historial_vehiculo', { p_token: params.token })

  if (error || !data) {
    return new Response('No encontrado', { status: 404 })
  }

  const vehiculo = (data as any).vehiculo ?? {}
  const taller   = (data as any).taller   ?? {}

  const nombreCoche = [vehiculo.anio, vehiculo.marca, vehiculo.modelo]
    .map((p: any) => String(p ?? '').trim())
    .filter((p: string) => p !== '' && p !== '0')
    .join(' ')

  return new ImageResponse(
    (
      <TarjetaTaller
        tallerNombre={taller.nombre ?? 'Tu taller'}
        logoUrl={await logoUsable(taller.logo_url)}
        linea={nombreCoche ? `Historial de servicio · ${nombreCoche}` : 'Historial de servicio del vehículo'}
        pie={vehiculo.placas ?? null}
      />
    ),
    { width: 1200, height: 630 }
  )
}
