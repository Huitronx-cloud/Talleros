export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getPais } from '@/lib/paises'
import { horasDeCita } from '@/lib/calendario'

const CLIENT_ID     = process.env.GOOGLE_CLIENT_ID!
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!

async function refrescarToken(refreshToken: string): Promise<string | null> {
  try {
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id:     CLIENT_ID,
        client_secret: CLIENT_SECRET,
        refresh_token: refreshToken,
        grant_type:    'refresh_token',
      }).toString(),
    })
    const data = await res.json()
    return data.access_token ?? null
  } catch { return null }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const { cita_id } = await req.json()

    // Obtener datos del taller
    const { data: usuario } = await supabase
      .from('usuarios')
      .select('taller_id')
      .eq('id', user.id)
      .single()

    const { data: taller } = await supabase
      .from('talleres')
      .select('nombre, pais, google_access_token, google_refresh_token, google_token_expiry')
      .eq('id', usuario?.taller_id)
      .single()

    if (!taller?.google_access_token) {
      return NextResponse.json({
        error: 'Google Calendar no conectado',
        conectar: '/api/google/connect'
      }, { status: 400 })
    }

    // Refrescar token si expiró
    let accessToken = taller.google_access_token
    const expiry    = new Date(taller.google_token_expiry ?? 0)
    if (expiry < new Date() && taller.google_refresh_token) {
      const nuevoToken = await refrescarToken(taller.google_refresh_token)
      if (nuevoToken) {
        accessToken = nuevoToken
        await supabase
          .from('talleres')
          .update({
            google_access_token: nuevoToken,
            google_token_expiry: new Date(Date.now() + 3600 * 1000).toISOString(),
          })
          .eq('id', usuario?.taller_id)
      }
    }

    // Obtener datos de la cita.
    //
    // Antes esto pedía `duracion_minutos`, `notas` y `servicio`, y unía con
    // `clientes` y `vehiculos`. Nada de eso existe: `citas` guarda el cliente y
    // el coche en SUS PROPIAS columnas, sin enlace a ninguna tabla. La consulta
    // fallaba entera, así que este endpoint no ha funcionado nunca — tampoco se
    // notaba, porque hasta ahora ninguna pantalla lo llamaba.
    const { data: cita } = await supabase
      .from('citas')
      .select('id, fecha, hora, descripcion, cliente_nombre, cliente_telefono, cliente_email, vehiculo_marca, vehiculo_modelo, placas')
      .eq('id', cita_id)
      .eq('taller_id', usuario?.taller_id)
      .single()

    if (!cita) {
      return NextResponse.json({ error: 'Cita no encontrada' }, { status: 404 })
    }

    // La hora se manda SIN zona y con `timeZone` al lado, para que Google la
    // interprete en el reloj del taller. Antes se mandaba como instante
    // absoluto calculado con el reloj del servidor —UTC en Vercel—, así que una
    // cita de las 10:00 habría caído a las 4:00 de la madrugada.
    const horas = horasDeCita(cita.fecha, cita.hora, 60)
    if (!horas) {
      return NextResponse.json({ error: 'La cita no tiene una fecha y hora válidas' }, { status: 400 })
    }

    const zona = getPais(taller.pais).zona

    const vehiculo = [cita.vehiculo_marca, cita.vehiculo_modelo].filter(Boolean).join(' ')

    const evento = {
      summary:     `🔧 ${cita.cliente_nombre ?? 'Cliente'}${vehiculo ? ` — ${vehiculo}` : ''}`,
      description: [
        `Taller: ${taller.nombre}`,
        `Cliente: ${cita.cliente_nombre ?? '—'}`,
        `Teléfono: ${cita.cliente_telefono ?? '—'}`,
        vehiculo || cita.placas
          ? `Vehículo: ${[vehiculo, cita.placas ? `(${cita.placas})` : ''].filter(Boolean).join(' ')}`
          : '',
        cita.descripcion ? `Motivo: ${cita.descripcion}` : '',
      ].filter(Boolean).join('\n'),
      start: { dateTime: horas.inicio, timeZone: zona },
      end:   { dateTime: horas.fin,    timeZone: zona },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: 30 },
          { method: 'email', minutes: 60 },
        ],
      },
      colorId: '9', // Azul — color de TallerOS
    }

    // Crear evento en Google Calendar
    const calRes = await fetch(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events',
      {
        method:  'POST',
        headers: {
          Authorization:  `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(evento),
      }
    )

    const calData = await calRes.json()

    if (!calRes.ok) {
      console.error('Calendar error:', calData)
      return NextResponse.json({ error: 'Error creando evento en Calendar' }, { status: 500 })
    }

    // Guardar el id del evento para no duplicarlo si se pulsa dos veces.
    const { error: errorGuardar } = await supabase
      .from('citas')
      .update({ google_calendar_event_id: calData.id })
      .eq('id', cita_id)
      .eq('taller_id', usuario?.taller_id)

    // El evento YA está en su calendario, así que esto no es un fallo que deba
    // devolver error: solo significa que si vuelve a pulsar saldrá duplicado.
    if (errorGuardar) {
      console.error('[calendar] evento creado pero no se guardó su id:', errorGuardar.message)
    }

    return NextResponse.json({
      ok:       true,
      event_id: calData.id,
      html_link: calData.htmlLink,
    })
  } catch (error: any) {
    console.error('Calendar sync error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
