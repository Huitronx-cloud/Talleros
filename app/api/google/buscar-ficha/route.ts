export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Busca la ficha del taller en Google, para no tener que pedirle el enlace.
 *
 * ── El problema que resuelve ────────────────────────────────────────────────
 *
 * Las solicitudes de reseña están construidas y funcionan, pero exigen un
 * `google_review_url`. Hoy la pantalla de Reseñas se lo pide al taller con un
 * campo de texto y estas instrucciones: "búscate en Google Maps, haz clic en tu
 * negocio, Obtener más reseñas".
 *
 * Eso no es pereza del taller: es una tarea que un mecánico no sabe hacer. Se
 * mete a Maps, no encuentra ese menú, y abandona. Resultado medido: de 83
 * talleres reales, 2 tienen el enlace puesto, y en toda la historia de la
 * plataforma no ha salido ni una solicitud de reseña.
 *
 * Con el nombre y la dirección que el taller YA nos dio al registrarse podemos
 * buscar su ficha nosotros y enseñarle "¿Es este tu taller?". Un sí, y listo.
 *
 * ── Sobre la clave ─────────────────────────────────────────────────────────
 *
 * `GOOGLE_MAPS_API_KEY` es la misma que usaba el agente de prospección, que
 * hizo 518 búsquedas con place_id entre mayo y julio antes de apagarse. O sea
 * que la clave y la API funcionaban. Lleva sin usarse desde el 2 de julio, así
 * que si la rotaron o se quedó sin facturación esto lo dirá con un mensaje en
 * vez de romperse: el taller siempre puede seguir pegando el enlace a mano.
 */
const GOOGLE_API_KEY = process.env.GOOGLE_MAPS_API_KEY

interface Candidato {
  place_id:  string
  nombre:    string
  direccion: string
}

export async function POST() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  if (!GOOGLE_API_KEY) {
    return NextResponse.json({
      error: 'La búsqueda automática no está disponible ahora mismo. Puedes pegar tu enlace a mano.',
    }, { status: 503 })
  }

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('taller_id')
    .eq('id', user.id)
    .single()

  if (!usuario?.taller_id) {
    return NextResponse.json({ error: 'No se encontró tu taller' }, { status: 400 })
  }

  const { data: taller, error: errorTaller } = await supabase
    .from('talleres')
    .select('nombre, direccion, ciudad, pais')
    .eq('id', usuario.taller_id)
    .single()

  // supabase-js no lanza: sin esto un fallo aquí se vería igual que "no
  // encontramos tu taller en Google", que es un diagnóstico completamente
  // distinto y manda al taller a buscar donde no es.
  if (errorTaller || !taller) {
    console.error('[buscar-ficha] no se pudo leer el taller:', errorTaller?.message)
    return NextResponse.json({ error: 'No se pudieron leer los datos de tu taller' }, { status: 500 })
  }

  if (!taller.nombre?.trim()) {
    return NextResponse.json({ error: 'Tu taller no tiene nombre guardado' }, { status: 400 })
  }

  // La dirección afina mucho la búsqueda, pero no se exige: un taller sin
  // dirección guardada todavía puede aparecer por nombre y ciudad.
  const consulta = [taller.nombre, taller.direccion, taller.ciudad]
    .filter(t => t && String(t).trim())
    .join(' ')
    .trim()

  try {
    const url =
      'https://maps.googleapis.com/maps/api/place/textsearch/json' +
      `?query=${encodeURIComponent(consulta)}` +
      `&key=${GOOGLE_API_KEY}&language=es`

    // Sin tiempo límite esto puede colgar la pantalla del taller esperando a
    // Google. Ocho segundos y se rinde con un mensaje.
    const res  = await fetch(url, { signal: AbortSignal.timeout(8_000), cache: 'no-store' })
    const data = await res.json()

    if (data.status === 'ZERO_RESULTS') {
      return NextResponse.json({ candidatos: [] })
    }

    if (data.status !== 'OK') {
      console.error(`[buscar-ficha] Places status=${data.status} error=${data.error_message ?? ''}`)
      return NextResponse.json({
        error: 'Google no respondió a la búsqueda. Puedes pegar tu enlace a mano.',
      }, { status: 502 })
    }

    // Cinco como mucho: la idea es reconocer el suyo de un vistazo, no leer una
    // lista. Si el suyo no está entre los cinco primeros, la búsqueda por
    // nombre y dirección no lo va a encontrar más abajo.
    const candidatos: Candidato[] = (data.results ?? [])
      .slice(0, 5)
      .map((r: any) => ({
        place_id:  r.place_id,
        nombre:    r.name ?? '',
        direccion: r.formatted_address ?? '',
      }))
      .filter((c: Candidato) => c.place_id && c.nombre)

    return NextResponse.json({ candidatos })
  } catch (e: any) {
    const porTiempo = e?.name === 'TimeoutError'
    console.error('[buscar-ficha] fallo llamando a Places:', e?.message ?? e)
    return NextResponse.json({
      error: porTiempo
        ? 'Google tardó demasiado en responder. Inténtalo otra vez o pega tu enlace a mano.'
        : 'No se pudo hacer la búsqueda. Puedes pegar tu enlace a mano.',
    }, { status: 502 })
  }
}
