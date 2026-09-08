import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { normalizarVin, vinValido, problemaVin, mapearNhtsa, DatosVin } from '@/lib/vin'

export const dynamic = 'force-dynamic'

/**
 * Decodifica un VIN: primero en nuestro caché, y si no está, en NHTSA.
 *
 * ── Por qué esto NUNCA devuelve 500 ────────────────────────────────────────
 *
 * Un 500 invita a quien llama a tratarlo como un fallo grave, y esto no lo es
 * nunca: es una consulta de apoyo. Si NHTSA tarda, se cae o no sabe del coche,
 * la respuesta es 200 con `encontrado: false` y un motivo, y la pantalla sigue
 * su vida. El taller no depende de esto para nada suyo.
 *
 * ── Por qué pasa por nuestro servidor ──────────────────────────────────────
 *
 * Llamar a NHTSA desde el navegador no funcionaría (CORS), no se podría
 * cachear, y expondría a cada mecánico a un tercero. Aquí se llama una vez por
 * VIN en toda la plataforma.
 */

const TIMEOUT_MS = 3000
const NHTSA = 'https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues'

export async function GET(
  _req: Request,
  { params }: { params: { vin: string } }
) {
  const vin = normalizarVin(decodeURIComponent(params.vin))

  if (!vinValido(vin)) {
    return NextResponse.json({ encontrado: false, motivo: problemaVin(vin) })
  }

  const supabase = createServiceClient()

  // ── 1. El caché ──────────────────────────────────────────────────────────
  const { data: guardado, error: errorCache } = await supabase
    .from('vin_cache')
    .select('*')
    .eq('vin', vin)
    .maybeSingle()

  // Un fallo leyendo el caché no puede cortar la consulta: se sigue a NHTSA.
  // Pero se registra, que es lo que no hacíamos y por eso los fallos vivían
  // meses sin que nadie los viera.
  if (errorCache) {
    console.error('[vin] no se pudo leer el caché:', errorCache.message, '· vin:', vin)
  }

  if (guardado) {
    return NextResponse.json({ encontrado: true, origen: 'cache', datos: aRespuesta(guardado) })
  }

  // ── 2. NHTSA ─────────────────────────────────────────────────────────────
  let crudo: Record<string, unknown> | null = null
  try {
    const res = await fetch(`${NHTSA}/${vin}?format=json`, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { accept: 'application/json' },
      cache: 'no-store',
    })
    if (!res.ok) throw new Error(`NHTSA respondió ${res.status}`)

    const json = await res.json()
    crudo = json?.Results?.[0] ?? null
  } catch (err) {
    const motivo = err instanceof Error ? err.message : String(err)
    console.error('[vin] NHTSA no respondió:', motivo, '· vin:', vin)
    return NextResponse.json({
      encontrado: false,
      motivo: 'No pudimos consultar el catálogo externo. Puedes escribir los datos a mano.',
    })
  }

  if (!crudo) {
    return NextResponse.json({ encontrado: false, motivo: 'NHTSA no tiene datos de este VIN.' })
  }

  const datos = mapearNhtsa(crudo)

  // Sin marca no hay nada que enseñar: es lo mínimo que devuelve NHTSA cuando
  // sabe algo del coche. Tampoco se guarda, para poder reintentarlo si algún
  // día lo añaden.
  if (!datos.marca) {
    return NextResponse.json({ encontrado: false, motivo: 'NHTSA no reconoce este VIN.' })
  }

  // ── 3. Guardar para la próxima ───────────────────────────────────────────
  const { error: errorGuardar } = await supabase.from('vin_cache').upsert({
    vin,
    marca:       datos.marca,
    modelo:      datos.modelo,
    anio:        datos.anio,
    motor:       datos.motor,
    version:     datos.version,
    transmision: datos.transmision,
    traccion:    datos.traccion,
    carroceria:  datos.carroceria,
    rin:         datos.rin,
    fabricante:  datos.fabricante,
    planta:      datos.planta,
    limpio:      datos.limpio,
    datos:       crudo,
  })

  // Si no se pudo guardar, la respuesta sale igual: el mecánico tiene sus
  // datos y lo único que se pierde es ahorrarnos la próxima consulta.
  if (errorGuardar) {
    console.error('[vin] no se pudo guardar en el caché:', errorGuardar.message, '· vin:', vin)
  }

  return NextResponse.json({ encontrado: true, origen: 'nhtsa', datos })
}

/** De la fila del caché a la misma forma que devuelve NHTSA recién mapeado. */
function aRespuesta(fila: Record<string, any>): DatosVin {
  return {
    marca:       fila.marca,
    modelo:      fila.modelo,
    anio:        fila.anio,
    motor:       fila.motor,
    version:     fila.version,
    transmision: fila.transmision,
    traccion:    fila.traccion,
    carroceria:  fila.carroceria,
    rin:         fila.rin,
    fabricante:  fila.fabricante,
    planta:      fila.planta,
    limpio:      fila.limpio ?? false,
  }
}
