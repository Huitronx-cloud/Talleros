import { ImageResponse } from 'next/og'
import { createClient } from '@supabase/supabase-js'
import { TarjetaTaller, logoUsable } from '@/lib/og-tarjeta'

export const runtime = 'edge'

/**
 * La imagen que WhatsApp enseña al pegar el enlace del portal.
 *
 * Antes salía la de TallerOS: el cliente de un taller recibía el anuncio del
 * software que usa su mecánico. Ahora sale el taller.
 *
 * Va por token, el mismo del portal, así que no expone nada que quien tiene el
 * enlace no vea ya al abrirlo.
 */
export async function GET(
  _req: Request,
  { params }: { params: { token: string } }
) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data, error } = await supabase.rpc('get_portal_data', { p_token: params.token })

  // Sin tarjeta es mejor que con una tarjeta equivocada: WhatsApp enseña el
  // enlace pelado y ya está.
  if (error || !data || (data as any).expirado) {
    return new Response('No encontrado', { status: 404 })
  }

  const orden  = (data as any).orden  ?? {}
  const taller = (data as any).taller ?? {}

  const vehiculo = [orden.vehiculo_marca, orden.vehiculo_modelo]
    .filter(Boolean).join(' ')

  return new ImageResponse(
    (
      <TarjetaTaller
        tallerNombre={taller.nombre ?? 'Tu taller'}
        logoUrl={await logoUsable(taller.logo_url)}
        linea={vehiculo ? `Estado de tu ${vehiculo} en tiempo real` : 'Estado de tu vehículo en tiempo real'}
        pie={orden.placas ?? null}
      />
    ),
    { width: 1200, height: 630 }
  )
}
